# Implementation Plan

## Objective

Build `enhancedcombathud-essence20`, titled **Argon - Combat HUD (ESSENCE20)**, as a Foundry VTT 14 adapter for Essence20 6.0.3-beta and Argon Core 5.x. Give the full HUD a default occult theme with a plain option, without modifying either dependency.

## Fixed decisions

- Use Argon's supported system-adapter model rather than imitate or fork its HUD.
- Keep all Essence20 field access behind adapter classes.
- Invoke native `actor.rollSkill`, `actor.rollInitiative`, weapon-effect Item
  roll, Power activation helpers, turn-action ledger, and `actor.morph()` behavior.
- Support `playerCharacter` and `npc` before vehicles, Zords, and megaforms.
- Treat embedded `weaponEffect` Items as first-class HUD actions. Resolve them from
  `actor.items` by their `flags.essence20.parentId` link to the owning weapon; do
  not execute the weapon's denormalized `system.items` display cache.
- Include Morph controls in 1.0.
- Exclude Story Point controls; the dedicated Story Points module remains authoritative.

## Delivery stages

- [#3 Native combat and Morph](https://github.com/guswadsworth12/enhancedcombathud-essence20/issues/3): finish live rolls, initiative, turn actions, Power spending, Morph, and ownership checks.
- [#4 Readability and customization](https://github.com/guswadsworth12/enhancedcombathud-essence20/issues/4): verify typography, focus, tooltips, density, high contrast, and Argon Core scale.
- [#5 Full occult theme](https://github.com/guswadsworth12/enhancedcombathud-essence20/issues/5): finish cohesive original assets and review every panel and target marker in Foundry.
- [#6 Hardening and 1.0](https://github.com/guswadsworth12/enhancedcombathud-essence20/issues/6): complete the [live acceptance matrix](LIVE_TEST_MATRIX.md), module conflict and rollback checks, packaging, and release.

The dev.22 preview implements the first pass across these stages. Draft PR #7 stays open until the live acceptance matrix passes.

## Phases

### 0. Argon API and license spike

- Pin the tested Argon 5.x release.
- Inspect the current adapter API and one maintained community adapter.
- Confirm license and attribution requirements.
- Register a minimal Essence20 adapter and open Argon for a controlled token.

Exit when no Argon Core patch is required.

### 1. Scaffold and compatibility

- Add manifest, dependency declarations, version guards, settings, localization, logging, tests, packaging, and development-install workflow.
- Fail with actionable notifications on unsupported versions or systems.

Exit when the module loads once without console errors.

### 2. Normalized Essence20 adapter

- Normalize actor identity, vitals, Defenses, Essences, movement, skills, weapons, nested effects, powers, utility items, and Morph state.
- Add defensive readers and sanitized fixtures for a player character plus Bound, Redactor, and Stitcher.

Exit when adapter tests are independent of Argon UI code.

### 3. Playable HUD

- Portrait/status area, initiative, skills, weapon effects, powers, utility panels, and enriched tooltips.
- Keep the initial Utility information boundary to Armor, Gear, Hang-Ups,
  Perks, Shields, and Traits. Defer other information-safe Item types until the
  core `playerCharacter`/`npc` combat and Morph matrix is complete; never add a
  type to the generic information path unless its native details template is
  verified.
- Group powers by Essence20's real action types: Free, Full Action, Move,
  Standard, Standard and Move, Whole Turn, Ten Minutes, and One Hour. Use
  `canActivate` only for sheet-parity visibility/availability; native
  `powerCost` remains authoritative for resource affordability.
- Use Essence20's native daily-use tracking where available; do not invent
  counters for other use frequencies.
- Delegate every executable action to native Essence20 methods.

Exit when a player can complete a basic combat turn without opening the actor sheet.

### 4. GM workflow and Morph controls

- Fast token switching, NPC-ready defaults, native turn-action tracking, movement display, target-count guidance, native Morph controls, and mixed ownership tests.

Exit when the GM can run Bound, Redactor, and Stitcher consecutively and a Ranger can Morph without stale HUD state.

### 5. Full occult theme

- Smoked obsidian, aged brass, bone-white type, controlled teal-violet glow, actor-color accents, original occult seal assets, defense talismans, ritual-card panels, effect seals, field-guide tooltips, and summoning-circle target marker.
- Add high contrast, reduced motion, opacity, glow, and theme settings; use Argon Core's scale control.

Exit when switching to the plain theme restores an Argon-aligned appearance and accessibility remains intact.

### 6. Hardening and release

- Complete actor-type audit, automated tests, live workflow matrix, module-conflict testing, documentation, screenshots, changelog, license, packaging, installation rehearsal, and rollback check.

Exit when all 1.0 acceptance criteria pass.

## 1.0 acceptance criteria

1. Compatible with Foundry 14.368, Essence20 6.0.3-beta, and the pinned Argon 5.x release.
2. Opens and switches correctly for `playerCharacter` and `npc` actors.
3. Displays accurate Health, Defenses, Essences, and movement.
4. Uses native initiative and skill workflows.
5. Presents every valid nested weapon effect separately and invokes the intended effect.
6. Groups powers by action type and shows availability/use frequency.
7. Enforces player ownership and GM authority.
8. Runs the three Concordance NPCs without opening their sheets.
9. Provides usable occult and plain themes.
10. Supports native Morph and return behavior without stale state.
11. Passes high-contrast and reduced-motion review.
12. Produces no persistent errors, duplicate hooks, duplicate HUDs, or stale actor state.
13. Leaves Actor and Item data unchanged when disabled or uninstalled.

## Estimate

Five to ten focused development days for a polished 1.0, assuming Argon exposes the required adapter extension points. Stop and revise the plan if the Phase 0 spike reveals a Core API gap.

## Source references

- https://foundryvtt.com/packages/enhancedcombathud
- https://wiki.theripper93.com/free/enhancedcombathud
- https://foundryvtt.com/article/module-development/
- https://foundryvtt.com/api/modules/foundry.applications.html
