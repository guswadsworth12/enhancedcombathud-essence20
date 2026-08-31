# Development workflow

## Requirements

- Node.js 20 or newer
- Foundry VTT 14
- Essence20 5.1.x
- Argon - Combat HUD (CORE) 5.x

## Local checks

Run the complete package checks before every commit and release:

```bash
npm run check
```

This runs all Node tests and validates the Foundry manifest, dependency
declarations, required files, version alignment, and version-pinned release
URLs.

## Development install

Keep the repository worktree outside Foundry's data directory. Link the
worktree into the development Foundry instance, using an absolute path and an
empty destination:

```bash
ln -s /absolute/path/to/enhancedcombathud-essence20 \
  /absolute/path/to/FoundryUserData/Data/modules/enhancedcombathud-essence20
```

Never replace an existing module directory with that command. Remove only the
specific symlink when the development install is no longer needed.

## Release package

1. Update matching versions in `module.json` and `package.json`.
2. Point `manifest` and `download` at the same version tag.
3. Run `npm run check` on the exact commit to release.
4. Build from tracked files only:

   ```bash
   git archive --format=zip \
     --output=enhancedcombathud-essence20-VERSION.zip HEAD
   ```

5. Inspect and test the ZIP, calculate its SHA-256, then publish both
   `module.json` and the ZIP as release assets.
6. Fetch the public manifest and ZIP URLs anonymously before announcing them.

Development releases are prereleases. Back up the world and retain the prior
ZIP before every live-world update.
