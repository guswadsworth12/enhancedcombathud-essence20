# Live Foundry acceptance matrix

Target: Foundry 14.368, Essence20 6.0.3-beta, Argon Core 5.0.1.

| Workflow | dev.21 observation | Next check |
| --- | --- | --- |
| Module enabled and HUD loads | Passed in the user's world; no module console error | Repeat on dev.23 |
| NPC portrait, defenses, Essences, equipped weapon effects, Power and utility lists | Rendered for The Stitcher | Check labels and generic art in dev.23 |
| Actor health | HUD 3/0 matches the beta actor sheet's 3/0 | Compare a test actor with a positive maximum |
| Action allowance labels | Raw keys on dev.21; fixed in dev.23 source | Verify after reload |
| Tooltip and settings | Weapon tooltip and appearance settings render | Check keyboard focus and high contrast |
| Skill and weapon rolls | Pending disposable actor | Compare chat result with actor sheet |
| Initiative and combat turn actions | Pending disposable actor and combat | Check costs, disabled states and refunds |
| Power activation and daily uses | Pending disposable actor | Compare resource changes with actor sheet |
| Morph and return | Pending disposable actor with Morph | Check token, portrait and action refresh |
| GM switching and player permissions | Pending separate role check | Test token ownership boundaries |

Do not run resource-spending checks on campaign actors. Record the exact test actor and scene when one is supplied.
