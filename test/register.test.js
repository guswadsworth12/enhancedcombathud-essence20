import test from "node:test";
import assert from "node:assert/strict";
import { registerEssence20Hud } from "../scripts/register.js";
import { rangerFixture } from "./fixtures/actors.js";

class BaseComponent {}
class BaseDrawerButton {
  constructor(buttons) { this.buttons = buttons; }
}

function fakeCore() {
  const registrations = {};
  return {
    registrations,
    ARGON: {
      PORTRAIT: { PortraitPanel: BaseComponent },
      DRAWER: { DrawerPanel: BaseComponent, DrawerButton: BaseDrawerButton },
      MAIN: { ActionPanel: BaseComponent },
      WeaponSets: BaseComponent
    },
    definePortraitPanel(value) { registrations.portrait = value; },
    defineDrawerPanel(value) { registrations.drawer = value; },
    defineMainPanels(value) { registrations.main = value; },
    defineWeaponSets(value) { registrations.weaponSets = value; },
    defineSupportedActorTypes(value) { registrations.actorTypes = value; }
  };
}

test("registers the minimum Argon component set without patching Core", () => {
  const CoreHUD = fakeCore();
  const components = registerEssence20Hud(CoreHUD);

  assert.equal(CoreHUD.registrations.portrait, components.Essence20PortraitPanel);
  assert.equal(CoreHUD.registrations.drawer, components.Essence20DrawerPanel);
  assert.deepEqual(CoreHUD.registrations.main, [components.Essence20ActionsPanel]);
  assert.equal(CoreHUD.registrations.weaponSets, components.Essence20WeaponSets);
  assert.deepEqual(CoreHUD.registrations.actorTypes, ["playerCharacter", "npc"]);
});

test("fails clearly when the Argon adapter API is unavailable", () => {
  assert.throws(
    () => registerEssence20Hud({}),
    /did not expose its adapter API/
  );
});

test("portrait stat blocks use normalized Essence20 vitals and defenses", async () => {
  globalThis.game = { i18n: { localize: (key) => key.split(".").at(-1) } };
  const components = registerEssence20Hud(fakeCore());
  const portrait = new components.Essence20PortraitPanel();
  portrait.actor = rangerFixture;

  const [vitals, essences] = await portrait.getStatBlocks();

  assert.equal(vitals[0].text, "Health 4/5");
  assert.equal(vitals[1].text, "toughness 14");
  assert.equal(vitals.length, 5);
  assert.equal(essences.length, 4);
  assert.equal(essences[0].text, "strength 4/4");
});

test("skill drawer delegates owned rolls to the native actor method", () => {
  globalThis.CONFIG = { E20: { skills: { athletics: "Athletics" } } };
  globalThis.game = { i18n: { localize: (key) => key } };
  let dataset = null;
  const components = registerEssence20Hud(fakeCore());
  const drawer = new components.Essence20DrawerPanel();
  drawer.actor = {
    ...rangerFixture,
    rollSkill(value) { dataset = value; }
  };

  const [category] = drawer.categories;
  category.buttons[0].buttons[0].onClick();

  assert.equal(category.buttons.length, 2);
  assert.deepEqual(dataset, {
    skill: "athletics",
    essence: "strength",
    shift: "d4",
    shiftUp: 0,
    shiftDown: 0,
    isSpecialized: true,
    canCritD2: false
  });
});
