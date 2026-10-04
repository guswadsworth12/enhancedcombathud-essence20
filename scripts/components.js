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
const POWER_USE_PATH = "/systems/essence20/module/helpers/power-use.mjs";
const ITEM_USE_PATH = "/systems/essence20/module/helpers/banked-buffs.mjs";
const ACTION_ECONOMY_PATH = "/systems/essence20/module/helpers/action-economy.mjs";
const NAMED_ACTIONS_PATH = "/systems/essence20/module/helpers/named-actions.mjs";
const POWER_ACTION_TYPES = Object.freeze([
  "free", "fullAction", "move", "standard", "standardAndMove",
  "wholeTurn", "tenMinutes", "oneHour"
]);
const UTILITY_TYPES = Object.freeze([
  "armor", "gear", "hangUp", "perk", "shield", "trait"
]);
const MOVEMENT_MODE_KEYS = Object.freeze({
  walk: "ground",
  ground: "ground",
  fly: "aerial",
  aerial: "aerial",
  burrow: "burrow",
  climb: "climb",
  swim: "swim"
});

function reportDiagnostics(actorId, diagnostics) {
  for (const diagnostic of diagnostics) {
    const key = `${actorId}:${diagnostic.key}`;
    if (REPORTED_DIAGNOSTICS.has(key)) continue;
    REPORTED_DIAGNOSTICS.add(key);
    console.warn(`enhancedcombathud-essence20 | ${diagnostic.message}`);
  }
}

function keyboardAction(element, label, activate) {
  element.tabIndex = 0;
  element.setAttribute("role", "button");
  element.setAttribute("aria-label", label);
  element.title = label;
  element.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    activate(event);
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

export function powerUsesRemaining(system = {}) {
  if (system.usesInterval !== "perDay") return null;
  const maximum = Number(system.usesPer);
  if (!Number.isFinite(maximum) || maximum <= 0) return null;
  return Math.max(0, maximum - (Number(system.usesSpent) || 0));
}

export function buildSkillRollDataset(skill, specialization = null, essence = skill.essences[0]) {
  return {
    skill: skill.key,
    essence: essence ?? "",
    shift: specialization?.shift ?? skill.shift,
    shiftUp: skill.shiftUp,
    shiftDown: skill.shiftDown,
    isSpecialized: specialization?.specialized ?? skill.specialized,
    canCritD2: skill.canCritD2,
    ...(specialization ? {
      specializationKey: specialization.key,
      specializationName: specialization.name
    } : {})
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

export function movementSpaces(actor, movementMode, sceneDistance) {
  const data = new Essence20ActorAdapter(actor).normalize();
  const key = MOVEMENT_MODE_KEYS[movementMode] ?? "ground";
  const distance = Number(sceneDistance);
  if (!Number.isFinite(distance) || distance <= 0) return 0;
  return Math.max(0, data.movement[key] / distance);
}

export async function rollInitiative(actor) {
  if (!actor?.isOwner || typeof actor.rollInitiative !== "function") {
    ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.NotOwner"));
    return;
  }
  return actor.rollInitiative({ createCombatants: true });
}

function waitForMorphUpdate(actor, expectedState, timeoutMs = 3000) {
  const hooks = globalThis.Hooks;
  if (typeof hooks?.on !== "function" || typeof hooks?.off !== "function") {
    return { promise: Promise.resolve(), cancel() {} };
  }

  let hookId;
  let timer;
  let finish;
  const promise = new Promise((resolve) => {
    finish = () => {
      if (hookId !== undefined) hooks.off("updateActor", hookId);
      if (timer !== undefined) clearTimeout(timer);
      resolve();
    };
    hookId = hooks.on("updateActor", (updatedActor) => {
      const sameActor = updatedActor === actor || updatedActor?.uuid === actor?.uuid;
      if (sameActor && Boolean(updatedActor.system?.isMorphed) === expectedState) finish();
    });
    timer = setTimeout(finish, timeoutMs);
  });
  return { promise, cancel: finish };
}

export async function toggleMorph(actor) {
  if (!actor?.isOwner || typeof actor.morph !== "function") {
    ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.NotOwner"));
    return;
  }
  const update = waitForMorphUpdate(actor, !Boolean(actor.system?.isMorphed));
  try {
    const result = actor.morph();
    await update.promise;
    const hud = globalThis.ui?.ARGON;
    if (hud?._target && typeof hud.bind === "function") await hud.bind(hud._target);
    else await hud?.render?.(true);
    return result;
  } catch (error) {
    update.cancel();
    throw error;
  }
}

export async function activatePower(actor, power, importer = (path) => import(path)) {
  if (!actor?.isOwner || power?.parent !== actor) {
    ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.NotOwner"));
    return;
  }
  const [{ powerCost }, { canUsePower }, { hasItemUse, canUsePerk, onPerkUse }] = await Promise.all([
    importer(POWER_HANDLER_PATH), importer(POWER_USE_PATH), importer(ITEM_USE_PATH)
  ]);
  if (hasItemUse(power)) {
    if (canUsePerk(power)) return onPerkUse(power);
  } else if (canUsePower(power)) {
    return powerCost(actor, power);
  }
  ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.PowerUnavailable"));
}

export async function runNamedHudAction(actor, key, importer = (path) => import(path)) {
  if (!actor?.isOwner) {
    ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.NotOwner"));
    return;
  }
  const economy = await importer(ACTION_ECONOMY_PATH);
  const { runNamedAction } = await importer(NAMED_ACTIONS_PATH);
  const context = economy.getActionsTabContext(actor);
  const action = context?.groups.flatMap((group) => group.actions)
    .find((entry) => entry.key === key);
  if (!context?.live || !action) return;
  if (key === "aim" && economy.isAiming(actor)) {
    ui.notifications.warn(game.i18n.format("E20.ActionEconomyAlreadyAiming", { name: actor.name }));
    return;
  }
  const actionType = economy.getNamedActionType(actor, key);
  const result = await economy.spend(actor, actionType, {
    source: game.i18n.localize(action.label), context: { key }
  });
  if (result.blocked) {
    if (!result.cancelled) ui.notifications.warn(game.i18n.format("E20.ActionEconomyUnaffordable", {
      name: actor.name, action: game.i18n.localize(action.label)
    }));
    return;
  }
  const outcome = await runNamedAction(actor, key);
  if (outcome?.cancelled) await economy.refund(actor, result.spendId);
  else if (outcome?.message) await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }), content: outcome.message
  });
  await globalThis.ui?.ARGON?.refresh?.();
  return outcome;
}

export async function showUtilityInfo(actor, item) {
  if (!actor?.isOwner || item?.parent !== actor || typeof item?.roll !== "function") {
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
    title: escapeHtml(utility.name),
    subtitle: game.i18n.localize(`ECHESSENCE20.Actions.UtilityTypes.${utility.type}`),
    description: await enrich(utility.description),
    details,
    propertiesLabel: "ECHESSENCE20.Tooltips.Properties",
    properties: [utility.classification, ...utility.traits]
      .filter(Boolean)
      .map((label) => ({ label: escapeHtml(label) })),
    footerText: escapeHtml(utility.source)
  };
}

export function createComponents(ARGON) {
  class Essence20AccordionCategory extends ARGON.MAIN.BUTTON_PANELS.ACCORDION.AccordionPanelCategory {
    async activateListeners(element) {
      await super.activateListeners(element);
      const heading = element.querySelector(".feature-accordion-title");
      if (heading) keyboardAction(heading, this.label, () => heading.click());
    }
  }

  class Essence20SkillButton extends ARGON.DRAWER.DrawerButton {
    async activateListeners(element) {
      await super.activateListeners(element);
      for (const span of element.querySelectorAll("span[data-index]")) {
        if (!span.onclick) continue;
        keyboardAction(span, span.textContent.trim(), () => span.click());
      }
    }
  }

  class Essence20NamedActionButton extends ARGON.MAIN.BUTTONS.ActionButton {
    constructor(action) {
      super();
      this.action = action;
    }

    get label() {
      const label = game.i18n.localize(this.action.label);
      return this.action.automated ? label
        : `${label} (${game.i18n.localize("ECHESSENCE20.Actions.TrackOnly")})`;
    }

    get icon() { return "modules/enhancedcombathud-essence20/assets/action-sigil.svg"; }
    get classes() { return [...super.classes, "essence20-named-action"]; }
    get hasTooltip() { return true; }

    async _renderInner() {
      await super._renderInner();
      this.element.classList.toggle("essence20-warning-action", !this.action.affordable);
    }

    async getTooltipData() {
      return {
        title: escapeHtml(this.label),
        subtitle: game.i18n.localize("ECHESSENCE20.Actions.TurnActions"),
        description: "",
        details: [{ label: "ECHESSENCE20.Tooltips.Cost", value: escapeHtml(this.action.costLabel) }],
        propertiesLabel: "ECHESSENCE20.Tooltips.Properties",
        properties: [],
        footerText: this.action.automated ? ""
          : game.i18n.localize("ECHESSENCE20.Actions.TrackOnlyHint")
      };
    }

    async activateListeners(element) {
      await super.activateListeners(element);
      keyboardAction(element, this.label, () => this._onLeftClick());
    }

    async _onLeftClick() { return runNamedHudAction(this.actor, this.action.key); }
  }

  class Essence20NamedActionsButton extends ARGON.MAIN.BUTTONS.ButtonPanelButton {
    get label() { return game.i18n.localize("ECHESSENCE20.Actions.TurnActions"); }
    get icon() { return "modules/enhancedcombathud-essence20/assets/action-sigil.svg"; }

    async activateListeners(element) {
      await super.activateListeners(element);
      keyboardAction(element, this.label, () => this._onClick(new Event("click")));
    }

    async _getPanel() {
      const { getActionsTabContext } = await import(ACTION_ECONOMY_PATH);
      const context = getActionsTabContext(this.actor);
      const categories = (context?.groups ?? []).flatMap((group) => {
        const buttons = group.actions.map((action) => new Essence20NamedActionButton(action));
        if (!buttons.length) return [];
        return [new Essence20AccordionCategory({
          label: game.i18n.localize(group.label), buttons
        })];
      });
      return new ARGON.MAIN.BUTTON_PANELS.ACCORDION.AccordionPanel({
        id: "essence20-turn-actions", accordionPanelCategories: categories
      });
    }
  }

  class Essence20NamedActionsPanel extends ARGON.MAIN.ActionPanel {
    get classes() {
      return ["actions-container", "essence20-actions-container", "essence20-turn-actions-container"];
    }
    get label() { return game.i18n.localize("ECHESSENCE20.Actions.TurnActions"); }

    async _getButtons() {
      if (!this.actor?.system?.actions || !game.combat?.started) return [];
      const { getActionsTabContext } = await import(ACTION_ECONOMY_PATH);
      return getActionsTabContext(this.actor)?.live ? [new Essence20NamedActionsButton()] : [];
    }
  }

  class Essence20WeaponEffectButton extends ARGON.MAIN.BUTTONS.ItemButton {
    constructor(effect) {
      super({ item: effect.document, inActionPanel: true });
      this.effect = effect;
    }

    get label() {
      const weapon = this.effect.weaponName;
      return weapon && !this.effect.name.toLowerCase().includes(weapon.toLowerCase())
        ? `${weapon} · ${this.effect.name}` : this.effect.name;
    }

    get hasTooltip() { return true; }

    get icon() {
      const icon = this.effect.img ?? this.item?.img;
      return icon?.endsWith("/weapon_effect.svg")
        ? "modules/enhancedcombathud-essence20/assets/weapon-sigil.svg" : icon;
    }

    async getTooltipData() {
      const details = [
        { label: "ECHESSENCE20.Tooltips.Skill", value: escapeHtml(this.effect.skill ?? "—") },
        { label: "ECHESSENCE20.Tooltips.Targets", value: this.effect.targets },
        { label: "ECHESSENCE20.Tooltips.Reach", value: this.effect.range.reach ?? "—" },
        { label: "ECHESSENCE20.Tooltips.Range", value: this.effect.range.normal ?? "—" }
      ];
      return {
        title: escapeHtml(this.label),
        subtitle: game.i18n.localize("ECHESSENCE20.Actions.Weapons"),
        description: "",
        details,
        propertiesLabel: "ECHESSENCE20.Tooltips.Properties",
        properties: [this.effect.style, this.effect.damage.type]
          .filter(Boolean).map((label) => ({ label: escapeHtml(label) })),
        footerText: this.effect.damage.value
          ? escapeHtml(`${this.effect.damage.value} ${this.effect.damage.type ?? ""}`.trim()) : ""
      };
    }

    async activateListeners(element) {
      await super.activateListeners(element);
      const label = `${this.label}, ${this.effect.targets} ${game.i18n.localize(
        "ECHESSENCE20.Tooltips.Targets")}`;
      keyboardAction(element, label, (event) => this._onPreLeftClick(event));
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
      if (!this.actor.isOwner || this.item?.parent !== this.actor
        || typeof this.item?.roll !== "function") {
        ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.NotOwner"));
        return;
      }
      return this.item.roll({ rollType: "weaponEffect" });
    }

    async _onPreLeftClick(event) {
      if (!this.actor.isOwner || this.item?.parent !== this.actor) {
        ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.NotOwner"));
        return;
      }
      return super._onPreLeftClick(event);
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
    }

    get quantity() { return powerUsesRemaining(this.item?.system); }
    get icon() {
      const icon = this.item?.img;
      return icon?.endsWith("/powers.svg")
        ? "modules/enhancedcombathud-essence20/assets/power-sigil.svg" : icon;
    }
    get hasTooltip() { return true; }

    async getTooltipData() {
      const system = this.item?.system ?? {};
      const remaining = powerUsesRemaining(system);
      const details = [
        { label: "ECHESSENCE20.Tooltips.Action", value: game.i18n.localize(
          `ECHESSENCE20.Actions.PowerTypes.${this.power.actionType}`) },
        { label: "ECHESSENCE20.Tooltips.Cost", value: system.hasVariableCost
          ? game.i18n.localize("ECHESSENCE20.Tooltips.Variable")
          : (system.powerCost ?? 0) }
      ];
      if (remaining !== null) details.push({
        label: "ECHESSENCE20.Tooltips.UsesRemaining",
        value: `${remaining}/${system.usesPer}`
      });
      return {
        title: escapeHtml(this.item.name),
        subtitle: game.i18n.localize("ECHESSENCE20.Actions.Powers"),
        description: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
          system.description ?? "", { relativeTo: this.item }
        ),
        details,
        propertiesLabel: "ECHESSENCE20.Tooltips.Properties",
        properties: [],
        footerText: this._available === false
          ? game.i18n.localize("ECHESSENCE20.Errors.PowerUnavailable") : ""
      };
    }

    async _renderInner() {
      const [{ canUsePower }, { hasItemUse, canUsePerk }] = await Promise.all([
        import(POWER_USE_PATH), import(ITEM_USE_PATH)
      ]);
      this._available = hasItemUse(this.item) ? canUsePerk(this.item) : canUsePower(this.item);
      await super._renderInner();
      this.element.classList.toggle("essence20-disabled-action", !this._available);
      this.element.setAttribute("aria-disabled", String(!this._available));
    }

    async activateListeners(element) {
      await super.activateListeners(element);
      const system = this.item?.system ?? {};
      const remaining = powerUsesRemaining(system);
      const cost = system.hasVariableCost
        ? game.i18n.localize("ECHESSENCE20.Tooltips.Variable")
        : (system.powerCost ?? 0);
      const label = [
        this.label,
        game.i18n.localize(`ECHESSENCE20.Actions.PowerTypes.${this.power.actionType}`),
        `${game.i18n.localize("ECHESSENCE20.Tooltips.Cost")}: ${cost}`,
        remaining === null ? null
          : `${game.i18n.localize("ECHESSENCE20.Tooltips.UsesRemaining")}: ${remaining}`,
        game.i18n.localize(`ECHESSENCE20.Tooltips.${this._available ? "Available" : "Unavailable"}`)
      ].filter(Boolean).join(", ");
      keyboardAction(element, label, (event) => this._onPreLeftClick(event));
    }

    async _onLeftClick() {
      if (!this.actor.isOwner || this.item?.parent !== this.actor
        || typeof this.item?.roll !== "function") {
        ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.NotOwner"));
        return;
      }
      return activatePower(this.actor, this.item);
    }

    async _onRightClick() {
      if (!this.actor.isOwner || this.item?.parent !== this.actor
        || typeof this.item?.roll !== "function") {
        ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.NotOwner"));
        return;
      }
      return this.item.roll({ rollType: "info" });
    }

    async _onPreLeftClick(event) {
      if (!this.actor.isOwner || this.item?.parent !== this.actor) {
        ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.NotOwner"));
        return;
      }
      return super._onPreLeftClick(event);
    }
  }

  class Essence20UtilityButton extends ARGON.MAIN.BUTTONS.ItemButton {
    constructor(utility) {
      super({ item: utility.document, inActionPanel: false });
      this.utility = utility;
    }

    get hasTooltip() { return true; }
    get icon() {
      const icon = this.item?.img;
      return /(?:\/perk\.svg|\/hazard\.svg)$/.test(icon ?? "")
        ? "modules/enhancedcombathud-essence20/assets/utility-sigil.svg" : icon;
    }

    async activateListeners(element) {
      await super.activateListeners(element);
      keyboardAction(element, this.label, () => this._onLeftClick());
    }

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
      const compactLabel = (key) => ({
        Health: "HP",
        toughness: "TGH",
        evasion: "EVA",
        willpower: "WIL",
        cleverness: "CLE",
        strength: "STR",
        speed: "SPD",
        smarts: "SMT",
        social: "SOC"
      })[key];

      return [
        [
          {
            id: "essence20-health",
            text: `${compactLabel("Health")} ${data.health.value}/${data.health.max}`,
            tooltip: label("Health"),
            color: STAT_COLORS.health
          },
          ...Object.entries(data.defenses).map(([key, value]) => ({
            id: `essence20-defense-${key}`,
            text: `${compactLabel(key)} ${value}`,
            tooltip: label(key),
            color: STAT_COLORS.defense
          })),
          ...Object.entries(data.essences).map(([key, resource]) => ({
            id: `essence20-essence-${key}`,
            text: `${compactLabel(key)} ${resource.value}/${resource.max}`,
            tooltip: label(key),
            color: STAT_COLORS[key]
          }))
        ]
      ];
    }

    async _renderInner(data) {
      await super._renderInner(data);
      this.element.classList.toggle("essence20-morphed", Boolean(this.actor?.system?.isMorphed));
      const actorColor = this.actor?.system?.color;
      if (typeof actorColor === "string" && /^#[\da-f]{6}$/i.test(actorColor)) {
        this.element.style.setProperty("--ech20-actor-color", actorColor);
      }
      for (const button of this.element.querySelectorAll(".player-button")) {
        keyboardAction(button, game.i18n.localize(button.dataset.tooltip), () => button.click());
      }
      const stats = this.element.querySelector(".portrait-stat-block:has(#essence20-health)");
      if (!stats) return;
      stats.classList.add("essence20-stat-grid");
      const definitions = (await this.getStatBlocks())[0];
      for (const definition of definitions) {
        const element = stats.querySelector(`#${definition.id}`);
        if (element && definition.tooltip) element.dataset.tooltip = definition.tooltip;
      }
    }
  }

  class Essence20DrawerPanel extends ARGON.DRAWER.DrawerPanel {
    get classes() {
      return ["ability-menu", "essence20-ability-menu"];
    }

    get title() {
      return game.i18n.localize("ECHESSENCE20.Drawer.Title");
    }

    async activateListeners(element) {
      await super.activateListeners(element);
      for (const heading of element.querySelectorAll(".ability-toggle .ability-title")) {
        keyboardAction(heading, heading.textContent.trim(), () => heading.click());
      }
    }

    get categories() {
      const data = new Essence20ActorAdapter(this.actor).normalize();
      const skillName = (key) => {
        const configured = globalThis.CONFIG?.E20?.skills?.[key];
        return configured ? game.i18n.localize(configured) : key;
      };
      const skillButton = (skill, essence, specialization = null) => {
        const label = specialization ? `↳ ${specialization.name}` : skillName(skill.key);
        const essenceLabel = globalThis.CONFIG?.E20?.essences?.[essence] ?? essence;
        const suffix = skill.essences.length > 1 ? ` (${game.i18n.localize(essenceLabel)})` : "";
        return new Essence20SkillButton([
          {
            label: `${label}${suffix}`,
            onClick: () => {
              if (!this.actor.isOwner || typeof this.actor.rollSkill !== "function") {
                ui.notifications.warn(game.i18n.localize("ECHESSENCE20.Errors.NotOwner"));
                return;
              }
              const current = new Essence20ActorAdapter(this.actor).normalize().skills
                .find((entry) => entry.key === skill.key);
              if (!current?.essences.includes(essence)) return;
              const currentSpecialization = specialization
                ? current.specializations.find((entry) => entry.key === specialization.key) : null;
              if (specialization && !currentSpecialization) return;
              const rollSpecialization = currentSpecialization && this.actor.type === "playerCharacter"
                ? { ...currentSpecialization, shift: current.shift, specialized: true }
                : currentSpecialization;
              return this.actor.rollSkill(buildSkillRollDataset(current, rollSpecialization, essence));
            }
          },
          { label: specialization && this.actor.type !== "playerCharacter"
            ? specialization.shift : formatSkillRank(skill) },
          { label: specialization ? (specialization.specialized ? "★" : "—") : formatSkillStatus(skill) }
        ]);
      };
      const buttons = data.skills.flatMap((skill) => skill.essences.flatMap((essence) => [
        skillButton(skill, essence),
        ...skill.specializations.map((specialization) => skillButton(skill, essence, specialization))
      ]));

      const categories = [{
        captions: [
          { label: "ECHESSENCE20.Drawer.Skill", align: "left" },
          { label: "ECHESSENCE20.Drawer.Rank", align: "center" },
          { label: "ECHESSENCE20.Drawer.Status", align: "center" }
        ],
        buttons,
        gridCols: "minmax(9rem, 1fr) 4rem 4rem"
      }];
      if (data.actionEconomy) categories.unshift({
        captions: [
          { label: "ECHESSENCE20.Drawer.Action", align: "left" },
          { label: "ECHESSENCE20.Drawer.Allowance", align: "center" },
          { label: "ECHESSENCE20.Drawer.Tracking", align: "center" }
        ],
        buttons: ["movement", "standard", "free"].map((key) => new Essence20SkillButton([
          { label: game.i18n.localize(`ECHESSENCE20.Drawer.ActionTypes.${key}`) },
          { label: String(data.actionEconomy[key]) },
          { label: data.actionEconomy.shared && key !== "free"
            ? game.i18n.localize("ECHESSENCE20.Drawer.Shared")
            : game.i18n.localize("ECHESSENCE20.Drawer.Prepared") }
        ])),
        gridCols: "minmax(9rem, 1fr) 4rem 5rem"
      });
      return categories;
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

    async activateListeners(element) {
      await super.activateListeners(element);
      keyboardAction(element, this.label, () => this._onClick(new Event("click")));
    }

    async _getPanel() {
      const data = new Essence20ActorAdapter(this.actor).normalize();
      const categories = POWER_ACTION_TYPES.flatMap((actionType) => {
        const buttons = data.powers
          .filter((power) => power.actionType === actionType)
          .map((power) => new Essence20PowerButton(power));
        if (!buttons.length) return [];
        return [new Essence20AccordionCategory({
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
      return "modules/enhancedcombathud-essence20/assets/utility-sigil.svg";
    }

    async activateListeners(element) {
      await super.activateListeners(element);
      keyboardAction(element, this.label, () => this._onClick(new Event("click")));
    }

    async _getPanel() {
      const data = new Essence20ActorAdapter(this.actor).normalize();
      const categories = UTILITY_TYPES.flatMap((type) => {
        const buttons = data.utility
          .filter((utility) => utility.type === type)
          .map((utility) => new Essence20UtilityButton(utility));
        if (!buttons.length) return [];
        return [new Essence20AccordionCategory({
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
    async render(...args) {
      await super.render(...args);
      this.element.querySelectorAll(".button-hud-button").forEach((element, index) => {
        const label = game.i18n.localize(this.buttons[index].label);
        keyboardAction(element, label, () => element.click());
      });
    }

    async _getButtons() {
      const data = new Essence20ActorAdapter(this.actor).normalize();
      const buttons = [{
        label: "ECHESSENCE20.Actions.Initiative",
        icon: "fa-solid fa-hourglass-start",
        onClick: () => rollInitiative(this.actor)
      }];
      if (data.morph.actionAvailable) buttons.push({
        label: data.morph.active
          ? "ECHESSENCE20.Actions.Return"
          : "ECHESSENCE20.Actions.Morph",
        icon: data.morph.active
          ? "fa-solid fa-rotate-left"
          : "fa-solid fa-person-rays",
        onClick: () => toggleMorph(this.actor)
      });
      return buttons;
    }
  }

  class Essence20MovementHud extends ARGON.MovementHud {
    get movementMax() {
      return movementSpaces(
        this.actor,
        this.movementMode,
        globalThis.canvas?.scene?.dimensions?.distance
      );
    }
  }

  class Essence20WeaponSets extends ARGON.WeaponSets {
    async _onSetChange() {}
  }

  return {
    Essence20PortraitPanel,
    Essence20DrawerPanel,
    Essence20ActionsPanel,
    Essence20NamedActionsPanel,
    Essence20PowersPanel,
    Essence20UtilitiesPanel,
    Essence20ButtonHud,
    Essence20MovementHud,
    Essence20WeaponSets
  };
}
