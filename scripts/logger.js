import { MODULE_ID } from "./constants.js";
import { SETTINGS } from "./settings.js";

function prefix(message) {
  return `${MODULE_ID} | ${message}`;
}

export function createLogger(game, consoleApi = console) {
  return {
    debug(message, ...details) {
      if (game.settings.get(MODULE_ID, SETTINGS.debugLogging)) {
        consoleApi.debug(prefix(message), ...details);
      }
    },
    info(message, ...details) {
      consoleApi.info(prefix(message), ...details);
    },
    warn(message, ...details) {
      consoleApi.warn(prefix(message), ...details);
    },
    error(message, ...details) {
      consoleApi.error(prefix(message), ...details);
    }
  };
}
