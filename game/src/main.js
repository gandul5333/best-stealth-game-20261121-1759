// main.js — the shell around the sim: keyboard + mouse input, the frame
// loop, the title / caught / win screens, and the ?shot= scenes used for
// screenshots. The rules live in sim.js; this file only wires them up.
import { STEP, VIEW } from './config.js';
import { makeWorld, startRun, stepWorld } from './sim.js';
import { PHASE_CAUGHT, PHASE_OVER, PHASE_PLAY, PHASE_TITLE, PHASE_WIN } from './sim.js';
import { drawGame } from './render.js';
import {
  playAlarm,
  playCaught,
  playPebble,
  playPickup,
  playStep,
  playWin,
  unlockAudio,
} from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const world = makeWorld();
const keys = new Set();
let mouse = { x: 0, y: 0 };
let throwQueued = null;
let lastStepSound = 0;

function readInput() {
  let dx = 0;
  let dy = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
  return { dx, dy, sneak: keys.has('ShiftLeft') || keys.has('ShiftRight') };
}

function handleEvents() {
  for (const event of world.events) {
    if (event === 'alarm') playAlarm();
    else if (event === 'caught') playCaught();
    else if (event === 'pebble') playPebble();
    else if (event === 'win') playWin();
    else if (event.startsWith('artifact:')) playPickup();
  }
}

function frame(now) {
  const input = readInput();
  if (throwQueued) {
    input.throwX = throwQueued.x;
    input.throwY = throwQueued.y;
    throwQueued = null;
  }
  stepWorld(world, input, STEP);
  handleEvents();
  // Footsteps: a soft tick each time Wren's stride completes.
  if (world.phase === PHASE_PLAY && world.player.moving && now - lastStepSound > 380) {
    lastStepSound = now;
    playStep(world.player.sneaking);
  }
  drawGame(ctx, world, null, now / 1000);
  requestAnimationFrame(frame);
}

function canvasPos(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
    y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
  };
}

window.addEventListener('keydown', (event) => {
  unlockAudio();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
  if (event.code === 'KeyR' && (world.phase === PHASE_WIN || world.phase === PHASE_OVER)) {
    startRun(world);
    return;
  }
  keys.add(event.code);
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
});

canvas.addEventListener('mousedown', (event) => {
  unlockAudio();
  const pos = canvasPos(event);
  mouse = pos;
  if (world.phase === PHASE_TITLE) {
    startRun(world);
    return;
  }
  if (world.phase === PHASE_WIN || world.phase === PHASE_OVER) {
    startRun(world);
    return;
  }
  if (world.phase === PHASE_PLAY) throwQueued = pos;
});

// Screenshot mode: ?shot=cover|patrol|alarm|win stages the scene with the
// real rules, draws one frame, and stops — the frame is the screenshot.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  const screen = stageShot(shot, world, stepWorld);
  drawGame(ctx, world, screen, 4.2);
  document.title = `Moonlight Heist — shot ${shot}`;
} else {
  drawGame(ctx, world, null, 0);
  requestAnimationFrame(frame);
}
