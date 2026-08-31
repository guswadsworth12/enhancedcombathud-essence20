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

test("exposes native Morph for a capable NPC", () => {
  const actor = {
    ...boundFixture,
    morph() {},
    system: { ...boundFixture.system, canMorph: true }
  };

  const result = new Essence20ActorAdapter(actor).normalize();

  assert.equal(result.morph.capable, true);
  assert.equal(result.morph.actionAvailable, true);
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

test("associates legacy unflagged effects through an exact live cache UUID", () => {
  const effect = {
    id: "legacy-effect",
    uuid: "Actor.legacy.Item.legacy-effect",
    name: "Legacy Strike",
    type: "weaponEffect",
    flags: {},
    system: { classification: { skill: "might", style: "melee" } }
  };
  const actor = {
    ...boundFixture,
    items: [
      {
        id: "legacy-weapon",
        name: "Legacy Weapon",
        type: "weapon",
        system: {
          equipped: true,
          items: { primary: { uuid: effect.uuid } }
        }
      },
      effect
    ]
  };

  const result = new Essence20ActorAdapter(actor).normalize();

  assert.deepEqual(result.weapons[0].effects.map(({ id }) => id), ["legacy-effect"]);
});

test("surfaces unmatched and missing weapon effects as disabled diagnostics", () => {
  const orphan = {
    id: "orphan-effect", name: "Orphan Effect", type: "weaponEffect", flags: {}, system: {}
  };
  const actor = {
    ...boundFixture,
    items: [
      {
        id: "broken-weapon", name: "Broken Weapon", type: "weapon",
        system: {
          equipped: true,
          items: { missing: { uuid: "Actor.fixture.Item.missing-effect", name: "Missing Effect" } }
        }
      },
      orphan
    ]
  };

  const result = new Essence20ActorAdapter(actor).normalize();

  assert.equal(result.weapons[0].effects[0].id, "missing-effect");
  assert.equal(result.weapons[0].effects[0].disabled, true);
  assert.equal(result.unmatchedWeaponEffects[0].id, "orphan-effect");
  assert.equal(result.unmatchedWeaponEffects[0].disabled, true);
  assert.deepEqual(result.diagnostics.map(({ key }) => key), [
    "missing:broken-weapon:missing-effect",
    "unmatched:orphan-effect"
  ]);
});

test("does not associate one cached weapon effect with two weapons", () => {
  const effect = {
    id: "shared-effect", name: "Shared Effect", type: "weaponEffect", flags: {}, system: {}
  };
  const weapon = (id) => ({
    id, name: id, type: "weapon",
    system: { equipped: true, items: { effect: { uuid: `Actor.fixture.Item.${effect.id}` } } }
  });
  const actor = { ...boundFixture, items: [weapon("weapon-a"), weapon("weapon-b"), effect] };

  const result = new Essence20ActorAdapter(actor).normalize();

  assert.deepEqual(result.weapons.map(({ effects }) => effects.filter(({ document }) => document).length), [1, 0]);
  assert.ok(result.diagnostics.some(({ key }) => key === "duplicate:shared-effect"));
});
