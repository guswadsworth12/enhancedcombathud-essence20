import { Essence20ActorAdapter } from "./adapter/actor-adapter.js";

const STAT_COLORS = Object.freeze({
  health: "#d66a6a",
  defense: "#d8c8a5",
  strength: "#c96a6a",
  speed: "#d6a85f",
  smarts: "#6fb8c9",
  social: "#a78ac7"
});
const REPORTED_DIAGNOSTICS = new Set();
const POWER_HANDLER_PATH = "/systems/essence20/module/sheet-handlers/power-handler.mjs";
const POWER_ACTION_TYPES = Object.freeze([
  "free", "fullAction", "move", "standard", "standardAndMove",
  "wholeTurn", "tenMinutes", "oneHour"
]);
const UTILITY_TYPES = Object.freeze([
  "armor", "gear", "hangUp", "perk", "shield", "trait"
]);

function reportDiagnostics(actorId, diagnostics) {
  for (const diagnostic of diagnostics) {
    const key = `${actorId}:${diagnostic.key}`;
    if (REPORTED_DIAGNOSTICS.has(key)) continue;
    REPORTED_DIAGNOSTICS.add(key);
    console.warn(`enhancedcombathud-essence20 | ${diagnostic.message}`);
  }
}

export function buildSkillRollDataset(skill) {
  return {
    skill: skill.key,
    essence: skill.essences[0] ?? "",
    shift: skill.shift,
    shiftUp: skill.shiftUp,
    shiftDown: skill.shiftDown,
    isSpecialized: skill.specialized,
    canCritD2: skill.canCritD2
  };
}

export function formatSkillRank(skill) {
  const modifier = skill.modifier > 0 ? ` +${skill.modifier}` : "";
  return `${skill.shift}${modifier}`;
}

export function formatSkillStatus(skill) {
  const status = [];
  if (skill.specialized) status.push("★");
  if (skill.edge) status.push("E");
  if (skill.snag) status.push("S");
  return status.join(" ") || "—";
}

export async function rollInitiative(actor) {
  if (!actor?.isOwner || typeof actor.rollInitiative !== "function") {
    ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.NotOwner"));
    return;
  }
  return actor.rollInitiative({ createCombatants: true });
}

export async function activatePower(actor, power, importer = (path) => import(path)) {
  let powerCost = null;
  try {
    ({ powerCost } = await importer(POWER_HANDLER_PATH));
  } catch (error) {
    console.warn("enhancedcombathud-essence20 | Native power handler unavailable; showing power information instead.", error);
  }
  if (typeof powerCost === "function") return powerCost(actor, power);
  return power.roll?.({});
}

export async function showUtilityInfo(actor, item) {
  if (!actor?.isOwner || typeof item?.roll !== "function") {
    ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.NotOwner"));
    return;
  }
  return item.roll({ rollType: "info" });
}

export async function buildUtilityTooltipData(utility, enrich = (html) => (
  foundry.applications.ux.TextEditor.implementation.enrichHTML(html, {
    relativeTo: utility.document
  })
)) {
  const details = [];
  if (utility.equipped !== null) details.push({
    label: "ECHESSENCE20.Tooltips.Equipped",
    value: game.i18n.localize(`ECHESSENCE20.Tooltips.${utility.equipped ? "Yes" : "No"}`)
  });
  if (utility.active !== null) details.push({
    label: "ECHESSENCE20.Tooltips.Active",
    value: game.i18n.localize(`ECHESSENCE20.Tooltips.${utility.active ? "Yes" : "No"}`)
  });
  if (utility.quantity !== null) details.push({
    label: "ECHESSENCE20.Tooltips.Quantity",
    value: utility.quantity
  });

  return {
    title: utility.name,
    subtitle: game.i18n.localize(`ECHESSENCE20.Actions.UtilityTypes.${utility.type}`),
    description: await enrich(utility.description),
    details,
    propertiesLabel: "ECHESSENCE20.Tooltips.Properties",
    properties: [utility.classification, ...utility.traits]
      .filter(Boolean)
      .map((label) => ({ label })),
    footerText: utility.source || ""
  };
}

export function createComponents(ARGON) {
  class Essence20SkillButton extends ARGON.DRAWER.DrawerButton {}

  class Essence20WeaponEffectButton extends ARGON.MAIN.BUTTONS.ItemButton {
    constructor(effect) {
      super({ item: effect.document, inActionPanel: true });
      this.effect = effect;
    }

    get ranges() {
      return {
        normal: this.effect.range.normal,
        long: this.effect.range.long
      };
    }

    get targets() {
      return this.effect.targets;
    }

    async _onLeftClick() {
      if (!this.actor.isOwner || typeof this.item?.roll !== "function") {
        ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.NotOwner"));
        return;
      }
      return this.item.roll({});
    }
  }

  class Essence20DisabledEffectButton extends ARGON.MAIN.BUTTONS.ItemButton {
    constructor(effect) {
      super({ item: effect.document, inActionPanel: true });
      this.effect = effect;
    }

    get label() { return this.effect.name; }
    get icon() { return this.effect.img; }
    get visible() { return true; }
    get classes() { return ["essence20-disabled-action"]; }

    _onLeftClick() {
      ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.UnmatchedWeaponEffect"));
    }
  }

  class Essence20PowerButton extends ARGON.MAIN.BUTTONS.ItemButton {
    constructor(power) {
      super({ item: power.document, inActionPanel: false });
      this.power = power;
      if (!power.canActivate) this.element.classList.add("essence20-disabled-action");
    }

    async _onLeftClick() {
      if (!this.actor.isOwner || typeof this.item?.roll !== "function") {
        ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.NotOwner"));
        return;
      }
      if (!this.power.canActivate) {
        ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.PowerUnavailable"));
        return;
      }
      return activatePower(this.actor, this.item);
    }

    async _onRightClick() {
      if (!this.actor.isOwner || typeof this.item?.roll !== "function") {
        ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.NotOwner"));
        return;
      }
      return this.item.roll({});
    }
  }

  class Essence20UtilityButton extends ARGON.MAIN.BUTTONS.ItemButton {
    constructor(utility) {
      super({ item: utility.document, inActionPanel: false });
      this.utility = utility;
    }

    get hasTooltip() { return true; }

    async getTooltipData() {
      return buildUtilityTooltipData(this.utility);
    }

    async _onLeftClick() {
      return showUtilityInfo(this.actor, this.item);
    }

    async _onRightClick() {
      return showUtilityInfo(this.actor, this.item);
    }
  }

  class Essence20PortraitPanel extends ARGON.PORTRAIT.PortraitPanel {
    get classes() {
      return ["portrait-hud", "essence20-portrait-hud"];
    }

    async getStatBlocks() {
      const data = new Essence20ActorAdapter(this.actor).normalize();
      const label = (key) => game.i18n.localize(`ECHESSENCE20.Stats.${key}`);

      return [
        [
          {
            id: "essence20-health",
            text: `${label("Health")} ${data.health.value}/${data.health.max}`,
            color: STAT_COLORS.health
          },
          ...Object.entries(data.defenses).map(([key, value]) => ({
            id: `essence20-defense-${key}`,
            text: `${label(key)} ${value}`,
            color: STAT_COLORS.defense
          }))
        ],
        Object.entries(data.essences).map(([key, resource]) => ({
          id: `essence20-essence-${key}`,
          text: `${label(key)} ${resource.value}/${resource.max}`,
          color: STAT_COLORS[key]
        }))
      ];
    }
  }

  class Essence20DrawerPanel extends ARGON.DRAWER.DrawerPanel {
    get classes() {
      return ["ability-menu", "essence20-ability-menu"];
    }

    get title() {
      return game.i18n.localize("ECHESSENCE20.Drawer.Title");
    }

    get categories() {
      const data = new Essence20ActorAdapter(this.actor).normalize();
      const skillName = (key) => {
        const configured = globalThis.CONFIG?.E20?.skills?.[key];
        return configured ? game.i18n.localize(configured) : key;
      };
      const buttons = data.skills.map((skill) => new Essence20SkillButton([
        {
          label: skillName(skill.key),
          onClick: () => {
            if (!this.actor.isOwner || typeof this.actor.rollSkill !== "function") {
              ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.NotOwner"));
              return;
            }
            return this.actor.rollSkill(buildSkillRollDataset(skill));
          }
        },
        { label: formatSkillRank(skill) },
        { label: formatSkillStatus(skill) }
      ]));

      return [{
        captions: [
          { label: "ECHESSENCE20.Drawer.Skill", align: "left" },
          { label: "ECHESSENCE20.Drawer.Rank", align: "center" },
          { label: "ECHESSENCE20.Drawer.Status", align: "center" }
        ],
        buttons,
        gridCols: "minmax(9rem, 1fr) 4rem 4rem"
      }];
    }
  }

  class Essence20ActionsPanel extends ARGON.MAIN.ActionPanel {
    get classes() {
      return ["actions-container", "essence20-actions-container"];
    }

    get label() {
      return game.i18n.localize("ECHESSENCE20.Actions.Weapons");
    }

    async _getButtons() {
      const data = new Essence20ActorAdapter(this.actor).normalize();
      reportDiagnostics(data.identity.id, data.diagnostics);
      const effects = data.weapons
        .filter((weapon) => weapon.equipped)
        .flatMap((weapon) => weapon.effects)
        .concat(data.unmatchedWeaponEffects);
      return effects.map((effect) => effect.disabled
        ? new Essence20DisabledEffectButton(effect)
        : new Essence20WeaponEffectButton(effect));
    }
  }

  class Essence20PowersButton extends ARGON.MAIN.BUTTONS.ButtonPanelButton {
    get label() {
      return game.i18n.localize("ECHESSENCE20.Actions.Powers");
    }

    get icon() {
      return "icons/svg/aura.svg";
    }

    async _getPanel() {
      const data = new Essence20ActorAdapter(this.actor).normalize();
      const categories = POWER_ACTION_TYPES.flatMap((actionType) => {
        const buttons = data.powers
          .filter((power) => power.actionType === actionType)
          .map((power) => new Essence20PowerButton(power));
        if (!buttons.length) return [];
        return [new ARGON.MAIN.BUTTON_PANELS.ACCORDION.AccordionPanelCategory({
          label: game.i18n.localize(`ECHESSENCE20.Actions.PowerTypes.${actionType}`),
          buttons
        })];
      });
      return new ARGON.MAIN.BUTTON_PANELS.ACCORDION.AccordionPanel({
        id: "essence20-powers",
        accordionPanelCategories: categories
      });
    }
  }

  class Essence20PowersPanel extends ARGON.MAIN.ActionPanel {
    get classes() {
      return ["actions-container", "essence20-actions-container", "essence20-powers-container"];
    }

    get label() {
      return game.i18n.localize("ECHESSENCE20.Actions.Powers");
    }

    async _getButtons() {
      const data = new Essence20ActorAdapter(this.actor).normalize();
      return data.powers.length ? [new Essence20PowersButton()] : [];
    }
  }

  class Essence20UtilitiesButton extends ARGON.MAIN.BUTTONS.ButtonPanelButton {
    get label() {
      return game.i18n.localize("ECHESSENCE20.Actions.Utilities");
    }

    get icon() {
      return "icons/svg/backpack.svg";
    }

    async _getPanel() {
      const data = new Essence20ActorAdapter(this.actor).normalize();
      const categories = UTILITY_TYPES.flatMap((type) => {
        const buttons = data.utility
          .filter((utility) => utility.type === type)
          .map((utility) => new Essence20UtilityButton(utility));
        if (!buttons.length) return [];
        return [new ARGON.MAIN.BUTTON_PANELS.ACCORDION.AccordionPanelCategory({
          label: game.i18n.localize(`ECHESSENCE20.Actions.UtilityTypes.${type}`),
          buttons
        })];
      });
      return new ARGON.MAIN.BUTTON_PANELS.ACCORDION.AccordionPanel({
        id: "essence20-utilities",
        accordionPanelCategories: categories
      });
    }
  }

  class Essence20UtilitiesPanel extends ARGON.MAIN.ActionPanel {
    get classes() {
      return ["actions-container", "essence20-actions-container", "essence20-utilities-container"];
    }

    get label() {
      return game.i18n.localize("ECHESSENCE20.Actions.Utilities");
    }

    async _getButtons() {
      const data = new Essence20ActorAdapter(this.actor).normalize();
      return data.utility.length ? [new Essence20UtilitiesButton()] : [];
    }
  }

  class Essence20ButtonHud extends ARGON.ButtonHud {
    async _getButtons() {
      return [{
        label: "ECHESSENCE20.Actions.Initiative",
        icon: "fa-solid fa-hourglass-start",
        onClick: () => rollInitiative(this.actor)
      }];
    }
  }

  class Essence20WeaponSets extends ARGON.WeaponSets {
    async _onSetChange() {}
  }

  return {
    Essence20PortraitPanel,
    Essence20DrawerPanel,
    Essence20ActionsPanel,
    Essence20PowersPanel,
    Essence20UtilitiesPanel,
    Essence20ButtonHud,
    Essence20WeaponSets
  };
}
