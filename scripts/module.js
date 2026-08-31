import {
  MODULE_ID,
  SUPPORTED_SYSTEM_ID
} from "./constants.js";
import { registerEssence20Hud } from "./register.js";

Hooks.once("init", () => {
  if (game.system.id !== SUPPORTED_SYSTEM_ID) {
    console.warn(`${MODULE_ID} | Disabled for unsupported system ${game.system.id}`);
    return;
  }

  console.info(`${MODULE_ID} | Initializing`);
});

Hooks.on("argonInit", (CoreHUD) => {
  if (game.system.id !== SUPPORTED_SYSTEM_ID) return;

  try {
    registerEssence20Hud(CoreHUD);
    console.info(`${MODULE_ID} | Registered with Argon Core`);
  } catch (error) {
    console.error(`${MODULE_ID} | Argon registration failed`, error);
    ui.notifications.error(
      game.i18n.localize("ECHESSENCE20.Errors.ArgonRegistration"),
      { permanent: true }
    );
  }
});
