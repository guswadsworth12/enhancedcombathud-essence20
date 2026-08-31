# Phase 0: Argon API and License Spike

## Outcome

Argon Core 5.x supports an Essence20 adapter without a Core patch. The initial
module scaffold registers original adapter classes through the public
`argonInit` hook and `CoreHUD.define*` methods.

## Pinned references

- Argon Core release: 5.0.1, Git tag `5.0.1`, commit
  `65f6d65ef7e410223307f65c65db686f9be565a6`
- Published 5.0.1 manifest SHA-256:
  `3916f8f781c811347fb6bde4153598b013f3304f07b2da1cbc0ffa3e885cdfad`
- Published 5.0.1 module ZIP SHA-256:
  `577304fe50a51531899944c9fb39684e7286623abc2e7a50ae32eaa9a2dee098`
- Maintained Foundry 14 adapter pattern: Argon - Combat HUD (RMU) 2.3.0
- Additional readable adapter reference: Argon - Combat HUD (DRAGONBANE)
  0.12.0
- Target runtime: Foundry 14.367 and Essence20 5.1.0

Argon's source-tree `module.json` at the pinned tag reports `3.1.0` even though
the GitHub/Foundry release is 5.0.1. Development and installation must use the
published 5.0.1 release artifact, not a package assembled directly from that
source-tree manifest.

## Verified extension points

Core calls `Hooks.callAll("argonInit", CoreHud)` during construction. A system
adapter can then register through:

- `definePortraitPanel`
- `defineDrawerPanel`
- `defineMainPanels`
- `defineMovementHud`
- `defineWeaponSets`
- `defineButtonHud`
- `defineTooltip`
- `defineSupportedActorTypes`

The current scaffold intentionally registers only the component set needed to
render safely: portrait, drawer, one empty main panel, and supported actor
types. Gameplay buttons remain out until their exact native Essence20 5.1 call
paths have live-world evidence.

## License boundary

Argon Core is GPL-3.0. This adapter calls its public registration API but does
not copy Core source, templates, images, or styles. A maintained adapter (RMU)
uses an independent MIT license, supporting the same clean interoperability
boundary. This private repository currently uses an all-rights-reserved
license. All theme art and code must remain original, and Essence20 rules text
or proprietary assets must not be redistributed.

## Phase gate

The Core-patch risk is closed. A live Foundry 14.367 test proved that published
Argon 5.0.1 loads this scaffold for an owned `playerCharacter` token and renders
the custom Essence20 portrait, drawer, and empty action panel. A post-test MCP
read confirmed that the Actor and Item data remained unchanged. The owner
accepted this evidence and authorized Phase 1.

Essence20 5.1 exposes rollable embedded
`weaponEffect` Items linked to weapons by `flags.essence20.parentId`, and its
public `actor.morph()` helper is the required Morph entry point. These call
paths still require live-world evidence before actionable HUD controls are
added.

The first smoke-test build inherited Argon Core's red
`WeaponSets._onSetChange() is not implemented` base-stub diagnostic. Development
build `0.1.0-dev.3` registers an adapter-owned no-op weapon-set handler so the
action-free scaffold no longer falls through to that Core stub.

The verified 5.0.1 artifact is installed locally at
`FoundryUserData/Data/modules/enhancedcombathud`. The previously present
`token-action-hud-core` 1.3.2 is a different HUD family and is not used by this
adapter.

## Sources

- https://foundryvtt.com/packages/enhancedcombathud
- https://github.com/theripper93/enhancedcombathud/tree/5.0.1
- https://github.com/Filroden/enhancedcombathud-rmu
- https://github.com/rayners/enhancedcombathud-dragonbane
