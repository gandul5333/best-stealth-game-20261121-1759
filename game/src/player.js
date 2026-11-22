// player.js — Wren, the thief: movement, sneaking, the pebble throw, and
// the noise footsteps make. The player never touches guard logic directly.
import { PLAYER } from './config.js';
import { clamp, distance, resolveCircle } from './geometry.js';
import { ARTIFACTS, BUSHES, EXIT, PLAYER_START } from './level.js';

export function makePlayer() {
  return {
    x: PLAYER_START.x,
    y: PLAYER_START.y,
    sneaking: false,
    moving: false,
    // Footstep timer: the renderer bobs Wren with it, audio ticks with it.
    stepPhase: 0,
    stepInterval: 0.42,
    artifacts: 0,
    collected: ARTIFACTS.map(() => false),
    pebbles: 0,
    pebbleX: 0,
    pebbleY: 0,
    pebbleActive: false,
    pebbleLanded: false,
  };
}

export function resetPlayer(player) {
  const fresh = makePlayer();
  Object.assign(player, fresh);
}

// Is the player standing inside a bush (hidden from guards at range)?
export function playerHidden(player) {
  for (let i = 0; i < BUSHES.length; i += 1) {
    if (distance(player.x, player.y, BUSHES[i].x, BUSHES[i].y) <= BUSHES[i].r) return true;
  }
  return false;
}

// Move the player by the input vector (dx, dy in -1..1) for dt seconds.
// Returns true when the player is moving loudly enough to be heard.
export function movePlayer(player, dx, dy, sneaking, dt, solids) {
  const len = Math.hypot(dx, dy);
  player.sneaking = sneaking;
  if (len < 0.01) {
    player.moving = false;
    return false;
  }
  const speed = sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  const nx = player.x + (dx / len) * speed * dt;
  const ny = player.y + (dy / len) * speed * dt;
  const fixed = resolveCircle(nx, ny, PLAYER.radius, solids);
  player.x = clamp(fixed.x, 16 + PLAYER.radius, 1280 - 16 - PLAYER.radius);
  player.y = clamp(fixed.y, 16 + PLAYER.radius, 720 - 16 - PLAYER.radius);
  player.moving = true;
  player.stepPhase += dt / player.stepInterval;
  return !sneaking;
}

// Throw a pebble toward (tx, ty): it flies in a straight line and lands
// with a clatter that pulls guards over to investigate.
export function throwPebble(player, tx, ty) {
  const d = distance(player.x, player.y, tx, ty);
  if (d < 12 || player.pebbleActive) return false;
  const range = Math.min(d, PLAYER.pebbleRange);
  const a = Math.atan2(ty - player.y, tx - player.x);
  player.pebbleX = player.x + Math.cos(a) * range;
  player.pebbleY = player.y + Math.sin(a) * range;
  player.pebbleActive = true;
  player.pebbleLanded = false;
  player.pebbles += 1;
  return true;
}

// Advance the pebble's flight; returns 'landed' the step it touches down.
export function stepPebble(player, dt) {
  if (!player.pebbleActive) return null;
  player.pebbleLanded = true;
  player.pebbleActive = false;
  return 'landed';
}

// Pick up any artifact the player is standing on. Returns its name or null.
export function collectArtifacts(player) {
  for (let i = 0; i < ARTIFACTS.length; i += 1) {
    if (player.collected[i]) continue;
    if (distance(player.x, player.y, ARTIFACTS[i].x, ARTIFACTS[i].y) <= 30) {
      player.collected[i] = true;
      player.artifacts += 1;
      return ARTIFACTS[i].name;
    }
  }
  return null;
}

// True when the player stands in the exit doorway with every relic.
export function atExit(player) {
  return (
    player.artifacts >= ARTIFACTS.length &&
    player.x >= EXIT.x && player.x <= EXIT.x + EXIT.w &&
    player.y >= EXIT.y && player.y <= EXIT.y + EXIT.h
  );
}
