function skill(essence, shift = "d2", specialized = false) {
  return {
    shift,
    modifier: 0,
    shiftUp: 0,
    shiftDown: 0,
    edge: false,
    snag: false,
    isSpecialized: specialized,
    canBeInitiative: false,
    essences: { [essence]: true }
  };
}

const movement = (ground) => ({
  ground: { base: ground, bonus: 0, total: ground },
  aerial: { base: 0, bonus: 0, total: 0 },
  climb: { base: 0, bonus: 0, total: 0 },
  swim: { base: 0, bonus: 0, total: 0 }
});

export const rangerFixture = {
  id: "fixture-ranger",
  uuid: "Actor.fixture-ranger",
  name: "Fixture Ranger",
  type: "playerCharacter",
  img: "icons/svg/mystery-man.svg",
  isOwner: true,
  morph() {},
  system: {
    health: { value: 4, max: 5 },
    defenses: {
      toughness: { total: 14 }, evasion: { total: 13 },
      willpower: { total: 12 }, cleverness: { total: 11 }
    },
    essences: {
      strength: { value: 4, max: 4 }, speed: { value: 3, max: 3 },
      smarts: { value: 2, max: 2 }, social: { value: 1, max: 1 }
    },
    movement: movement(30),
    initiative: { skill: "initiative", formula: "2d20kl" },
    skills: { athletics: skill("strength", "d4", true), initiative: skill("speed") },
    canMorph: true,
    isMorphed: false
  },
  items: [
    { id: "weapon-1", name: "Training Blade", type: "weapon", system: { equipped: true, traits: ["sharp"] } },
    {
      id: "effect-1", name: "Strike", type: "weaponEffect",
      flags: { essence20: { parentId: "weapon-1" } },
      system: {
        classification: { skill: "finesse", style: "melee" }, damageValue: 1,
        damageType: "sharp", numHands: 1, numTargets: 1, range: {}, totalReach: 5
      }
    },
    { id: "power-1", name: "Test Power", type: "power", system: { actionType: "standard", usesInterval: "perScene", usesPer: 1 } },
    { id: "perk-1", name: "Test Perk", type: "perk", system: {} }
  ]
};

function npcFixture(id, name, threatLevel, health, defenses) {
  return {
    id, name, type: "npc", isOwner: true,
    system: {
      health: { value: health, max: health },
      defenses: Object.fromEntries(Object.entries(defenses).map(([key, value]) => [key, { value }])),
      essences: {
        strength: { value: 2, max: 2 }, speed: { value: 2, max: 2 },
        smarts: { value: 1, max: 1 }, social: { value: 1, max: 1 }
      },
      movement: movement(30), skills: { athletics: skill("strength") }, threatLevel
    },
    items: []
  };
}

export const boundFixture = npcFixture("fixture-bound", "Fixture Bound", 0, 1, {
  toughness: 12, evasion: 12, willpower: 11, cleverness: 11
});
export const redactorFixture = npcFixture("fixture-redactor", "Fixture Redactor", 3, 5, {
  toughness: 18, evasion: 12, willpower: 13, cleverness: 11
});
export const stitcherFixture = npcFixture("fixture-stitcher", "Fixture Stitcher", 4, 3, {
  toughness: 12, evasion: 14, willpower: 16, cleverness: 12
});
