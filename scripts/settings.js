import { MODULE_ID } from "./constants.js";

export const SETTINGS = Object.freeze({
  debugLogging: "debugLogging",
  theme: "theme",
  density: "density",
  opacity: "opacity",
  glow: "glow",
  contrast: "contrast",
  motion: "motion",
  accent: "accent"
});

export function applyThemeSettings(game, root = globalThis.document?.documentElement) {
  if (!root) return;
  const get = (key) => game.settings.get(MODULE_ID, key);
  root.dataset.echEssence20Theme = get(SETTINGS.theme);
  root.dataset.echEssence20Density = get(SETTINGS.density);
  root.dataset.echEssence20Contrast = String(get(SETTINGS.contrast));
  root.dataset.echEssence20Motion = get(SETTINGS.motion);
  root.dataset.echEssence20Accent = get(SETTINGS.accent);
  root.style.setProperty("--ech20-opacity", String(get(SETTINGS.opacity)));
  root.style.setProperty("--ech20-glow", `${Math.round(get(SETTINGS.glow) * 12)}px`);
}

export function registerSettings(game) {
  const register = (key, options) => game.settings.register(MODULE_ID, key, {
    scope: "client", config: true, ...options,
    onChange: () => applyThemeSettings(game)
  });
  register(SETTINGS.debugLogging, {
    name: "ECHESSENCE20.Settings.DebugLogging.Name",
    hint: "ECHESSENCE20.Settings.DebugLogging.Hint",
    type: Boolean,
    default: false
  });
  register(SETTINGS.theme, {
    name: "ECHESSENCE20.Settings.Theme.Name",
    hint: "ECHESSENCE20.Settings.Theme.Hint",
    type: String, default: "occult",
    choices: {
      occult: "ECHESSENCE20.Settings.Theme.Occult",
      plain: "ECHESSENCE20.Settings.Theme.Plain"
    }
  });
  register(SETTINGS.density, {
    name: "ECHESSENCE20.Settings.Density.Name",
    hint: "ECHESSENCE20.Settings.Density.Hint",
    type: String, default: "comfortable",
    choices: {
      comfortable: "ECHESSENCE20.Settings.Density.Comfortable",
      compact: "ECHESSENCE20.Settings.Density.Compact"
    }
  });
  register(SETTINGS.opacity, {
    name: "ECHESSENCE20.Settings.Opacity.Name",
    hint: "ECHESSENCE20.Settings.Opacity.Hint",
    type: Number, default: 0.96,
    range: { min: 0.75, max: 1, step: 0.01 }
  });
  register(SETTINGS.glow, {
    name: "ECHESSENCE20.Settings.Glow.Name",
    hint: "ECHESSENCE20.Settings.Glow.Hint",
    type: Number, default: 0.35,
    range: { min: 0, max: 1, step: 0.05 }
  });
  register(SETTINGS.contrast, {
    name: "ECHESSENCE20.Settings.Contrast.Name",
    hint: "ECHESSENCE20.Settings.Contrast.Hint",
    type: Boolean, default: false
  });
  register(SETTINGS.motion, {
    name: "ECHESSENCE20.Settings.Motion.Name",
    hint: "ECHESSENCE20.Settings.Motion.Hint",
    type: String, default: "system",
    choices: {
      system: "ECHESSENCE20.Settings.Motion.System",
      reduced: "ECHESSENCE20.Settings.Motion.Reduced"
    }
  });
  register(SETTINGS.accent, {
    name: "ECHESSENCE20.Settings.Accent.Name",
    hint: "ECHESSENCE20.Settings.Accent.Hint",
    type: String, default: "brass",
    choices: {
      brass: "ECHESSENCE20.Settings.Accent.Brass",
      teal: "ECHESSENCE20.Settings.Accent.Teal",
      violet: "ECHESSENCE20.Settings.Accent.Violet"
    }
  });
}
