import {
  MODULE_ID,
  SUPPORTED_SYSTEM_ID
} from "./constants.js";
import { inspectGameCompatibility } from "./compatibility.js";
import { createLogger } from "./logger.js";
import { registerEssence20Hud } from "./register.js";
import { registerSettings } from "./settings.js";

let compatibilityIssues = [];
let logger;

Hooks.once("init", () => {
  registerSettings(game);
  logger = createLogger(game);
  compatibilityIssues = inspectGameCompatibility(game);

  if (game.system.id !== SUPPORTED_SYSTEM_ID) {
    logger.warn(`Disabled for unsupported system ${game.system.id}`);
    return;
  }

  logger.info("Initializing");
});

Hooks.once("ready", () => {
  for (const issue of compatibilityIssues) {
    const message = game.i18n.format(`ECHESSENCE20.Errors.${issue.key}`, issue.values);
    logger.error(message);
    ui.notifications.error(message, { permanent: true });
  }
});

Hooks.on("argonInit", (CoreHUD) => {
  if (compatibilityIssues.length > 0) return;

  try {
    registerEssence20Hud(CoreHUD);
    logger.info("Registered with Argon Core");
  } catch (error) {
    logger.error("Argon registration failed", error);
    ui.notifications.error(
      game.i18n.localize("ECHESSENCE20.Errors.ArgonRegistration"),
      { permanent: true }
    );
  }
});
