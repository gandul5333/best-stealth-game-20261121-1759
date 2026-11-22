// render.js — everything the eye sees: the museum floor, the guards and
// their vision cones, the dark that hides you, and every screen and HUD
// line. It reads the world and never changes it.
import { PALETTE, VIEW } from './config.js';
import { ARTIFACTS, BUSHES, COVER, EXIT, LAMPS, WALLS } from './level.js';
import { GUARD_ALARM, GUARD_SUSPICIOUS } from './guards.js';
import { PHASE_CAUGHT, PHASE_OVER, PHASE_PLAY, PHASE_TITLE, PHASE_WIN, exitOpen } from './sim.js';
import { angleTo, distance } from './geometry.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Checkerboard tiles, dimmed so the floor reads at a glance.
  ctx.fillStyle = PALETTE.floorTile;
  const tile = 64;
  for (let y = 16; y < VIEW.height - 16; y += tile) {
    for (let x = 16; x < VIEW.width - 16; x += tile) {
      if (((x / tile) + (y / tile)) % 2 === 0) ctx.fillRect(x, y, tile, tile);
    }
  }
  // The great hall's carpet runner.
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(420, 360, 440, 300);
  ctx.strokeStyle = PALETTE.carpetEdge;
  ctx.lineWidth = 3;
  ctx.strokeRect(420, 360, 440, 300);
}

function drawWalls(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y + 4, w.w, w.h - 4);
  }
}

function drawCover(ctx) {
  for (const c of COVER) {
    if (c.kind === 'crate') {
      ctx.fillStyle = PALETTE.crate;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = PALETTE.crateEdge;
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + c.w, c.y + c.h);
      ctx.moveTo(c.x + c.w, c.y);
      ctx.lineTo(c.x, c.y + c.h);
      ctx.stroke();
    } else {
      // Display case: dark plinth, glass top, a glinting relic inside.
      ctx.fillStyle = PALETTE.displayCase;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = PALETTE.displayGlass;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8);
      ctx.globalAlpha = 1;
      ctx.fillStyle = PALETTE.artifact;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBushes(ctx, time) {
  for (const b of BUSHES) {
    ctx.fillStyle = PALETTE.bushEdge;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.bush;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r - 5, 0, Math.PI * 2);
    ctx.fill();
    // Leaves: a few darker dots that sway almost imperceptibly.
    ctx.fillStyle = '#1e4023';
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2 + time * 0.1;
      ctx.beginPath();
      ctx.arc(b.x + Math.cos(a) * (b.r - 12), b.y + Math.sin(a) * (b.r - 12), 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawArtifacts(ctx, world, time) {
  for (let i = 0; i < ARTIFACTS.length; i += 1) {
    if (world.player.collected[i]) continue;
    const a = ARTIFACTS[i];
    const bob = Math.sin(time * 2 + i * 2) * 3;
    // Plinth.
    ctx.fillStyle = '#3a3230';
    ctx.fillRect(a.x - 14, a.y - 10, 28, 20);
    // The relic itself, glowing so the eye finds it across the room.
    ctx.fillStyle = PALETTE.artifact;
    ctx.beginPath();
    ctx.arc(a.x, a.y + bob, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff6c8';
    ctx.beginPath();
    ctx.arc(a.x - 3, a.y + bob - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8d9a0';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(a.name, a.x, a.y + 30 + bob);
  }
}

function drawExit(ctx, world, time) {
  const open = exitOpen(world);
  const pulse = open ? 0.6 + Math.sin(time * 4) * 0.4 : 0.25;
  ctx.fillStyle = open ? PALETTE.exitDoor : '#2c4a33';
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.strokeStyle = PALETTE.exitGlow;
  ctx.globalAlpha = pulse;
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.globalAlpha = 1;
  ctx.fillStyle = open ? PALETTE.exitGlow : '#7a8a7d';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT — GO!' : 'EXIT — LOCKED', EXIT.x + EXIT.w / 2, EXIT.y - 8);
}

// A guard's vision cone: a wedge from the guard, clipped by the canvas.
function drawCone(ctx, guard) {
  const range = 235;
  const half = 0.62;
  const color = guard.state === GUARD_ALARM
    ? 'rgba(255, 64, 48, 0.30)'
    : guard.state === GUARD_SUSPICIOUS
      ? 'rgba(255, 166, 40, 0.26)'
      : 'rgba(255, 214, 90, 0.17)';
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, guard.facing - half, guard.facing + half);
  ctx.closePath();
  ctx.fill();
  // Cone edge lines, so the boundary reads even on the dark floor.
  ctx.strokeStyle = color.replace(/0\.\d+\)$/, '0.55)');
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing - half) * range, guard.y + Math.sin(guard.facing - half) * range);
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing + half) * range, guard.y + Math.sin(guard.facing + half) * range);
  ctx.stroke();
}

function drawGuard(ctx, guard) {
  drawCone(ctx, guard);
  const bob = Math.sin(guard.walked * 0.12) * 1.5;
  // Body: a warden in a dark coat with a brass badge.
  ctx.fillStyle = guard.state === GUARD_ALARM ? '#c94f43' : '#5d6b7a';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8c27a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y + bob, 14, 0, Math.PI * 2);
  ctx.stroke();
  // Facing: a small torch dot ahead of the guard.
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.facing) * 10, guard.y + bob + Math.sin(guard.facing) * 10, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Name tag.
  ctx.fillStyle = '#cfd8e3';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(guard.name, guard.x, guard.y + bob - 20);
  // Suspicion "?" / alarm "!" over the head.
  if (guard.state === GUARD_SUSPICIOUS || guard.detection >= 38) {
    ctx.fillStyle = '#ffb02e';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('?', guard.x, guard.y + bob - 32);
  }
  if (guard.state === GUARD_ALARM) {
    ctx.fillStyle = '#ff4030';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('!', guard.x, guard.y + bob - 32);
  }
}

function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(player.stepPhase * Math.PI * 2) * 2 : 0;
  // A soft shadow so Wren reads against the floor.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = player.sneaking ? '#c98f2a' : '#e8b23a';
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a5a12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, 13, 0, Math.PI * 2);
  ctx.stroke();
  // Hood point and satchel.
  ctx.fillStyle = '#3a2c10';
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob - 4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a6d2f';
  ctx.fillRect(player.x + 6, player.y + bob + 2, 7, 6);
  // Sneak indicator: a small "…" when crouched.
  if (player.sneaking) {
    ctx.fillStyle = '#e8d9a0';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('…', player.x, player.y + bob - 20);
  }
}

function drawPebble(ctx, player) {
  if (!player.pebbleActive && !player.pebbleLanded) return;
  ctx.fillStyle = '#b8b0a0';
  ctx.beginPath();
  ctx.arc(player.pebbleX, player.pebbleY, 4, 0, Math.PI * 2);
  ctx.fill();
  if (player.pebbleLanded) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.pebbleX, player.pebbleY, 14, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Night: a dark overlay with holes of light around the player and lamps,
// so the player sees what is safe and what is not. The overlay canvas is
// created once and reused: allocating a full-screen canvas every frame
// would drag the frame rate down for no reason.
let darkCanvas = null;
function drawDarkness(ctx, world) {
  if (!darkCanvas) {
    darkCanvas = document.createElement('canvas');
    darkCanvas.width = VIEW.width;
    darkCanvas.height = VIEW.height;
  }
  const off = darkCanvas;
  const octx = off.getContext('2d');
  octx.globalCompositeOperation = 'source-over';
  octx.clearRect(0, 0, VIEW.width, VIEW.height);
  octx.fillStyle = 'rgba(5, 7, 16, 0.50)';
  octx.fillRect(0, 0, VIEW.width, VIEW.height);
  octx.globalCompositeOperation = 'destination-out';
  const holes = [{ x: world.player.x, y: world.player.y, r: 190 }];
  for (const lamp of LAMPS) holes.push({ x: lamp.x, y: lamp.y, r: lamp.r });
  for (const h of holes) {
    const g = octx.createRadialGradient(h.x, h.y, 10, h.x, h.y, h.r);
    g.addColorStop(0, 'rgba(0,0,0,0.95)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    octx.fillStyle = g;
    octx.beginPath();
    octx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
    octx.fill();
  }
  ctx.drawImage(off, 0, 0);
}

function drawHud(ctx, world) {
  // Top bar.
  ctx.fillStyle = 'rgba(10, 10, 14, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, 44);
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`MOONLIGHT HEIST`, 16, 28);
  ctx.font = '15px sans-serif';
  ctx.fillText(`Relics  ${world.player.artifacts} / 3`, 250, 28);
  // Lives as hearts.
  ctx.fillStyle = '#ff5a6e';
  ctx.font = '16px sans-serif';
  ctx.fillText('♥'.repeat(Math.max(0, world.lives)) + '♡'.repeat(Math.max(0, 3 - world.lives)), 400, 28);
  // Detection eye: fills as any guard grows suspicious.
  const level = world.alarmLevel;
  ctx.fillStyle = '#8a8f9a';
  ctx.font = '15px sans-serif';
  ctx.fillText('SPOTTED', 560, 28);
  ctx.fillStyle = '#2a2a30';
  ctx.fillRect(640, 14, 180, 16);
  ctx.fillStyle = level < 38 ? '#e8c33a' : level < 100 ? '#ff8c2e' : '#ff4030';
  ctx.fillRect(640, 14, 180 * (level / 100), 16);
  ctx.fillStyle = '#f2ead8';
  ctx.fillText(`Time ${Math.floor(world.time / 60)}:${String(Math.floor(world.time % 60)).padStart(2, '0')}`, 880, 28);
  // Objective line.
  ctx.fillStyle = '#d8cfae';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'right';
  const objective = world.player.artifacts < 3
    ? `Lift the relics — ${3 - world.player.artifacts} left, then slip out the EXIT`
    : 'All relics lifted — reach the EXIT, unseen!';
  ctx.fillText(objective, VIEW.width - 16, 28);
  ctx.textAlign = 'left';
  // Controls hint along the bottom.
  ctx.fillStyle = 'rgba(10, 10, 14, 0.55)';
  ctx.fillRect(0, VIEW.height - 26, VIEW.width, 26);
  ctx.fillStyle = '#b8b0a0';
  ctx.font = '13px sans-serif';
  ctx.fillText('WASD / arrows — move    SHIFT — sneak (slow, quiet)    CLICK — throw a pebble to distract    P — pause', 16, VIEW.height - 8);
  // Last-seen marker: a fading ring where a guard last spotted you.
  if (world.alarmLevel > 0) {
    ctx.strokeStyle = `rgba(255, 80, 60, ${0.25 + (world.alarmLevel / 100) * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(world.lastSeenX, world.lastSeenY, 18, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 8, 12, 0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = accent;
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW.width / 2, 250);
  ctx.fillStyle = '#e8e0cc';
  ctx.font = '19px sans-serif';
  let y = 310;
  for (const line of lines) {
    ctx.fillText(line, VIEW.width / 2, y);
    y += 34;
  }
}

// Draw one frame. `screen` picks the overlay; PHASE_PLAY draws no overlay.
export function drawGame(ctx, world, screen, time) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx);
  drawWalls(ctx);
  drawCover(ctx);
  drawBushes(ctx, time);
  drawArtifacts(ctx, world, time);
  drawExit(ctx, world, time);
  for (const guard of world.guards) drawGuard(ctx, guard);
  drawPlayer(ctx, world.player, time);
  drawPebble(ctx, world.player);
  drawDarkness(ctx, world);
  drawHud(ctx, world);

  if (screen === SCREEN_TITLE || world.phase === PHASE_TITLE) {
    drawOverlay(ctx, 'MOONLIGHT HEIST', [
      'The Marlowe Museum, 2 a.m. Three relics. Four wardens. One way out.',
      'Stay out of the yellow cones. Crouch in the palms to hide.',
      'Run and they hear you — sneak, or throw a pebble to pull them away.',
      '',
      'Click to begin. WASD moves, SHIFT sneaks, CLICK throws a pebble.',
    ], '#e8b23a');
  } else if (screen === SCREEN_CAUGHT || world.phase === PHASE_CAUGHT) {
    drawOverlay(ctx, 'CAUGHT!', [
      `${world.caughtBy || 'A warden'} grabbed you in the dark.`,
      world.lives > 0 ? `${world.lives} ${world.lives === 1 ? 'life' : 'lives'} left — slipping back in…` : 'That was your last life.',
    ], '#ff5a4e');
  } else if (screen === SCREEN_WIN || world.phase === PHASE_WIN) {
    const mins = Math.floor(world.time / 60);
    const secs = String(Math.floor(world.time % 60)).padStart(2, '0');
    drawOverlay(ctx, 'CLEAN GETAWAY', [
      'All three relics, and not a single warden saw you leave.',
      `Time ${mins}:${secs}  •  Pebbles thrown: ${world.player.pebbles}`,
      '',
      'Press R to run it again.',
    ], '#7dff9e');
  } else if (screen === SCREEN_OVER || world.phase === PHASE_OVER) {
    drawOverlay(ctx, 'THE MUSEUM WINS', [
      'Three strikes — the wardens know your face now.',
      'Press R to try the job again.',
    ], '#ff5a4e');
  }
}
