# Argon - Combat HUD (ESSENCE20)

Private Foundry VTT 14 system adapter for Argon Combat HUD Core 5.x and Essence20 5.1.

The module will expose native Essence20 combat actions through Argon's bottom-screen HUD and include an optional Rangers Occult visual theme. It will delegate rolls and state changes to Essence20 rather than reimplementing system rules.

## Initial scope

- Power Ranger and NPC actor support
- Health, Defenses, Essences, movement, and initiative
- Skills grouped by Essence
- Weapons with native primary and alternate `weaponEffect` actions
- Powers grouped by action type and use frequency
- Perks, Hang-Ups, Traits, gear, and enriched tooltips
- Native Morph controls in 1.0
- GM token switching and player ownership enforcement
- Default and Rangers Occult themes with accessibility settings

Story Point controls are intentionally excluded because a separate module remains authoritative.

## Status

Planning and API validation. No implementation has started.

See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).

## Target compatibility

- Foundry VTT 14.367
- Essence20 5.1.0
- Argon Combat HUD Core 5.x, exact version to be pinned during the API spike

This repository is private during initial development.

## AI development disclosure and risk notice

This project is developed with substantial assistance from AI agents under human direction and accountability. AI-generated or AI-modified code, documentation, tests, and visual assets may contain defects, insecure assumptions, compatibility problems, or incomplete rules interpretations.

Use this module at your own risk. Back up your Foundry world before installation or updates, test releases in a non-production world first, review changes before deployment, and keep a known-good module package available for rollback. No warranty is provided.
