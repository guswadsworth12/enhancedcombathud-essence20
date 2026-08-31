import test from "node:test";
import assert from "node:assert/strict";
import {
  compareVersions,
  evaluateCompatibility,
  inspectGameCompatibility
} from "../scripts/compatibility.js";

const supported = {
  foundryVersion: "14.367",
  systemId: "essence20",
  systemVersion: "5.1.0",
  argonActive: true,
  argonVersion: "5.0.1"
};

test("compares semantic version cores", () => {
  assert.equal(compareVersions("5.1.0", "5.1.0"), 0);
  assert.equal(compareVersions("5.1.1", "5.1.0"), 1);
  assert.equal(compareVersions("14.0.0", "15.0.0"), -1);
  assert.equal(compareVersions("invalid", "5.1.0"), null);
});

test("accepts the tested Foundry, Essence20, and Argon versions", () => {
  assert.deepEqual(evaluateCompatibility(supported), []);
});

test("returns actionable issue keys for unsupported dependencies", () => {
  assert.deepEqual(
    evaluateCompatibility({
      ...supported,
      foundryVersion: "15.0.0",
      systemVersion: "5.2.0",
      argonVersion: "6.0.0"
    }).map(({ key }) => key),
    ["FoundryVersion", "SystemVersion", "ArgonVersion"]
  );

  assert.deepEqual(
    evaluateCompatibility({ ...supported, argonActive: false }).map(({ key }) => key),
    ["ArgonInactive"]
  );
});

test("reads dependency state from the Foundry game object", () => {
  const game = {
    version: "14.367",
    system: { id: "essence20", version: "5.1.0" },
    modules: new Map([["enhancedcombathud", { active: true, version: "5.0.1" }]])
  };
  assert.deepEqual(inspectGameCompatibility(game), []);
});
