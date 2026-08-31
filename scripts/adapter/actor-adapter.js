import { collectionValues, finiteNumber } from "./collection.js";
import {
  isUtilityItem,
  normalizePower,
  normalizeUtilityItem,
  normalizeWeapon
} from "./item-adapter.js";

const DEFENSES = ["toughness", "evasion", "willpower", "cleverness"];
const ESSENCES = ["strength", "speed", "smarts", "social"];
const MOVEMENT = ["ground", "aerial", "climb", "swim"];

function normalizeResource(resource = {}) {
  return {
    value: finiteNumber(resource.value),
    max: finiteNumber(resource.max)
  };
}

function normalizeDefense(defense = {}) {
  return finiteNumber(defense.total ?? defense.value ?? defense.base, 10);
}

function normalizeMovement(mode = {}) {
  const base = finiteNumber(mode.base);
  const bonus = finiteNumber(mode.bonus);
  const total = finiteNumber(mode.total, base + bonus);
  return total === 0 && base !== 0 ? base + bonus : total;
}

function normalizeSkills(skills = {}) {
  return Object.entries(skills)
    .filter(([key]) => key !== "roleSkillDie")
    .map(([key, skill = {}]) => ({
      key,
      shift: skill.shift ?? "d20",
      modifier: finiteNumber(skill.modifier),
      shiftUp: finiteNumber(skill.shiftUp),
      shiftDown: finiteNumber(skill.shiftDown),
      edge: Boolean(skill.edge),
      snag: Boolean(skill.snag),
      canCritD2: Boolean(skill.canCritD2),
      specialized: Boolean(skill.isSpecialized),
      initiative: Boolean(skill.canBeInitiative),
      essences: ESSENCES.filter((essence) => Boolean(skill.essences?.[essence]))
    }));
}

export class Essence20ActorAdapter {
  constructor(actor) {
    this.actor = actor;
  }

  normalize() {
    const actor = this.actor;
    const system = actor.system ?? {};
    const items = collectionValues(actor.items);

    return {
      identity: {
        id: actor.id ?? actor._id ?? null,
        uuid: actor.uuid ?? null,
        name: actor.name ?? "",
        img: actor.img ?? null,
        type: actor.type ?? "",
        owner: Boolean(actor.isOwner)
      },
      health: normalizeResource(system.health),
      defenses: Object.fromEntries(
        DEFENSES.map((key) => [key, normalizeDefense(system.defenses?.[key])])
      ),
      essences: Object.fromEntries(
        ESSENCES.map((key) => [key, normalizeResource(system.essences?.[key])])
      ),
      movement: Object.fromEntries(
        MOVEMENT.map((key) => [key, normalizeMovement(system.movement?.[key])])
      ),
      initiative: {
        skill: system.initiative?.skill ?? "initiative",
        formula: system.initiative?.formula ?? null
      },
      skills: normalizeSkills(system.skills),
      weapons: items.filter(({ type }) => type === "weapon")
        .map((item) => normalizeWeapon(item, items)),
      powers: items.filter(({ type }) => type === "power").map(normalizePower),
      utility: items.filter(isUtilityItem).map(normalizeUtilityItem),
      morph: {
        capable: Boolean(system.canMorph),
        active: Boolean(system.isMorphed),
        actionAvailable: actor.type === "playerCharacter"
          && Boolean(system.canMorph)
          && typeof actor.morph === "function"
      }
    };
  }
}
