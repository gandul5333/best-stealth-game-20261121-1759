// sim.js — the world: one state object and one fixed step that advances
// the player, the guards, the detection meter and the win/lose rules.
// Nothing here draws or plays sound; it only changes state.
import { GAME, STEP } from './config.js';
import { distance } from './geometry.js';
import { ARTIFACTS, EXIT, solids } from './level.js';
import {
  GUARD_ALARM,
  anyGuardCatching,
  guardCanSee,
  guardHearNoise,
  makeGuards,
  stepGuard,
} from './guards.js';
import {
  atExit,
  collectArtifacts,
  makePlayer,
  movePlayer,
  playerHidden,
  resetPlayer,
  stepPebble,
  throwPebble,
} from './player.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAY = 'play';
export const PHASE_CAUGHT = 'caught';
export const PHASE_WIN = 'win';
export const PHASE_OVER = 'over';

export function makeWorld() {
  return {
    phase: PHASE_TITLE,
    time: 0,
    lives: GAME.lives,
    player: makePlayer(),
    guards: makeGuards(),
    solids: solids(),
    // The loudest current detection across all guards, 0..100.
    alarmLevel: 0,
    // Seconds since the alarm last sounded; the HUD fades with it.
    alarmAge: 0,
    caughtBy: null,
    caughtTimer: 0,
    // Events the shell (main.js) turns into sounds and messages.
    // Each step refills this list: 'alarm', 'caught', 'artifact:<name>',
    // 'pebble', 'win', 'lose'.
    events: [],
    // Last seen position, for the HUD's "last seen" marker.
    lastSeenX: 0,
    lastSeenY: 0,
  };
}

export function resetWorld(world) {
  const fresh = makeWorld();
  fresh.phase = world.phase;
  Object.assign(world, fresh);
}

// Send every guard to check the noise at (nx, ny).
function alertGuardsToNoise(world, nx, ny) {
  for (let i = 0; i < world.guards.length; i += 1) {
    const g = world.guards[i];
    if (distance(g.x, g.y, nx, ny) <= 260) guardHearNoise(g, nx, ny);
  }
}

// Start a fresh run from the title screen.
export function startRun(world) {
  resetWorld(world);
  world.phase = PHASE_PLAY;
}

// One fixed step. `input` is {dx, dy, sneak, throwX, throwY}.
// Returns the world, so callers can chain steps in tests and shots.
export function stepWorld(world, input, dt = STEP) {
  world.events = [];
  if (world.phase === PHASE_CAUGHT) {
    world.caughtTimer -= dt;
    if (world.caughtTimer <= 0) {
      if (world.lives <= 0) {
        world.phase = PHASE_OVER;
        world.events.push('lose');
      } else {
        // Slip back in through the service door; the wardens calm down.
        resetPlayer(world.player);
        world.guards = makeGuards();
        world.alarmLevel = 0;
        world.phase = PHASE_PLAY;
      }
    }
    return world;
  }
  if (world.phase !== PHASE_PLAY) return world;

  world.time += dt;
  const player = world.player;
  const hidden = playerHidden(player);

  // Throw first: the pebble leaves the hand before the step's movement.
  if (input.throwX !== undefined && input.throwY !== undefined) {
    if (throwPebble(player, input.throwX, input.throwY)) {
      world.events.push('pebble');
    }
  }
  const pebbleEvent = stepPebble(player, dt);
  if (pebbleEvent === 'landed') {
    alertGuardsToNoise(world, player.pebbleX, player.pebbleY);
    world.events.push('noise');
  }

  const loud = movePlayer(player, input.dx, input.dy, input.sneak, dt, world.solids);
  if (loud && player.moving) {
    // Running footsteps: any guard inside the noise radius comes to look.
    for (let i = 0; i < world.guards.length; i += 1) {
      const g = world.guards[i];
      if (g.state !== GUARD_ALARM && distance(g.x, g.y, player.x, player.y) <= 95) {
        guardHearNoise(g, player.x, player.y);
      }
    }
  }

  const found = collectArtifacts(player);
  if (found) world.events.push(`artifact:${found}`);

  // Guards see, chase, and catch.
  let maxDetection = 0;
  let alarmJustTripped = false;
  for (let i = 0; i < world.guards.length; i += 1) {
    const g = world.guards[i];
    const seen = guardCanSee(g, player.x, player.y, world.solids);
    if (seen && !hidden) {
      world.lastSeenX = player.x;
      world.lastSeenY = player.y;
    }
    const event = stepGuard(g, seen, hidden, player, dt, world.solids);
    if (event === 'alarm') alarmJustTripped = true;
    if (g.detection > maxDetection) maxDetection = g.detection;
  }
  world.alarmLevel = maxDetection;
  if (alarmJustTripped) {
    world.alarmAge = 0;
    world.events.push('alarm');
  }
  if (maxDetection >= 100) world.alarmAge += dt;

  const catcher = anyGuardCatching(world.guards, player);
  if (catcher) {
    world.lives -= 1;
    world.caughtBy = catcher.name;
    world.caughtTimer = GAME.caughtPause;
    world.phase = PHASE_CAUGHT;
    world.events.push('caught');
    return world;
  }

  if (atExit(player)) {
    world.phase = PHASE_WIN;
    world.events.push('win');
  }
  return world;
}

export function exitOpen(world) {
  return world.player.artifacts >= ARTIFACTS.length;
}

export function exitRect() {
  return EXIT;
}
