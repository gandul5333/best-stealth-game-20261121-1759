// config.js — every tuning number for Moonlight Heist lives here, so a
// balance change is one edit and never a hunt through the simulation.
export const VIEW = { width: 1280, height: 720 };

export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  walkSpeed: 132,
  sneakSpeed: 66,
  // Running (not sneaking) is loud: guards inside this radius hear it.
  noiseRadius: 95,
  // A pebble is heard much further than footsteps.
  pebbleNoiseRadius: 170,
  pebbleRange: 320,
  pebbleSpeed: 520,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 56,
  investigateSpeed: 74,
  chaseSpeed: 98,
  // Vision cone: how far a guard sees and how wide the cone is.
  viewRange: 235,
  viewHalfAngle: 0.62,
  // Inside this distance a guard spots you even at the cone's edge.
  closeRange: 42,
  // Detection 0..100. Fills while you are seen, drains while you are not.
  fillRate: 95,
  drainRate: 26,
  // At this much detection a guard leaves patrol to check where you were.
  suspiciousAt: 38,
  // At this much the alarm sounds and every guard chases you.
  alarmAt: 100,
  // Seconds of no sight before a chasing guard gives up and goes back.
  loseSightAfter: 4,
  // Touching distance while the alarm is up means you are caught.
  catchDistance: 26,
  // How long a guard stares at the spot you were last seen before moving on.
  stareTime: 2.2,
};

export const GAME = {
  lives: 3,
  artifactsToWin: 3,
  // After being caught, this long (seconds) before play resumes.
  caughtPause: 1.6,
  // Seconds after the alarm ends before the exit can be used again.
  exitCooldown: 0,
};

export const PALETTE = {
  floor: '#23201a',
  floorTile: '#2a2721',
  wall: '#4a4238',
  wallTop: '#6b5f4c',
  carpet: '#3d2b33',
  carpetEdge: '#54333d',
  crate: '#7a5c33',
  crateEdge: '#a07c46',
  displayCase: '#274b5e',
  displayGlass: '#9fd8e8',
  bush: '#2e5d33',
  bushEdge: '#4c8a52',
  exitDoor: '#3fae5a',
  exitGlow: '#7dff9e',
  player: '#e8b23a',
  playerSneak: '#c98f2a',
  guard: '#c94f43',
  guardCalm: '#8fa3b8',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneSuspicious: 'rgba(255, 166, 40, 0.34)',
  coneAlarm: 'rgba(255, 64, 48, 0.38)',
  artifact: '#ffd94d',
  lamp: 'rgba(255, 214, 130, 0.16)',
  dark: 'rgba(6, 8, 18, 0.62)',
};
