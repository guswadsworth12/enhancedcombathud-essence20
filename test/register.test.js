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
class BaseButtonHud {}
class BaseMovementHud {}
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
      WeaponSets: BaseComponent,
      ButtonHud: BaseButtonHud,
      MovementHud: BaseMovementHud
    },
    definePortraitPanel(value) { registrations.portrait = value; },
    defineDrawerPanel(value) { registrations.drawer = value; },
    defineMainPanels(value) { registrations.main = value; },
    defineButtonHud(value) { registrations.buttonHud = value; },
    defineMovementHud(value) { registrations.movementHud = value; },
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
    components.Essence20PowersPanel,
    components.Essence20UtilitiesPanel
  ]);
  assert.equal(CoreHUD.registrations.weaponSets, components.Essence20WeaponSets);
  assert.equal(CoreHUD.registrations.buttonHud, components.Essence20ButtonHud);
  assert.equal(CoreHUD.registrations.movementHud, components.Essence20MovementHud);
  assert.deepEqual(CoreHUD.registrations.actorTypes, ["playerCharacter", "npc"]);
});

test("movement HUD exposes normalized movement in scene spaces", () => {
  globalThis.canvas = { scene: { dimensions: { distance: 5 } } };
  const components = registerEssence20Hud(fakeCore());
  const movement = new components.Essence20MovementHud();
  movement.actor = rangerFixture;
  movement.movementMode = "walk";

  assert.equal(movement.movementMax, 6);
});

test("button HUD delegates initiative to the native actor workflow", async () => {
  globalThis.game = { i18n: { localize: (key) => key } };
  let options = null;
  const components = registerEssence20Hud(fakeCore());
  const hud = new components.Essence20ButtonHud();
  hud.actor = {
    isOwner: true,
    rollInitiative(value) { options = value; }
  };

  const [button] = await hud._getButtons();
  await button.onClick();

  assert.equal(button.label, "ECHESSENCE20.Actions.Initiative");
  assert.equal(button.icon, "fa-solid fa-hourglass-start");
  assert.deepEqual(options, { createCombatants: true });
});

test("button HUD exposes native Morph with state-aware presentation", async () => {
  globalThis.game = { i18n: { localize: (key) => key } };
  let morphCalls = 0;
  const components = registerEssence20Hud(fakeCore());
  const hud = new components.Essence20ButtonHud();
  hud.actor = {
    ...rangerFixture,
    system: { ...rangerFixture.system, isMorphed: false },
    morph() { morphCalls += 1; }
  };

  const buttons = await hud._getButtons();
  await buttons[1].onClick();

  assert.equal(buttons.length, 2);
  assert.equal(buttons[1].label, "ECHESSENCE20.Actions.Morph");
  assert.equal(buttons[1].icon, "fa-solid fa-person-rays");
  assert.equal(morphCalls, 1);

  hud.actor.system.isMorphed = true;
  const morphedButtons = await hud._getButtons();
  assert.equal(morphedButtons[1].label, "ECHESSENCE20.Actions.Return");
  assert.equal(morphedButtons[1].icon, "fa-solid fa-rotate-left");
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

  const [stats] = await portrait.getStatBlocks();

  assert.equal(stats[0].text, "HP 4/5");
  assert.equal(stats[0].tooltip, "Health");
  assert.equal(stats[1].text, "TGH 14");
  assert.equal(stats.length, 9);
  assert.equal(stats[5].text, "STR 4/4");
  assert.equal(stats[5].tooltip, "strength");
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

test("utility accordion groups information-only Items and uses native info rolls", async () => {
  globalThis.game = { i18n: { localize: (key) => key } };
  let dataset = null;
  const perk = {
    ...rangerFixture.items.find(({ type }) => type === "perk"),
    roll(value) { dataset = value; }
  };
  const actor = { ...rangerFixture, items: [perk] };
  const components = registerEssence20Hud(fakeCore());
  const panel = new components.Essence20UtilitiesPanel();
  panel.actor = actor;

  const [panelButton] = await panel._getButtons();
  panelButton.actor = actor;
  const accordion = await panelButton._getPanel();
  const [button] = accordion.accordionPanelCategories[0].buttons;
  button.actor = actor;
  await button._onLeftClick();

  assert.equal(accordion.id, "essence20-utilities");
  assert.equal(accordion.accordionPanelCategories[0].label, "ECHESSENCE20.Actions.UtilityTypes.perk");
  assert.equal(button.inActionPanel, false);
  assert.equal(button.hasTooltip, true);
  assert.deepEqual(dataset, { rollType: "info" });
});
