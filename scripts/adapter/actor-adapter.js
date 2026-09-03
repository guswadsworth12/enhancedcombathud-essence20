import { collectionValues, finiteNumber } from "./collection.js";
import {
  isUtilityItem,
  normalizePower,
  normalizeUtilityItem,
  normalizeWeapon,
  normalizeWeaponEffect
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

function normalizeActionEconomy(actorType, essences = {}) {
  if (actorType !== "playerCharacter") return null;
  const speed = finiteNumber(essences.speed?.max);
  return {
    movement: speed > 0 ? 1 : 0,
    standard: speed > 1 ? 1 : 0,
    free: Math.max(0, speed - 2),
    tracked: false
  };
}

export class Essence20ActorAdapter {
  constructor(actor) {
    this.actor = actor;
  }

  normalize() {
    const actor = this.actor;
    const system = actor.system ?? {};
    const items = collectionValues(actor.items);
    const claimedEffectIds = new Set();
    const weapons = items.filter(({ type }) => type === "weapon")
      .map((item) => normalizeWeapon(item, items, claimedEffectIds));
    const unmatchedWeaponEffects = items
      .filter((item) => item.type === "weaponEffect" && !claimedEffectIds.has(item.id ?? item._id))
      .map((item) => ({ ...normalizeWeaponEffect(item), disabled: true }));
    const diagnostics = [
      ...weapons.flatMap((weapon) => weapon.diagnostics),
      ...unmatchedWeaponEffects.map((effect) => ({
        key: `unmatched:${effect.id}`,
        message: `Weapon effect ${effect.name || effect.id} is not linked to a weapon.`
      }))
    ];

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
      actionEconomy: normalizeActionEconomy(actor.type, system.essences),
      skills: normalizeSkills(system.skills),
      weapons,
      unmatchedWeaponEffects,
      diagnostics,
      powers: items.filter(({ type }) => type === "power").map(normalizePower),
      utility: items.filter(isUtilityItem).map(normalizeUtilityItem),
      morph: {
        capable: Boolean(system.canMorph),
        active: Boolean(system.isMorphed),
        actionAvailable: Boolean(system.canMorph)
          && typeof actor.morph === "function"
      }
    };
  }
}
