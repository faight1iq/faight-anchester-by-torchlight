# E13 basement map (scene 13.01), built 2026-11-17

Code draws floors, walls, doors and the stair; ChatGPT only furnishes. Geometry is `layout.json` (feet, 40 px per ft, 7800 x 5200).
The Foundry walls are unchanged and sit on the floor outline (`e13-dungeon.walls.json`).

    python3 e13crops.py          # gpt2/crop-<rk>.png + crops2.json (magenta = floor to furnish)
    python3 e13prompts.py        # prompts2.json
    python3 e13base.py tex       # base.png: textured floors, gutter, walls, doors, stair
    ./run-comp.sh                # e13-final.png from ret/r-<rk>.png, with the per-room fixes
    # then save WebP q86 to assets/scenes/abtl-e13-basement.webp

- `ret/`: the ChatGPT returns used (Crooked Knot is the second roll).
- `tex/`: ChatGPT floor textures (flagstone, tile, brick, wood); concrete is procedural.
- Door lanes: 10 ft into each room, 5 ft into each hall, door width + 1 ft. Objects in a lane are removed;
  the Machine Ward's left-wall beds are moved clear of the double-door lane and their cables redrawn (run-comp.sh).
- The study rug reaches into its door lane and is kept (a rug is floor).

## Animated effects (2026-11-17)
    python3 fx_miasma.py    # fx/abtl-e13-fx-miasma.webm: full-map purple-green mist, 24 s loop, 975 x 650 (scaled 8x)
    python3 fx_eyes.py      # fx/abtl-e13-fx-eye-{a,b,c}.webm: eyes that open, look, blink and close (11/14/17 s loops)
- Copied to `assets/scenes/abtl-e13-fx/`. In scene 13.01: one miasma tile over the whole map and 18 eye tiles (4.5 x 2.8 ft)
  against the hall, Knot and vault walls (`fx/eyes.json`), all flagged `role: fx`, locked, looping, muted.
- Lights: Injection Ward lamps flicker (flame), Knot corners purple swirling fog, vault spill ghost-green, machine slow pulse,
  plus six faint purple/green fog lights in the halls (flagged `role: fx`).
