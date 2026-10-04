# Live Foundry acceptance matrix

Target: Foundry 14.368, Essence20 6.0.3-beta, Argon Core 5.0.1.

| Workflow | Live observation | Next check |
| --- | --- | --- |
| Module enabled and HUD loads | dev.23 active in Module Management; HUD loads on The Stitcher without a module console error | Repeat after the next preview reload |
| NPC portrait, defenses, Essences, equipped weapon effects, Power and utility lists | dev.23 renders The Stitcher, three weapon effects, three Powers, and utility sections; original sigils appear | Check player character and alternate item types |
| Actor health | HUD 3/0 matches the beta actor sheet's 3/0 | Compare a test actor with a positive maximum |
| Action allowance labels | dev.23 displays Actions per turn / Max / Rule, with Movement 1, Standard 1, Free 2 and System tracking | Check live costs during combat |
| Tooltip and settings | dev.23 weapon tooltip, Power accordion, high contrast, plain, compact, and reduced-motion settings render and apply immediately | Recheck plain-theme contrast and skill-column label after next preview reload; check keyboard focus |
| Skill and weapon rolls | Pending disposable actor | Compare chat result with actor sheet |
| Initiative and combat turn actions | Pending disposable actor and combat | Check costs, disabled states and refunds |
| Power activation and daily uses | Pending disposable actor | Compare resource changes with actor sheet |
| Morph and return | Pending disposable actor with Morph | Check token, portrait and action refresh |
| GM switching and player permissions | Pending separate role check | Test token ownership boundaries |

Do not run resource-spending checks on campaign actors. Record the exact test actor and scene when one is supplied.
