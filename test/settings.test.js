import test from "node:test";
import assert from "node:assert/strict";
import { createLogger } from "../scripts/logger.js";
import { registerSettings, SETTINGS } from "../scripts/settings.js";

test("registers a client debug-logging setting disabled by default", () => {
  const registrations = [];
  registerSettings({
    settings: {
      register(moduleId, key, data) {
        registrations.push({ moduleId, key, data });
      }
    }
  });

  assert.equal(registrations.length, 1);
  assert.equal(registrations[0].key, SETTINGS.debugLogging);
  assert.equal(registrations[0].data.scope, "client");
  assert.equal(registrations[0].data.default, false);
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
