// level.js — the Marlowe Museum floor plan: one job, the static level.
// Walls and cover block movement and line of sight; bushes hide the player
// without blocking movement; lamps are pools of light on the dark floor.
import { VIEW } from './config.js';

// A wall is a solid rectangle {x, y, w, h}. Cover is the same shape plus a
// kind, so the renderer knows how to draw it and the sim knows it blocks sight.
export const WALLS = [
  // Outer shell.
  { x: 0, y: 0, w: 1280, h: 16 },
  { x: 0, y: 704, w: 1280, h: 16 },
  { x: 0, y: 0, w: 16, h: 720 },
  { x: 1264, y: 0, w: 16, h: 720 },
  // Divider between the west wing and the great hall, with a door gap.
  { x: 380, y: 16, w: 16, h: 272 },
  { x: 380, y: 428, w: 16, h: 276 },
  // Divider between the great hall and the east wing, with a door gap.
  { x: 900, y: 16, w: 16, h: 272 },
  { x: 900, y: 428, w: 16, h: 276 },
  // A spine wall across the great hall, leaving two passages around it.
  { x: 560, y: 330, w: 200, h: 16 },
  // A short wall sheltering the vault corner in the east wing.
  { x: 1060, y: 200, w: 16, h: 140 },
  // A short wall sheltering the west wing's reading nook.
  { x: 200, y: 200, w: 16, h: 140 },
];

// Crates and display cases: solid cover you can crouch behind.
export const COVER = [
  // West wing: a crate stack near the idol, a display case by the nook.
  { kind: 'crate', x: 150, y: 120, w: 40, h: 40 },
  { kind: 'crate', x: 196, y: 120, w: 40, h: 40 },
  { kind: 'crate', x: 150, y: 166, w: 40, h: 40 },
  { kind: 'case', x: 250, y: 90, w: 64, h: 30 },
  { kind: 'case', x: 60, y: 300, w: 64, h: 30 },
  { kind: 'crate', x: 300, y: 560, w: 40, h: 40 },
  // Great hall: rows of display cases and crate stacks to weave between.
  { kind: 'case', x: 470, y: 120, w: 64, h: 30 },
  { kind: 'case', x: 640, y: 120, w: 64, h: 30 },
  { kind: 'crate', x: 470, y: 220, w: 40, h: 40 },
  { kind: 'crate', x: 516, y: 220, w: 40, h: 40 },
  { kind: 'case', x: 760, y: 220, w: 64, h: 30 },
  { kind: 'crate', x: 470, y: 520, w: 40, h: 40 },
  { kind: 'crate', x: 516, y: 520, w: 40, h: 40 },
  { kind: 'case', x: 640, y: 560, w: 64, h: 30 },
  { kind: 'case', x: 800, y: 480, w: 64, h: 30 },
  // East wing: crates guarding the vault approach, a case by the exit hall.
  { kind: 'crate', x: 980, y: 120, w: 40, h: 40 },
  { kind: 'crate', x: 1026, y: 120, w: 40, h: 40 },
  { kind: 'case', x: 1120, y: 220, w: 64, h: 30 },
  { kind: 'crate', x: 980, y: 520, w: 40, h: 40 },
  { kind: 'case', x: 1080, y: 560, w: 64, h: 30 },
];

// Bushes (potted palms): walkable, and standing inside one hides you unless
// a guard is almost on top of you.
export const BUSHES = [
  { x: 90, y: 480, r: 30 },
  { x: 330, y: 90, r: 28 },
  { x: 560, y: 420, r: 30 },
  { x: 830, y: 90, r: 28 },
  { x: 640, y: 380, r: 30 },
  { x: 960, y: 380, r: 28 },
  { x: 1200, y: 480, r: 30 },
  { x: 1200, y: 300, r: 28 },
];

// Warm lamp pools: light on the floor, and a landmark for the eye.
export const LAMPS = [
  { x: 200, y: 500, r: 130 },
  { x: 640, y: 300, r: 150 },
  { x: 640, y: 640, r: 120 },
  { x: 1100, y: 500, r: 130 },
  { x: 1100, y: 140, r: 120 },
];

// The three relics to lift. Each sits on a small plinth in its own wing.
export const ARTIFACTS = [
  { id: 'idol', name: 'Jade Idol', x: 90, y: 90 },
  { id: 'sapphire', name: 'Star Sapphire', x: 648, y: 178 },
  { id: 'mask', name: 'Golden Mask', x: 1180, y: 90 },
];

// The skylight exit in the south-east corner: it opens once all three
// relics are in your satchel.
export const EXIT = { x: 1180, y: 640, w: 64, h: 40 };

// Where Wren slips in through the service door.
export const PLAYER_START = { x: 70, y: 640 };

// Patrol routes: each guard walks its loop, pausing a beat at each post.
export const PATROLS = [
  {
    name: 'Dara',
    waypoints: [
      { x: 460, y: 90 }, { x: 840, y: 90 }, { x: 840, y: 300 },
      { x: 640, y: 300 }, { x: 460, y: 300 },
    ],
    pause: 1.2,
  },
  {
    name: 'Bram',
    waypoints: [
      { x: 90, y: 200 }, { x: 90, y: 560 }, { x: 320, y: 560 }, { x: 320, y: 200 },
    ],
    pause: 1.6,
  },
  {
    name: 'Sinta',
    waypoints: [
      { x: 960, y: 560 }, { x: 960, y: 90 }, { x: 1200, y: 90 }, { x: 1200, y: 560 },
    ],
    pause: 1.2,
  },
  {
    name: 'Tomas',
    waypoints: [
      { x: 460, y: 640 }, { x: 840, y: 640 }, { x: 840, y: 460 }, { x: 460, y: 460 },
    ],
    pause: 2.0,
  },
];

// Every solid rectangle in the level: walls plus cover.
export function solids() {
  return WALLS.concat(COVER);
}

export function levelBounds() {
  return { width: VIEW.width, height: VIEW.height };
}
