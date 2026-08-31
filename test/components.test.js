import test from "node:test";
import assert from "node:assert/strict";
import {
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
