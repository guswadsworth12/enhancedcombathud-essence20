import test from "node:test";
import assert from "node:assert/strict";
import { registerEssence20Hud } from "../scripts/register.js";
import { rangerFixture } from "./fixtures/actors.js";

class BaseComponent {}
class BaseDrawerButton {
  constructor(buttons) { this.buttons = buttons; }
}
class BaseItemButton {
  constructor(options) {
    this.initialClasses = this.classes;
    this.item = options.item;
    this.inActionPanel = options.inActionPanel;
    this.element = { classList: { add() {} } };
  }
  get classes() { return ["feature-element"]; }
}
class BaseButtonPanelButton {}
class BaseAccordionPanel {
  constructor(options) { Object.assign(this, options); }
}
class BaseAccordionPanelCategory {
  constructor(options) { Object.assign(this, options); }
}

function fakeCore() {
  const registrations = {};
  return {
    registrations,
    ARGON: {
      PORTRAIT: { PortraitPanel: BaseComponent },
      DRAWER: { DrawerPanel: BaseComponent, DrawerButton: BaseDrawerButton },
      MAIN: {
        ActionPanel: BaseComponent,
        BUTTONS: { ItemButton: BaseItemButton, ButtonPanelButton: BaseButtonPanelButton },
        BUTTON_PANELS: {
          ACCORDION: {
            AccordionPanel: BaseAccordionPanel,
            AccordionPanelCategory: BaseAccordionPanelCategory
          }
        }
      },
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
  assert.deepEqual(CoreHUD.registrations.main, [
    components.Essence20ActionsPanel,
    components.Essence20PowersPanel
  ]);
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

test("action panel exposes equipped live weapon effects", async () => {
  let rolledWith = null;
  const effect = {
    ...rangerFixture.items.find(({ type }) => type === "weaponEffect"),
    roll(dataset) { rolledWith = dataset; }
  };
  const actor = {
    ...rangerFixture,
    items: rangerFixture.items.map((item) => item.type === "weaponEffect" ? effect : item)
  };
  const components = registerEssence20Hud(fakeCore());
  const panel = new components.Essence20ActionsPanel();
  panel.actor = actor;

  const buttons = await panel._getButtons();
  buttons[0].actor = actor;
  await buttons[0]._onLeftClick();

  assert.equal(buttons.length, 1);
  assert.equal(buttons[0].item.id, "effect-1");
  assert.equal(buttons[0].inActionPanel, true);
  assert.deepEqual(buttons[0].ranges, { normal: null, long: null });
  assert.equal(buttons[0].targets, 1);
  assert.deepEqual(rolledWith, {});
});

test("action panel shows an unmatched effect as disabled and never rolls it", async () => {
  globalThis.game = { i18n: { localize: (key) => key } };
  let warning = null;
  globalThis.ui = { notifications: { warn: (message) => { warning = message; } } };
  let rolls = 0;
  const orphan = {
    id: "orphan", name: "Orphan", type: "weaponEffect", flags: {}, system: {},
    roll() { rolls += 1; }
  };
  const actor = { ...rangerFixture, items: [orphan] };
  const components = registerEssence20Hud(fakeCore());
  const panel = new components.Essence20ActionsPanel();
  panel.actor = actor;

  const buttons = await panel._getButtons();
  buttons[0]._onLeftClick();

  assert.equal(buttons.length, 1);
  assert.equal(buttons[0].visible, true);
  assert.equal(rolls, 0);
  assert.equal(warning, "ECHESSENCE20.Errors.UnmatchedWeaponEffect");
});

test("powers accordion groups real action types", async () => {
  globalThis.game = { i18n: { localize: (key) => key } };
  const power = {
    ...rangerFixture.items.find(({ type }) => type === "power"),
    system: {
      ...rangerFixture.items.find(({ type }) => type === "power").system,
      canActivate: true
    }
  };
  const actor = { ...rangerFixture, items: [power] };
  const components = registerEssence20Hud(fakeCore());
  const powers = new components.Essence20PowersPanel();
  powers.actor = actor;

  const buttons = await powers._getButtons();
  buttons[0].actor = actor;
  const accordion = await buttons[0]._getPanel();

  assert.equal(buttons.length, 1);
  assert.equal(accordion.id, "essence20-powers");
  assert.equal(accordion.accordionPanelCategories.length, 1);
  assert.equal(accordion.accordionPanelCategories[0].label, "ECHESSENCE20.Actions.PowerTypes.standard");
  assert.equal(accordion.accordionPanelCategories[0].buttons[0].item.name, "Test Power");
  assert.equal(accordion.accordionPanelCategories[0].buttons[0].inActionPanel, false);
  assert.deepEqual(accordion.accordionPanelCategories[0].buttons[0].classes, ["feature-element"]);
});

test("unavailable powers remain visible but cannot roll", async () => {
  globalThis.game = { i18n: { localize: (key) => key } };
  let warning = null;
  globalThis.ui = { notifications: { warn: (message) => { warning = message; } } };
  let rolls = 0;
  const power = {
    ...rangerFixture.items.find(({ type }) => type === "power"),
    roll() { rolls += 1; }
  };
  const actor = { ...rangerFixture, items: [power] };
  const components = registerEssence20Hud(fakeCore());
  const panel = new components.Essence20PowersPanel();
  panel.actor = actor;

  const [panelButton] = await panel._getButtons();
  panelButton.actor = actor;
  const accordion = await panelButton._getPanel();
  const [button] = accordion.accordionPanelCategories[0].buttons;
  button.actor = actor;
  await button._onLeftClick();

  assert.equal(button.power.canActivate, false);
  assert.equal(rolls, 0);
  assert.equal(warning, "ECHESSENCE20.Errors.PowerUnavailable");
});
