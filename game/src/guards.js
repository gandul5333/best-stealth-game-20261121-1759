// guards.js — the night wardens: patrol routes, vision cones, the
// detection meter, and what a guard does when it hears something.
// A guard is a small state machine: patrol -> suspicious -> alarm -> patrol.
import { GUARD, STEP } from './config.js';
import { angleDiff, angleTo, clamp, distance, segmentBlockedBySolids } from './geometry.js';
import { PATROLS } from './level.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_ALARM = 'alarm';

export function makeGuards() {
  return PATROLS.map((route, index) => {
    const start = route.waypoints[0];
    const next = route.waypoints[1];
    return {
      name: route.name,
      x: start.x,
      y: start.y,
      facing: angleTo(start.x, start.y, next.x, next.y),
      waypointIndex: 1,
      waypoints: route.waypoints,
      pause: route.pause,
      pauseLeft: 0,
      state: GUARD_PATROL,
      detection: 0,
      // Where the guard last saw (or heard) you; it walks there to check.
      lastSeenX: 0,
      lastSeenY: 0,
      loseSightLeft: 0,
      stareLeft: 0,
      // How far this guard has walked; the renderer swings its lamp with it.
      walked: index * 2.7,
    };
  });
}

// Can this guard see the point (tx, ty)? Inside the cone, inside range,
// and no wall or cover between guard and target.
export function guardCanSee(guard, tx, ty, solids) {
  const d = distance(guard.x, guard.y, tx, ty);
  if (d > GUARD.viewRange) return false;
  if (d > GUARD.closeRange) {
    const toTarget = angleTo(guard.x, guard.y, tx, ty);
    if (angleDiff(toTarget, guard.facing) > GUARD.viewHalfAngle) return false;
  }
  return !segmentBlockedBySolids(guard.x, guard.y, tx, ty, solids);
}

// How visible is the target to this guard right now, 0..1? Closer and more
// central in the cone means faster detection; a sneaking player is harder.
function visibility(guard, tx, ty, sneaking) {
  const d = distance(guard.x, guard.y, tx, ty);
  const rangePart = 1 - (d / GUARD.viewRange) * 0.55;
  const toTarget = angleTo(guard.x, guard.y, tx, ty);
  const anglePart = 1 - (angleDiff(toTarget, guard.facing) / GUARD.viewHalfAngle) * 0.45;
  let v = clamp(rangePart * anglePart, 0.15, 1);
  if (sneaking) v *= 0.55;
  return v;
}

// Walk toward (tx, ty) at speed, turning to face the direction of travel.
// Returns true when the guard arrives (within 4 px).
function walkToward(guard, tx, ty, speed, dt) {
  const d = distance(guard.x, guard.y, tx, ty);
  if (d <= 4) return true;
  const step = Math.min(d, speed * dt);
  const a = angleTo(guard.x, guard.y, tx, ty);
  guard.x += Math.cos(a) * step;
  guard.y += Math.sin(a) * step;
  guard.facing = a;
  guard.walked += step;
  return d - step <= 4;
}

// A guard heard a noise at (nx, ny): if it is not already chasing, go look.
export function guardHearNoise(guard, nx, ny) {
  if (guard.state === GUARD_ALARM) return;
  guard.lastSeenX = nx;
  guard.lastSeenY = ny;
  if (guard.state === GUARD_PATROL) {
    guard.state = GUARD_SUSPICIOUS;
    guard.stareLeft = 0;
  }
}

// One fixed step of one guard. `seen` says whether this guard can see the
// player this step; `hidden` says the player is inside a bush. Returns an
// event string ('alarm' when the alarm just tripped) or null.
export function stepGuard(guard, seen, hidden, player, dt, solids) {
  const d = distance(guard.x, guard.y, player.x, player.y);
  if (seen && !hidden) {
    guard.detection = clamp(
      guard.detection + GUARD.fillRate * visibility(guard, player.x, player.y, player.sneaking) * dt,
      0, 100,
    );
    guard.lastSeenX = player.x;
    guard.lastSeenY = player.y;
    guard.loseSightLeft = GUARD.loseSightAfter;
  } else {
    guard.detection = clamp(guard.detection - GUARD.drainRate * dt, 0, 100);
  }

  if (guard.state !== GUARD_ALARM && guard.detection >= GUARD.alarmAt) {
    guard.state = GUARD_ALARM;
    return 'alarm';
  }
  if (guard.state === GUARD_PATROL && guard.detection >= GUARD.suspiciousAt) {
    guard.state = GUARD_SUSPICIOUS;
    guard.stareLeft = 0;
  }

  if (guard.state === GUARD_ALARM) {
    if (seen && !hidden) {
      guard.loseSightLeft = GUARD.loseSightAfter;
      walkToward(guard, player.x, player.y, GUARD.chaseSpeed, dt);
    } else {
      guard.loseSightLeft -= dt;
      if (guard.loseSightLeft <= 0) {
        // Lost you: go check where you were last seen, then calm down.
        guard.state = GUARD_SUSPICIOUS;
        guard.stareLeft = 0;
      } else {
        walkToward(guard, guard.lastSeenX, guard.lastSeenY, GUARD.investigateSpeed, dt);
      }
    }
    return null;
  }

  if (guard.state === GUARD_SUSPICIOUS) {
    if (walkToward(guard, guard.lastSeenX, guard.lastSeenY, GUARD.investigateSpeed, dt)) {
      guard.stareLeft += dt;
      // Look around the spot for a while, then give up and resume patrol.
      guard.facing += Math.sin(guard.stareLeft * 3) * 0.02;
      if (guard.stareLeft >= GUARD.stareTime) {
        guard.state = GUARD_PATROL;
        guard.detection = 0;
      }
    }
    return null;
  }

  // Patrol: walk the loop, pausing a beat at each post.
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    return null;
  }
  const target = guard.waypoints[guard.waypointIndex];
  if (walkToward(guard, target.x, target.y, GUARD.patrolSpeed, dt)) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.pauseLeft = guard.pause;
  }
  return null;
}

// True when any guard is close enough to catch the player during the alarm.
export function anyGuardCatching(guards, player) {
  for (let i = 0; i < guards.length; i += 1) {
    const g = guards[i];
    if (g.state === GUARD_ALARM && distance(g.x, g.y, player.x, player.y) <= GUARD.catchDistance) {
      return g;
    }
  }
  return null;
}

export { STEP };
