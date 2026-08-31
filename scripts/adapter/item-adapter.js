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

function cachedEffectEntries(item) {
  return Object.values(item.system?.items ?? {}).flatMap((entry) => {
    const uuid = entry?.uuid;
    if (typeof uuid !== "string") return [];
    return [{
      id: uuid.split(".").at(-1),
      name: entry.name ?? entry.label ?? "Unmatched weapon effect",
      img: entry.img ?? null
    }];
  });
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

export function normalizeWeapon(item, allItems, claimedEffectIds = new Set()) {
  const id = itemId(item);
  const cachedEntries = cachedEffectEntries(item);
  const cachedIds = new Set(cachedEntries.map((entry) => entry.id));
  const diagnostics = [];
  const effects = allItems
    .filter((candidate) => {
      if (candidate.type !== "weaponEffect") return false;
      const linkedParent = parentId(candidate);
      if (linkedParent ? linkedParent !== id : !cachedIds.has(itemId(candidate))) return false;
      if (claimedEffectIds.has(itemId(candidate))) {
        diagnostics.push({
          key: `duplicate:${itemId(candidate)}`,
          message: `Weapon effect ${candidate.name ?? itemId(candidate)} is referenced by more than one weapon.`
        });
        return false;
      }
      claimedEffectIds.add(itemId(candidate));
      return true;
    })
    .map(normalizeWeaponEffect);

  const resolvedIds = new Set(effects.map((effect) => effect.id));
  for (const entry of cachedEntries) {
    if (resolvedIds.has(entry.id)) continue;
    if (claimedEffectIds.has(entry.id)) continue;
    diagnostics.push({
      key: `missing:${id}:${entry.id}`,
      message: `Weapon ${item.name ?? id} references missing weapon effect ${entry.name}.`
    });
    effects.push({
      ...entry,
      type: "weaponEffect",
      document: {
        id: entry.id,
        name: entry.name,
        img: entry.img,
        type: "weaponEffect",
        actor: item.actor ?? null,
        system: {}
      },
      parentId: id,
      disabled: true,
      range: { normal: null, long: null, reach: null },
      targets: 0
    });
  }

  return {
    ...baseItem(item),
    equipped: item.system?.equipped !== false,
    traits: [...(item.system?.itemAndUpgradeTraits ?? item.system?.traits ?? [])],
    usesPerScene: item.system?.usesPerScene ?? null,
    effects,
    diagnostics
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
