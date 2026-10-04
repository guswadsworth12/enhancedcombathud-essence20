import test from "node:test";
import assert from "node:assert/strict";
import { createLogger } from "../scripts/logger.js";
import { applyThemeSettings, registerSettings, SETTINGS } from "../scripts/settings.js";

test("registers a client debug-logging setting disabled by default", () => {
  const registrations = [];
  registerSettings({
    settings: {
      register(moduleId, key, data) {
        registrations.push({ moduleId, key, data });
      }
    }
  });

  assert.equal(registrations.length, Object.keys(SETTINGS).length);
  assert.equal(registrations[0].key, SETTINGS.debugLogging);
  assert.equal(registrations[0].data.scope, "client");
  assert.equal(registrations[0].data.default, false);
  assert.equal(registrations.find(({ key }) => key === SETTINGS.theme).data.default, "occult");
});

test("applies visual settings through module-prefixed DOM state", () => {
  const values = {
    theme: "occult", density: "compact", opacity: 0.9, glow: 0.5,
    contrast: true, motion: "reduced", accent: "violet"
  };
  const properties = {};
  const root = {
    dataset: {},
    style: { setProperty(key, value) { properties[key] = value; } }
  };
  applyThemeSettings({ settings: { get: (moduleId, key) => values[key] } }, root);
  assert.equal(root.dataset.echEssence20Theme, "occult");
  assert.equal(root.dataset.echEssence20Contrast, "true");
  assert.equal(root.dataset.echEssence20Motion, "reduced");
  assert.equal(properties["--ech20-opacity"], "0.9");
  assert.equal(properties["--ech20-glow"], "6px");
});

test("emits debug logs only when the client setting is enabled", () => {
  const calls = [];
  const consoleApi = {
    debug(...args) { calls.push(args); },
    info() {}, warn() {}, error() {}
  };
  let enabled = false;
  const game = { settings: { get: () => enabled } };
  const logger = createLogger(game, consoleApi);

  logger.debug("hidden");
  enabled = true;
  logger.debug("visible", { actorId: "test" });

  assert.equal(calls.length, 1);
  assert.match(calls[0][0], /visible/);
});
