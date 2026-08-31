# Repository Instructions

- This repository contains a Foundry VTT system adapter, not a fork of Argon Core or Essence20.
- Read `docs/IMPLEMENTATION_PLAN.md` before non-trivial changes.
- Never patch dependency source files as an implementation shortcut.
- Route Essence20 data access through the adapter layer and delegate rolls/state changes to native system methods.
- Treat nested `weaponEffect` records as first-class actions.
- Preserve player ownership checks and GM authority at every action boundary.
- Keep Story Point controls out of scope; the dedicated module remains authoritative.
- Include Morph controls in the 1.0 acceptance matrix.
- Use original or properly licensed visual assets and preserve all required notices.
- Run the complete package test suite before committing code changes.
- Do not commit secrets, local Foundry data, exported actors, or copyrighted book assets.
- Follow the workspace Git attribution rules; do not infer authorship, co-authorship, sign-off, or signing identity.

## Repository attribution policy

- The repository owner's configured Git identity is the accountable author for authorized project commits.
- The project must prominently disclose AI-assisted development and use-at-own-risk terms in the README.
- Do not add an agent `Co-authored-by` trailer unless a stable, verified agent name and email have been established.
- Do not add DCO sign-off or cryptographic signing unless separately required and configured for the accountable author.
