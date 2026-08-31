import test from "node:test";
import assert from "node:assert/strict";
import { registerEssence20Hud } from "../scripts/register.js";

class BaseComponent {}

function fakeCore() {
  const registrations = {};
  return {
    registrations,
    ARGON: {
      PORTRAIT: { PortraitPanel: BaseComponent },
      DRAWER: { DrawerPanel: BaseComponent },
      MAIN: { ActionPanel: BaseComponent }
    },
    definePortraitPanel(value) { registrations.portrait = value; },
    defineDrawerPanel(value) { registrations.drawer = value; },
    defineMainPanels(value) { registrations.main = value; },
    defineSupportedActorTypes(value) { registrations.actorTypes = value; }
  };
}

test("registers the minimum Argon component set without patching Core", () => {
  const CoreHUD = fakeCore();
  const components = registerEssence20Hud(CoreHUD);

  assert.equal(CoreHUD.registrations.portrait, components.Essence20PortraitPanel);
  assert.equal(CoreHUD.registrations.drawer, components.Essence20DrawerPanel);
  assert.deepEqual(CoreHUD.registrations.main, [components.Essence20ActionsPanel]);
  assert.deepEqual(CoreHUD.registrations.actorTypes, ["playerCharacter", "npc"]);
});

test("fails clearly when the Argon adapter API is unavailable", () => {
  assert.throws(
    () => registerEssence20Hud({}),
    /did not expose its adapter API/
  );
});
