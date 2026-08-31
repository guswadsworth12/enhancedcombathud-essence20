import { MODULE_ID } from "./constants.js";

export const SETTINGS = Object.freeze({
  debugLogging: "debugLogging"
});

export function registerSettings(game) {
  game.settings.register(MODULE_ID, SETTINGS.debugLogging, {
    name: "ECHESSENCE20.Settings.DebugLogging.Name",
    hint: "ECHESSENCE20.Settings.DebugLogging.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
}
