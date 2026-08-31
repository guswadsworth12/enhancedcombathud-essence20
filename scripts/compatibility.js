import {
  ARGON_MODULE_ID,
  COMPATIBILITY,
  SUPPORTED_SYSTEM_ID
} from "./constants.js";

function versionParts(version) {
  const match = String(version ?? "").match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  return match ? match.slice(1, 4).map((part) => Number(part ?? 0)) : null;
}

export function compareVersions(left, right) {
  const a = versionParts(left);
  const b = versionParts(right);
  if (!a || !b) return null;

  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
  }
  return 0;
}

function inRange(version, { minimum, maximumExclusive }) {
  const minimumResult = compareVersions(version, minimum);
  const maximumResult = compareVersions(version, maximumExclusive);
  return minimumResult !== null && maximumResult !== null
    && minimumResult >= 0 && maximumResult < 0;
}

export function evaluateCompatibility({
  foundryVersion,
  systemId,
  systemVersion,
  argonActive,
  argonVersion
}) {
  const issues = [];

  if (!inRange(foundryVersion, COMPATIBILITY.foundry)) {
    issues.push({ key: "FoundryVersion", values: { version: foundryVersion ?? "unknown" } });
  }
  if (systemId !== SUPPORTED_SYSTEM_ID) {
    issues.push({ key: "SystemId", values: { systemId: systemId ?? "unknown" } });
  } else if (!inRange(systemVersion, COMPATIBILITY.essence20)) {
    issues.push({ key: "SystemVersion", values: { version: systemVersion ?? "unknown" } });
  }
  if (!argonActive) {
    issues.push({ key: "ArgonInactive", values: {} });
  } else if (!inRange(argonVersion, COMPATIBILITY.argon)) {
    issues.push({ key: "ArgonVersion", values: { version: argonVersion ?? "unknown" } });
  }

  return issues;
}

export function inspectGameCompatibility(game) {
  const argon = game.modules.get(ARGON_MODULE_ID);
  return evaluateCompatibility({
    foundryVersion: game.version,
    systemId: game.system.id,
    systemVersion: game.system.version,
    argonActive: Boolean(argon?.active),
    argonVersion: argon?.version
  });
}
