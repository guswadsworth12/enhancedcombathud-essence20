import test from "node:test";
import assert from "node:assert/strict";
import {
  activatePower,
  buildUtilityTooltipData,
  buildSkillRollDataset,
  formatSkillRank,
  formatSkillStatus,
  movementSpaces,
  rollInitiative,
  runNamedHudAction,
  showUtilityInfo,
  toggleMorph
} from "../scripts/components.js";
import { rangerFixture } from "./fixtures/actors.js";

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

test("converts Essence20 movement modes to scene spaces", () => {
  const actor = {
    ...rangerFixture,
    system: {
      ...rangerFixture.system,
      movement: {
        ...rangerFixture.system.movement,
        aerial: { base: 20, bonus: 5, total: 25 }
      }
    }
  };
  assert.equal(movementSpaces(actor, "walk", 5), 6);
  assert.equal(movementSpaces(actor, "fly", 5), 5);
  assert.equal(movementSpaces(actor, "burrow", 5), 0);
  assert.equal(movementSpaces(actor, "unknown", 5), 6);
  assert.equal(movementSpaces(actor, "walk", 0), 0);
});

test("passes beta specialization keys to the native skill roll", () => {
  assert.deepEqual(buildSkillRollDataset(skill, {
    key: "climbing", name: "Climbing", shift: "d6", specialized: true
  }), {
    skill: "athletics", essence: "strength", shift: "d6", shiftUp: 1,
    shiftDown: 0, isSpecialized: true, canCritD2: true,
    specializationKey: "climbing", specializationName: "Climbing"
  });
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

test("Morph delegates to the native owned actor helper", async () => {
  let calls = 0;
  let rebinds = 0;
  let updateActor = null;
  globalThis.Hooks = {
    on(name, callback) {
      assert.equal(name, "updateActor");
      updateActor = callback;
      return 17;
    },
    off(name, id) {
      assert.equal(name, "updateActor");
      assert.equal(id, 17);
    }
  };
  const target = { id: "token" };
  globalThis.ui.ARGON = {
    _target: target,
    async bind(boundTarget) {
      assert.equal(boundTarget, target);
      rebinds += 1;
    }
  };
  const actor = {
    uuid: "Actor.test",
    isOwner: true,
    system: { isMorphed: false },
    morph() { calls += 1; }
  };
  const toggled = toggleMorph(actor);
  assert.equal(calls, 1);
  assert.equal(rebinds, 0);
  actor.system.isMorphed = true;
  updateActor(actor);
  await toggled;
  assert.equal(rebinds, 1);
  delete globalThis.ui.ARGON;
  delete globalThis.Hooks;
});

test("Morph refuses non-owner calls", async () => {
  globalThis.game = { i18n: { localize: (key) => key } };
  let warning = null;
  globalThis.ui = { notifications: { warn: (message) => { warning = message; } } };
  let calls = 0;

  await toggleMorph({ isOwner: false, morph() { calls += 1; } });

  assert.equal(calls, 0);
  assert.equal(warning, "ECHESSENCE20.Errors.NotOwner");
});

test("activates powers through Essence20's native powerCost helper", async () => {
  const actor = { id: "actor", isOwner: true };
  const power = { id: "power", parent: actor };
  let calledWith = null;

  await activatePower(actor, power, async (path) => path.includes("power-handler")
    ? { powerCost: (...args) => { calledWith = args; } }
    : path.includes("power-use") ? { canUsePower: () => true }
      : { hasItemUse: () => false });

  assert.deepEqual(calledWith, [actor, power]);
});

test("delegates a Power's own Use to the native item-use handler", async () => {
  const actor = { isOwner: true };
  const power = { parent: actor };
  let used = false;
  await activatePower(actor, power, async (path) => path.includes("banked-buffs")
    ? { hasItemUse: () => true, canUsePerk: () => true, onPerkUse: () => { used = true; } }
    : path.includes("power-use") ? { canUsePower: () => true }
      : { powerCost: () => { throw new Error("double cost"); } });
  assert.equal(used, true);
});

test("does not bypass native Power automation when its handler is missing", async () => {
  const actor = { isOwner: true };
  const power = { parent: actor };
  await assert.rejects(activatePower(actor, power, async () => {
    throw new Error("missing handler");
  }), /missing handler/);
});

test("unavailable Powers do not roll or spend", async () => {
  const actor = { isOwner: true };
  const power = { parent: actor };
  let spent = false;
  let warning = null;
  globalThis.game = { i18n: { localize: (key) => key } };
  globalThis.ui = { notifications: { warn: (message) => { warning = message; } } };
  await activatePower(actor, power, async (path) => path.includes("banked-buffs")
    ? { hasItemUse: () => false }
    : path.includes("power-use") ? { canUsePower: () => false }
      : { powerCost: () => { spent = true; } });
  assert.equal(spent, false);
  assert.equal(warning, "ECHESSENCE20.Errors.PowerUnavailable");
});

test("named action spends through the native ledger and refunds a cancelled effect", async () => {
  const actor = { name: "Fixture Ranger", isOwner: true };
  const calls = [];
  globalThis.game = { i18n: { localize: (key) => key, format: (key) => key } };
  globalThis.ui = { notifications: { warn() {} }, ARGON: { refresh() { calls.push("refresh"); } } };
  const economy = {
    getActionsTabContext: () => ({ live: true, groups: [{ actions: [{
      key: "defend", label: "E20.ActionDefend"
    }] }] }),
    isAiming: () => false,
    getNamedActionType: () => "standard",
    spend: (...args) => { calls.push(args); return { blocked: false, spendId: "spent-1" }; },
    refund: (...args) => { calls.push(args); }
  };
  await runNamedHudAction(actor, "defend", async (path) => path.includes("action-economy")
    ? economy : { runNamedAction: () => ({ cancelled: true }) });
  assert.deepEqual(calls, [
    [actor, "standard", { source: "E20.ActionDefend", context: { key: "defend" } }],
    [actor, "spent-1"], "refresh"
  ]);
});

test("named actions refuse non-owner calls before touching the native ledger", async () => {
  let imported = false;
  let warning = null;
  globalThis.game = { i18n: { localize: (key) => key } };
  globalThis.ui = { notifications: { warn: (message) => { warning = message; } } };
  await runNamedHudAction({ isOwner: false }, "defend", async () => { imported = true; });
  assert.equal(imported, false);
  assert.equal(warning, "ECHESSENCE20.Errors.NotOwner");
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

test("escapes player-controlled tooltip text", async () => {
  globalThis.game = { i18n: { localize: (key) => key } };
  const data = await buildUtilityTooltipData({
    name: '<img src=x onerror=alert(1)>', type: "gear", description: "",
    equipped: null, active: null, quantity: null,
    classification: '<b>magic</b>', traits: [], source: 'A&B', document: {}
  }, async () => "");
  assert.equal(data.title, '&lt;img src=x onerror=alert(1)&gt;');
  assert.equal(data.properties[0].label, '&lt;b&gt;magic&lt;/b&gt;');
  assert.equal(data.footerText, 'A&amp;B');
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
