import { Essence20ActorAdapter } from "./adapter/actor-adapter.js";

const STAT_COLORS = Object.freeze({
  health: "#d66a6a",
  defense: "#d8c8a5",
  strength: "#c96a6a",
  speed: "#d6a85f",
  smarts: "#6fb8c9",
  social: "#a78ac7"
});

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

export function createComponents(ARGON) {
  class Essence20SkillButton extends ARGON.DRAWER.DrawerButton {}

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
      return game.i18n.localize("ECHESSENCE20.Actions.Title");
    }

    async _getButtons() {
      return [];
    }
  }

  class Essence20WeaponSets extends ARGON.WeaponSets {
    async _onSetChange() {}
  }

  return {
    Essence20PortraitPanel,
    Essence20DrawerPanel,
    Essence20ActionsPanel,
    Essence20WeaponSets
  };
}
