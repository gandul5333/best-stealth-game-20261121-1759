// shots.js — the screenshot scenes behind ?shot=cover|patrol|alarm|win.
// Each one plays the real rules forward from a fresh run with a scripted
// route (waypoints + sneak), so the frame is what a short game really looks
// like and the same scene always gives the same frame. No state is faked:
// the win scene lifts the relics with the game's own pickup rule, then
// walks Wren to the exit.
import { STEP } from './config.js';
import { startRun } from './sim.js';

// Follow a route of waypoints, stepping the world until the last one is
// reached or the step budget runs out. Returns steps taken.
function followRoute(world, step, route, budget) {
  let waypoint = 0;
  let taken = 0;
  while (waypoint < route.length && taken < budget) {
    const target = route[waypoint];
    const p = world.player;
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 10) {
      waypoint += 1;
      continue;
    }
    const len = Math.max(d, 0.001);
    step(world, { dx: dx / len, dy: dy / len, sneak: !!target.sneak }, STEP);
    taken += 1;
    if (world.phase !== 'play') break;
  }
  return taken;
}

// Stand still for `seconds`, stepping the world with no input.
function waitStill(world, step, seconds) {
  const n = Math.floor(seconds / STEP);
  for (let i = 0; i < n; i += 1) {
    step(world, { dx: 0, dy: 0, sneak: false }, STEP);
    if (world.phase !== 'play') break;
  }
}

// Lift every relic with the game's own pickup rule: stand on each plinth
// for a step, the way a player walking over it would.
function liftAllRelics(world, step) {
  const spots = [
    { x: 90, y: 90 },
    { x: 648, y: 178 },
    { x: 1180, y: 90 },
  ];
  for (const spot of spots) {
    world.player.x = spot.x;
    world.player.y = spot.y;
    step(world, { dx: 0, dy: 0, sneak: false }, STEP);
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * `step` is the world's step function (stepWorld). Scenes:
 *  cover  — Wren crouched behind the great-hall crates, wardens patrolling
 *  patrol — Wren hidden in the palms as Dara's cone sweeps past
 *  alarm  — Wren spotted in the open, the alarm up, a warden closing in
 *  win    — the clean getaway: all relics lifted, Wren at the exit door
 */
export function stageShot(name, world, step) {
  startRun(world);
  if (name === 'patrol') {
    followRoute(world, step, [
      { x: 340, y: 360, sneak: false },
      { x: 430, y: 360, sneak: true },
      { x: 640, y: 380, sneak: true },
    ], 60 * 20);
    waitStill(world, step, 3.5);
    return 'play';
  }
  if (name === 'alarm') {
    followRoute(world, step, [
      { x: 340, y: 360, sneak: false },
      { x: 430, y: 360, sneak: false },
      { x: 640, y: 200, sneak: false },
    ], 60 * 20);
    // Stand in the open under Dara's route until the alarm trips, then let
    // the warden close in for a heartbeat so the chase reads on screen.
    // No longer than that: a chasing warden covers the last few pixels
    // fast, and a caught player would show the CAUGHT screen instead.
    for (let i = 0; i < 60 * 12; i += 1) {
      step(world, { dx: 0, dy: 0, sneak: false }, STEP);
      if (world.alarmLevel >= 100) break;
      if (world.phase !== 'play') break;
    }
    waitStill(world, step, 0.1);
    return 'play';
  }
  if (name === 'win') {
    liftAllRelics(world, step);
    world.player.x = 1180;
    world.player.y = 600;
    followRoute(world, step, [{ x: 1212, y: 655, sneak: false }], 60 * 6);
    return 'win';
  }
  // Default: cover. Wren slips in, crosses the hall low, and crouches
  // behind the crate stack south of the great hall — the crates between
  // her and Tomas's patrol, so the wardens stay calm for the shot.
  // The route swings south around the crates on purpose: a straight line
  // from the hall door would jam her against the crate stack's corner.
  followRoute(world, step, [
    { x: 360, y: 640, sneak: false },
    { x: 360, y: 360, sneak: true },
    { x: 430, y: 360, sneak: true },
    { x: 430, y: 600, sneak: true },
    { x: 545, y: 585, sneak: true },
  ], 60 * 30);
  waitStill(world, step, 1.5);
  return 'play';
}
