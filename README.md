# Moonlight Heist — The Marlowe Job

[![Best Stealth Game](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Rank](https://make.fun/badge/best-stealth-game-20261121-1759/gandul5333/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Reward](https://make.fun/badge/best-stealth-game-20261121-1759/gandul5333/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A complete top-down stealth game, played in desktop Chrome from static
files — no build step, no network requests. Built for the
[make.fun best stealth game bounty](https://make.fun/bounty/best-stealth-game-20261121-1759).

## The job

The Marlowe Museum, 2 a.m. You are Wren, a thief with a satchel and a
pocketful of pebbles. Lift three relics — the Jade Idol, the Star Sapphire,
the Golden Mask — and slip out the skylight exit unseen. Four night
wardens patrol the halls with torches and vision cones. Get caught three
times and the museum wins.

## How it plays

- **WASD / arrows** — move. **SHIFT** — sneak: slow, quiet, harder to spot.
- **Click** — throw a pebble. It clatters on the marble and pulls the
  nearest warden over to investigate.
- **Vision cones** — a warden's yellow cone is what it can see. Step into
  it and its SPOTTED meter fills; at full, the alarm sounds and every
  warden chases you. Break line of sight and the alarm fades — you get a
  chance to recover.
- **Cover** — crates and display cases block sight and movement. Crouch
  behind them, or hide in the potted palms: a warden can't see you inside
  a bush unless it is almost on top of you.
- **Noise** — running is loud. A warden inside your footstep radius comes
  to look. Sneak past, or throw a pebble the other way.
- **The exit** — locked until all three relics are lifted, then it glows
  green. Reach it unseen for a clean getaway.

## What's inside

- `game/index.html` + `game/src/` — the whole game, vanilla JS + canvas,
  split by job: `config.js` (tuning), `level.js` (the museum floor plan),
  `geometry.js` (line of sight, collision), `guards.js` (patrol / suspect /
  alarm AI), `player.js` (movement, pebbles, pickups), `sim.js` (the world
  step), `render.js` (floor, cones, night lighting, HUD, screens),
  `audio.js` (synthesized WebAudio: footsteps, alarm sting, pickup chime),
  `shots.js` (the screenshot scenes), `main.js` (input + frame loop).
- `screenshots/` — four real renders of the game running in headless
  Chrome: cover (Wren behind the crates), patrol (hidden in the palms as
  a cone sweeps past), alarm (spotted, the warden closing in), win (the
  clean getaway).
- `main.ts` — the hand-in program: copies `game/` + `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library.
- `serve.ts` — `node serve.ts`, then open http://localhost:8080 to play.

## Play it

```sh
node serve.ts
# open http://localhost:8080 — click to begin
```

## Hand it in (local check)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
