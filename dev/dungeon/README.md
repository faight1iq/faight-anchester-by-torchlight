# Dungeon build tools

Shared with Beyond the Last Torch (`faight1iq/faight-beyond-the-last-torch`, `dev/dungeon/`). Keep the two copies in step.
The procedure is in the `foundry-dungeon-pipeline` skill; ABTL settings are in the ABTL project doc `claude/abtl-pipeline-settings.md`.

- One Page Dungeon maps: `layout.py`, `scenedata.py`, `basemap.py`, `crops.py`, `composite.py`, `doors.py`.
- Watabou glade (outdoor) maps: `glade.py` (open ground, tree and water masks from the SVG).
- Both: `water.py`, `tokens.py`, `split.py`, `build_scene.js`, `ship.js`.
- Module id: Python reads `DUNGEON_MOD` (set it to `faight-anchester-by-torchlight`); the Foundry scripts take `mod` in `cfg`.
- `example-tsw/` is a finished BTLT dungeon's inputs (5LEI-5, Tomb of the Storm Witch), kept as the format example for `plan.json`, `encounters.json`, `monsters.js`, `items.js`, `rooms.json` and `lore.md`.
- This folder must be excluded from the module zip: `"dev/*"` in the `zip -r` excludes of `.github/workflows/release.yml`.
