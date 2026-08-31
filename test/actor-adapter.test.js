import test from "node:test";
import assert from "node:assert/strict";
import { Essence20ActorAdapter } from "../scripts/adapter/actor-adapter.js";
import {
  boundFixture,
  rangerFixture,
  redactorFixture,
  stitcherFixture
} from "./fixtures/actors.js";

test("normalizes a player character independently of Argon UI classes", () => {
  const result = new Essence20ActorAdapter(rangerFixture).normalize();

  assert.equal(result.identity.type, "playerCharacter");
  assert.deepEqual(result.health, { value: 4, max: 5 });
  assert.equal(result.defenses.toughness, 14);
  assert.equal(result.movement.ground, 30);
  assert.equal(result.skills[0].specialized, true);
  assert.equal(result.skills[0].canCritD2, false);
  assert.equal(result.weapons[0].effects[0].id, "effect-1");
  assert.equal(result.weapons[0].effects[0].skill, "finesse");
  assert.equal(result.powers[0].actionType, "standard");
  assert.equal(result.utility[0].type, "perk");
  assert.equal(result.morph.actionAvailable, true);
});

test("normalizes NPC defense value fields for all reference tiers", () => {
  const fixtures = [boundFixture, redactorFixture, stitcherFixture];
  const results = fixtures.map((actor) => new Essence20ActorAdapter(actor).normalize());

  assert.deepEqual(results.map(({ identity }) => identity.type), ["npc", "npc", "npc"]);
  assert.deepEqual(results.map(({ health }) => health.max), [1, 5, 3]);
  assert.deepEqual(results.map(({ defenses }) => defenses.toughness), [12, 18, 12]);
  assert.ok(results.every(({ morph }) => morph.actionAvailable === false));
});

test("does not execute rolls, updates, or Morph while normalizing", () => {
  let calls = 0;
  const actor = {
    ...rangerFixture,
    morph() { calls += 1; },
    update() { calls += 1; }
  };

  new Essence20ActorAdapter(actor).normalize();
  assert.equal(calls, 0);
});
