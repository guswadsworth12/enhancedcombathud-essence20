# Argon - Combat HUD (ESSENCE20)

Foundry VTT 14 system adapter for Argon Combat HUD Core 5.x and Essence20 6.0.3-beta.

The module exposes native Essence20 combat actions through Argon's bottom-screen HUD with a full occult visual theme by default. It delegates rolls and state changes to Essence20 rather than reimplementing system rules.

## Initial scope

- Player Character and NPC actor support
- Health, Defenses, Essences, movement, and initiative
- Skills grouped by Essence
- Weapons with native primary and alternate `weaponEffect` actions
- Powers grouped by action type and use frequency
- Perks, Hang-Ups, Traits, gear, and enriched tooltips
- Native Morph controls in 1.0
- GM token switching and player ownership enforcement
- Occult and plain themes with client-side accessibility settings

Story Point controls are intentionally excluded because a separate module remains authoritative.

## Status

The dev.22 preview adds prepared action budgets, native turn-action controls,
keyboard access for HUD buttons, Power availability and daily-use display,
and an original occult theme. The full 1.0 acceptance matrix remains in
development. This version targets the 6.0.3 beta and needs live-world checks.

The occult theme is the default. Client settings provide a plain theme,
comfortable/compact spacing, panel opacity, glow, high contrast, reduced
motion, and brass/teal/violet accents. Argon Core's own **HUD Scale** setting
controls overall size. For a 1080p-sized window, turn off Argon Core's
**Auto Scale** and start around 0.7–0.8; Auto Scale uses a much smaller size.
The vector seals in `assets/` were created for this module and use this
repository's license.

See [the implementation plan](docs/IMPLEMENTATION_PLAN.md) and
[the Phase 0 spike](docs/PHASE_0_SPIKE.md). Development and release procedures
are in [the development guide](docs/DEVELOPMENT.md).

## Target compatibility

- Foundry VTT 14.368
- Essence20 6.0.3-beta
- Argon Combat HUD Core 5.0.1

This repository is public. Development releases are experimental and may not
be suitable for active campaign sessions.

## AI development disclosure and risk notice

This project is developed with substantial assistance from AI agents under human direction and accountability. AI-generated or AI-modified code, documentation, tests, and visual assets may contain defects, insecure assumptions, compatibility problems, or incomplete rules interpretations.

Use this module at your own risk. Back up your Foundry world before installation or updates, test releases in a non-production world first, review changes before deployment, and keep a known-good module package available for rollback. No warranty is provided.
