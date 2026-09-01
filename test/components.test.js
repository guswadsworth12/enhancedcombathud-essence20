import test from "node:test";
import assert from "node:assert/strict";
import {
  activatePower,
  buildUtilityTooltipData,
  buildSkillRollDataset,
  formatSkillRank,
  formatSkillStatus,
  rollInitiative,
  showUtilityInfo
} from "../scripts/components.js";

const skill = {
  key: "athletics",
  essences: ["strength"],
  shift: "d4",
  modifier: 2,
  shiftUp: 1,
  shiftDown: 0,
  specialized: true,
  canCritD2: true,
  edge: true,
  snag: false
};

test("builds the native Essence20 skill-roll dataset", () => {
  assert.deepEqual(buildSkillRollDataset(skill), {
    skill: "athletics",
    essence: "strength",
    shift: "d4",
    shiftUp: 1,
    shiftDown: 0,
    isSpecialized: true,
    canCritD2: true
  });
});

test("formats compact skill drawer values", () => {
  assert.equal(formatSkillRank(skill), "d4 +2");
  assert.equal(formatSkillStatus(skill), "★ E");
  assert.equal(formatSkillStatus({ ...skill, specialized: false, edge: false }), "—");
});

test("initiative refuses non-owner calls", async () => {
  globalThis.game = { i18n: { localize: (key) => key } };
  let warning = null;
  globalThis.ui = { notifications: { warn: (message) => { warning = message; } } };
  let rolls = 0;

  await rollInitiative({ isOwner: false, rollInitiative() { rolls += 1; } });

  assert.equal(rolls, 0);
  assert.equal(warning, "ECHESSENCE20.Errors.NotOwner");
});

test("activates powers through Essence20's native powerCost helper", async () => {
  const actor = { id: "actor" };
  const power = { id: "power" };
  let calledWith = null;

  await activatePower(actor, power, async () => ({
    powerCost: (...args) => { calledWith = args; }
  }));

  assert.deepEqual(calledWith, [actor, power]);
});

test("falls back to power information when the native handler cannot load", async () => {
  let dataset = null;
  const oldWarn = console.warn;
  console.warn = () => {};
  try {
    await activatePower({}, { roll: (value) => { dataset = value; } }, async () => {
      throw new Error("missing handler");
    });
  } finally {
    console.warn = oldWarn;
  }

  assert.deepEqual(dataset, {});
});

test("builds an enriched Argon tooltip for utility Items", async () => {
  globalThis.game = { i18n: { localize: (key) => key } };
  const data = await buildUtilityTooltipData({
    name: "Fixture Shield",
    type: "shield",
    description: "A safe fixture description.",
    equipped: true,
    active: false,
    quantity: null,
    classification: "light",
    traits: ["deflective"],
    source: "Fixture Guide",
    document: {}
  }, async (html) => `<p>${html}</p>`);

  assert.equal(data.subtitle, "ECHESSENCE20.Actions.UtilityTypes.shield");
  assert.equal(data.description, "<p>A safe fixture description.</p>");
  assert.deepEqual(data.details.map(({ value }) => value), [
    "ECHESSENCE20.Tooltips.Yes",
    "ECHESSENCE20.Tooltips.No"
  ]);
  assert.deepEqual(data.properties.map(({ label }) => label), ["light", "deflective"]);
});

test("utility information refuses non-owner calls", async () => {
  globalThis.game = { i18n: { localize: (key) => key } };
  let warning = null;
  globalThis.ui = { notifications: { warn: (message) => { warning = message; } } };
  let rolls = 0;

  await showUtilityInfo({ isOwner: false }, { roll() { rolls += 1; } });

  assert.equal(rolls, 0);
  assert.equal(warning, "ECHESSENCE20.Errors.NotOwner");
});
