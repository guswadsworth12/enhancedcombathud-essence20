# Argon - Combat HUD (ESSENCE20)

Foundry VTT 14 system adapter for Argon Combat HUD Core 5.x and Essence20 6.0.3-beta.

The module will expose native Essence20 combat actions through Argon's bottom-screen HUD and include an optional Rangers Occult visual theme. It will delegate rolls and state changes to Essence20 rather than reimplementing system rules.

## Initial scope

- Player Character and NPC actor support
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

The beta adapter exposes vitals, skills, embedded weapon effects, Powers,
utility information, movement, initiative, and Morph controls for owned
`playerCharacter` and `npc` tokens. It delegates rolls and state changes to
Essence20. The Rangers Occult theme and full 1.0 acceptance matrix remain in
development. This version targets the 6.0.3 beta and needs live-world checks
before release.

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
