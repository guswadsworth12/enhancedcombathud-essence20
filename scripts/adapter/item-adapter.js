import { finiteNumber } from "./collection.js";

const UTILITY_TYPES = new Set([
  "armor", "gear", "hangUp", "perk", "shield", "trait"
]);

function itemId(item) {
  return item.id ?? item._id ?? null;
}

function parentId(item) {
  return item.getFlag?.("essence20", "parentId")
    ?? item.flags?.essence20?.parentId
    ?? null;
}

function baseItem(item) {
  return {
    id: itemId(item),
    name: item.name ?? "",
    type: item.type ?? "",
    img: item.img ?? null,
    document: item
  };
}

export function normalizeWeaponEffect(item) {
  const system = item.system ?? {};
  return {
    ...baseItem(item),
    parentId: parentId(item),
    skill: system.classification?.skill ?? null,
    style: system.classification?.style ?? null,
    damage: {
      value: finiteNumber(system.damageValue),
      type: system.damageType ?? null
    },
    hands: finiteNumber(system.numHands, 1),
    targets: finiteNumber(system.numTargets, 1),
    range: {
      normal: system.range?.value ?? null,
      long: system.range?.long ?? null,
      reach: system.totalReach ?? null
    },
    specialized: Boolean(system.isSpecialized),
    shiftDown: finiteNumber(system.shiftDown)
  };
}

export function normalizeWeapon(item, allItems) {
  const id = itemId(item);
  return {
    ...baseItem(item),
    equipped: item.system?.equipped !== false,
    traits: [...(item.system?.itemAndUpgradeTraits ?? item.system?.traits ?? [])],
    usesPerScene: item.system?.usesPerScene ?? null,
    effects: allItems
      .filter((candidate) => candidate.type === "weaponEffect" && parentId(candidate) === id)
      .map(normalizeWeaponEffect)
  };
}

export function normalizePower(item) {
  const system = item.system ?? {};
  return {
    ...baseItem(item),
    actionType: system.actionType ?? "special",
    canActivate: Boolean(system.canActivate),
    powerType: system.type ?? null,
    uses: {
      interval: system.usesInterval ?? null,
      max: system.usesPer ?? null
    },
    cost: {
      value: system.powerCost ?? null,
      maximum: system.maxPowerCost ?? null,
      variable: Boolean(system.hasVariableCost)
    }
  };
}

export function normalizeUtilityItem(item) {
  return { ...baseItem(item), equipped: item.system?.equipped ?? null };
}

export function isUtilityItem(item) {
  return UTILITY_TYPES.has(item.type);
}
