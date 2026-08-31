export function createComponents(ARGON) {
  class Essence20PortraitPanel extends ARGON.PORTRAIT.PortraitPanel {
    get classes() {
      return ["portrait-hud", "essence20-portrait-hud"];
    }

    async getStatBlocks() {
      return [];
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
      return [];
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
