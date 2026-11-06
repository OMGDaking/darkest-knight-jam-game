# Build Plan

Drafted by the build terminal from your context kit and your card; you edit and approve it in `/jam-plan`. One page. Nothing here that you didn't say or approve.

**Approved by:**

## The game in one line

> A first-person samurai duel in a cursed Japanese castle: parry until the enemy's guard breaks, then cut them down. Three fights, ending in a final boss whose attacks lock to the beat at half health.

## The one action

> Press at the right moment to parry. Everything else serves it: the gauge, the attack, the three enemies, the music.

## Card

> 5. Timing tapper — press at the right moment.

## Done means (3 to 5 checks you can play)

- [ ] I can parry an attack, and a perfect parry, a block and a hit all feel different
- [ ] Parrying empties the enemy's gauge, and then I can attack and defeat them
- [ ] I die, press one key, and I'm back in the fight in under 2 seconds
- [ ] I can play three fights in a row and win
- [ ] On the final boss, at half health the music starts and its attacks land on the beat

## Milestones

| Milestone | By | Done when (your words) |
|---|---|---|
| M1 gray box | 1:30 | One enemy, one attack, plain shapes: parry it or take the hit; restart works |
| M2 loop | 2:00 | Gauge, attack, death, score, restart under 2 seconds. **Playtest 1** |
| M3 feel | 2:45 | Windows and cadence live in `tuning.js`; spark and blood land with the hit; heavy attacks and the dodge; boss 2 patterns. **Playtest 2** |
| M4 look | 3:15 | Castle backdrop, samurai art, gauge UI; boss 3's half-health music phase |
| M5 ship | 3:30 | `JUDGING.md` self-check, `meta.json`, `/jam-ship` |

## Tasks

Tasks in the same wave touch different files, so they can run at the same time.

| Milestone | Task | Files | Owner | Check |
|---|---|---|---|---|
| M1 | First-person rig: camera, visible sword, lantern | `index.html`, `main.js`, `player.js` | jam-builder | Page loads, mouse looks, no console errors |
| M1 | One placeholder enemy that swings on a 2.5–3 s cadence | `enemies.js`, `tuning.js` | jam-builder | Enemy attacks on a steady cadence |
| M1 | Parry resolution: perfect, block, hit | `combat.js` | jam-builder | Each of the three outcomes is visibly distinct |
| M1 | Debug readout showing which outcome fired | `ui.js` | jam-builder | Readout matches the parry you made |
| M1 | Restart | `main.js` | jam-builder | One key restarts in under a second |
| M2 | Enemy gauge: drains on parry, empty = open | `combat.js` | jam-builder | Enough parries empties the gauge |
| M2 | Attack an open enemy until defeated | `combat.js` | jam-builder | A defeated enemy ends the fight |
| M2 | Health bar, enemy gauge, score | `ui.js` | jam-builder | All three read correctly during a fight |
| M2 | Fight state machine: title, fight, win, next, game over, restart | `main.js` | jam-builder | Full loop runs end to end |
| M2 | Parry spark and hit flash, plain colours | `fx.js` | jam-builder | Something visible on every parry and every hit |
| M3 | Every window and cadence number named in `tuning.js` | `tuning.js` | jam-builder | Makers can change a number and feel the difference |
| M3 | Heavy attacks and the dodge | `combat.js`, `player.js` | jam-builder | Heavy attacks resolve differently from light |
| M3 | Three enemies as data: cadence, heavy chance, gauge | `enemies.js` | jam-builder | Each fight is measurably harder |
| M3 | Blood, aura, hit shake | `fx.js` | jam-builder | Damage reads at a glance |
| M3 | On-screen FPS readout behind `?fps` | `main.js` | jam-builder | `?fps` shows the number |
| M4 | Backdrops: castle hall, throne room | `art.js` | jam-builder | Both arenas read as the references' mood |
| M4 | Samurai silhouettes for player, mini boss, final boss | `art.js` | jam-builder | Three enemies are tellable apart |
| M4 | BPM clock and the half-health phase on boss 3 | `beats.js` | jam-builder | At half health, music starts and attacks land on the beat |
| M4 | Parry, hurt and defeat sounds | `assets/audio/*` | jam-builder | Each of the three plays in the right moment |
| M4 | `meta.json` credits and `ai_assets` | `meta.json` | jam-helper | Every shipped file is listed |
| M5 | `JUDGING.md` self-check | — | jam-helper | Checklist read back to the makers |

## File map

- `index.html`: page, import map, loads `main.js`
- `main.js`: scene, loop, fight state machine
- `tuning.js`: every number you might tune
- `player.js`: first-person camera, sword, lantern, parry and attack input
- `combat.js`: parry windows, gauge, health, damage resolution
- `enemies.js`: the three enemies as data
- `ui.js`: health bar, enemy gauge, score, title and game over
- `fx.js`: parry spark, blood, aura, hit shake
- `beats.js`: the BPM clock and the music-locked final phase
- `art.js`: backdrops and silhouettes
- `assets/audio/`: the three sounds and the music track

## Tuning knobs

- `perfectParryWindow`: `1.0` — press within this long before the blade lands
- `blockWindow`: `1.6` — press this early and you block instead
- `attackIntervalMin` / `attackIntervalMax`: `2.5` / `3.0`
- `heavyChance`: per enemy — `0` for the basic enemy
- `enemyGaugeMax`, `gaugeDrainPerfect`, `gaugeDrainBlock`
- `playerHealthMax`
- `bpm`: `185` (from your reference)
- `finalPhaseHealth`: `0.5`

## Assets plan (the card's safe budget)

- **Art:** the reference images are reference only — never shipped, never loaded into the game. Every backdrop and character is rebuilt to match their palette and silhouette.
- **VFX:** parry spark, blood and aura drawn in code. No downloaded files.
- **Sounds (3, the safe budget):** parry, player hurt, enemy defeated.
- **Music (1):** the final phase only. **[OPEN — A: Claude generates a track at a fixed BPM; B: you drop in a CC0 track; C: placeholder click now, real track at M4]**
- No 3D models planned. The bundled CC0 character pack in `assets-packs/` is there if we want one.

## Cut list

- If behind at 2:00: the three fights become one enemy that escalates — gauge refills, cadence tightens
- If behind at 2:45: boss 3 becomes the second half of boss 2 — at half health it flips to the music phase
- If behind at 3:00: heavy attacks just hit harder, and the dodge waits
- If behind at 3:00: one backdrop, recoloured for the later fights

## Stretch (only after M4)

- Dodge in the opposite direction on heavy attacks
- Music layers that build as the beat phase goes on
- A "BPM 185" readout on the gauge
- A visual beat cue on the enemy's wind-up
