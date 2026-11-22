// geometry.js — the small shapes the sim stands on: line of sight, circles
// against rectangles, and angles. No game rules here, only maths.
export function clamp(value, low, high) {
  return value < low ? low : value > high ? high : value;
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

// Angle from (ax, ay) toward (bx, by), in radians.
export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

// Smallest absolute difference between two angles, 0..PI.
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

// Does the segment (x1,y1)-(x2,y2) cross the rectangle? Used for sight:
// a wall between a guard and the player breaks the line of sight.
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  if (dx === 0) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (dy === 0) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

export function segmentBlockedBySolids(x1, y1, x2, y2, solids) {
  for (let i = 0; i < solids.length; i += 1) {
    if (segmentHitsRect(x1, y1, x2, y2, solids[i])) return true;
  }
  return false;
}

// Push a circle (cx, cy, r) out of every solid rectangle it overlaps.
// Returns the corrected position; the circle slides along walls.
export function resolveCircle(cx, cy, r, solids) {
  let x = cx;
  let y = cy;
  for (let i = 0; i < solids.length; i += 1) {
    const s = solids[i];
    const nearestX = clamp(x, s.x, s.x + s.w);
    const nearestY = clamp(y, s.y, s.y + s.h);
    const dx = x - nearestX;
    const dy = y - nearestY;
    const d2 = dx * dx + dy * dy;
    if (d2 >= r * r) continue;
    if (d2 === 0) {
      // Centre inside the rectangle: push out along the shortest side.
      const left = x - s.x;
      const right = s.x + s.w - x;
      const top = y - s.y;
      const bottom = s.y + s.h - y;
      const m = Math.min(left, right, top, bottom);
      if (m === left) x = s.x - r;
      else if (m === right) x = s.x + s.w + r;
      else if (m === top) y = s.y - r;
      else y = s.y + s.h + r;
      continue;
    }
    const d = Math.sqrt(d2);
    x = nearestX + (dx / d) * r;
    y = nearestY + (dy / d) * r;
  }
  return { x, y };
}

// Is the point inside the circle?
export function pointInCircle(px, py, circle) {
  const dx = px - circle.x;
  const dy = py - circle.y;
  return dx * dx + dy * dy <= circle.r * circle.r;
}
