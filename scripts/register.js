import { SUPPORTED_ACTOR_TYPES } from "./constants.js";
import { createComponents } from "./components.js";

export function registerEssence20Hud(CoreHUD) {
  if (!CoreHUD?.ARGON) throw new Error("Argon Core did not expose its adapter API");

  const components = createComponents(CoreHUD.ARGON);
  CoreHUD.definePortraitPanel(components.Essence20PortraitPanel);
  CoreHUD.defineDrawerPanel(components.Essence20DrawerPanel);
  CoreHUD.defineMainPanels([components.Essence20ActionsPanel]);
  CoreHUD.defineSupportedActorTypes([...SUPPORTED_ACTOR_TYPES]);

  return components;
}
