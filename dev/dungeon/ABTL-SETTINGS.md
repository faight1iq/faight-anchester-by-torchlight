# ABTL pipeline settings

Settings for running the `foundry-dungeon-pipeline` skill on Anchester by Torchlight. Put a copy in the ABTL Claude project as `claude/abtl-pipeline-settings.md` and fill in the blanks.

## Known

| Setting | Value |
|---|---|
| Module / world id | `faight-anchester-by-torchlight` |
| World name | Faight: Anchester by Torchlight |
| Local folder | `D:\Storage\My Files\Code\GitHub\faight-anchester-by-torchlight` |
| Repo | `faight1iq/faight-anchester-by-torchlight` (public) |
| Build tools | `dev/dungeon/` (branch `dungeon-tools`) |
| Packs | Adventure `faight-anchester-by-torchlight`, plus actors, journals, items, playlists, scenes |
| Required modules | monks-active-tiles, token-attacher, betterroofs, fxmaster, tile-scroll, tokenmagic, tagger |
| Monster sheet tab | ABTL Monster Design (same "Character Progression" sheet) |
| Monsters | Mythos cultists: Awakened (CR 5), Corrupted (CR 6), Cultist Elder (CR 7); Awakened and Corrupted Aberrations; Ether creatures. Death curses raise the next form. Doom Counter and Dread Insight carry between scenes. Full stat blocks are in the world. |
| Writing | Homebrewery episode layout (Episode Summary, Scenes, map key, Cast, Horrors); no em dashes |
| Map names | Episode map numbers: Episode 9 used 09.06 to 09.09 |

## To fill in

| Setting | Value |
|---|---|
| Party level and size | Level 14 (John, 2026-10-20); size ? |
| Item economy at that level | ? (BTLT Character Progression or the ABTL tab) |
| Claude user in the ABTL world (id) | ? |
| Test character for traps | ? |
| Episode 10 map number | 10.01 ? |
| Sacrifice's name; what a finished ritual produces | ? |

## Repo issues found on 2026-10-20 (fix before shipping packs)

1. `.gitignore` contains `faight-anchester-by-torchlight/`, which also ignores `packs/faight-anchester-by-torchlight/`, the Adventure pack. That pack is not in git, so releases ship without the Adventure compendium. Change the line to `/faight-anchester-by-torchlight/` if it was meant for a top-level folder, or remove it.
2. Pack `LOCK`, `LOG` and `LOG.old` files are committed. Add `packs/**/LOCK`, `packs/**/LOG`, `packs/**/LOG.old` to `.gitignore` and remove them from git.
3. No `.gitattributes`. Add `* text=auto` and `packs/** -text` so pack `CURRENT` files never get CRLF line endings.
4. `release.yml` zips everything except `.git`, `.github`, `.gitignore`, `*.tmp`, `README.md`. Add `"dev/*"` before merging `dungeon-tools`.
5. `relationships.requires` has no manifest URLs, so Foundry and Sqyre cannot auto-install the required modules.
