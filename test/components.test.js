import test from "node:test";
import assert from "node:assert/strict";
import {
  activatePower,
  buildSkillRollDataset,
  formatSkillRank,
  formatSkillStatus
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
