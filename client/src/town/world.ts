// Procedurally generates the static layer of the town (ground, roads, buildings,
// trees…) into one offscreen canvas, and records the spots that animate at runtime
// (windows, street lamps, fountains, traffic signals).
//
// Layout: a wrapping grid of city blocks. Every PX×PY tiles there is a 2-tile road,
// flanked by 1-tile sidewalks; the 20×14-tile interior is a block.

import { type G, type Rng, disc, ellipse, makeCanvas, mod, pick, pixelText, rect, rint, rng, shade } from './gfx';
import { makeVehicle } from './sprites';

export const T = 16;
export const PX = 24;
export const PY = 18;
export const NX = 4;
export const NY = 3;
export const PXW = PX * T;
export const PYW = PY * T;
export const WW = PXW * NX;
export const WH = PYW * NY;

export interface Pt {
  x: number;
  y: number;
}
export interface Win extends Pt {
  w: number;
  h: number;
  on: boolean;
}
export interface Signal extends Pt {
  axis: 'h' | 'v';
}
export interface World {
  ground: HTMLCanvasElement;
  windows: Win[];
  lamps: Pt[];
  fountains: Pt[];
  signals: Signal[];
  start: Pt;
}

const C = {
  grass: '#74b24c',
  grassD: '#62a03f',
  grassL: '#8cc661',
  asphalt: '#4f535f',
  asphaltD: '#474a55',
  asphaltL: '#5a5e6b',
  line: '#e9e5da',
  edge: '#686c79',
  side: '#d5cdbd',
  sideD: '#c0b7a5',
  curb: '#8f8777',
  pave: '#dcd6c9',
  paveD: '#c9c2b3',
  path: '#e4d19f',
  pathD: '#cfba86',
  water: '#5aaed6',
  waterL: '#9fd8ef',
  outline: '#2b2d3a',
  shadow: 'rgba(22,32,48,0.28)',
};

const WALLS = ['#eadbc0', '#e3a878', '#f1eee7', '#c9d6c0', '#e8bfae', '#d8cbe6', '#f0dca0', '#c7d4e2'];
const GLASS_WALLS = ['#9fb3c7', '#8fa9b8', '#aab7c4'];
const FLAT_ROOFS = ['#8c7a6a', '#6f7d8c', '#9a6252', '#6a7a62', '#7c6d8e', '#58646f', '#a08466'];
const GABLE_ROOFS = ['#b5503d', '#4f6fa8', '#5c8a4a', '#7a4f3a', '#8a5aa0'];
const FLOOR = 13;
const GROUND = 16;
const facadeH = (floors: number) => GROUND + (floors - 1) * FLOOR + 3;

type Kind = 'road' | 'side' | 'block';
function kindAt(tx: number, ty: number): Kind {
  const lx = mod(tx, PX);
  const ly = mod(ty, PY);
  if (lx < 2 || ly < 2) return 'road';
  if (lx === 2 || lx === PX - 1 || ly === 2 || ly === PY - 1) return 'side';
  return 'block';
}

function frame(g: G, x: number, y: number, w: number, h: number, c: string) {
  rect(g, x, y, w, 1, c);
  rect(g, x, y + h - 1, w, 1, c);
  rect(g, x, y, 1, h, c);
  rect(g, x + w - 1, y, 1, h, c);
}

// ---------------------------------------------------------------- props

function tree(g: G, r: Rng, x: number, y: number, big = false) {
  const R = big ? rint(r, 9, 11) : rint(r, 6, 8);
  const [dk, md, lt] = pick(r, [
    ['#3b8337', '#54a444', '#7cc35c'],
    ['#2d7442', '#439553', '#6ab86a'],
    ['#5a8b2c', '#76a93b', '#9bca58'],
  ]);
  ellipse(g, x + 3, y, R, Math.ceil(R / 2.5), 'rgba(20,45,20,0.32)');
  rect(g, x - 1, y - 6, 3, 6, '#6b4a2f');
  rect(g, x - 1, y - 6, 1, 6, '#8a6440');
  const cy = y - 5 - R;
  disc(g, x, cy + 1, R, shade(dk, -0.25));
  disc(g, x, cy, R, dk);
  disc(g, x - 1, cy - 1, R - 2, md);
  disc(g, x - 2, cy - 3, Math.max(2, R - 5), lt);
  for (let i = 0; i < R; i++) {
    const a = r() * Math.PI * 2;
    const d = r() * (R - 2);
    rect(g, x + Math.cos(a) * d, cy + Math.sin(a) * d, 1, 1, i % 2 ? dk : lt);
  }
}

function bush(g: G, x: number, y: number) {
  ellipse(g, x + 1, y + 2, 4, 2, 'rgba(20,45,20,0.3)');
  disc(g, x, y, 3, '#3f8a3c');
  disc(g, x - 1, y - 1, 2, '#5aa84a');
  rect(g, x - 1, y - 2, 1, 1, '#86c865');
}

function flowers(g: G, r: Rng, x: number, y: number, w: number, h: number, n = 10) {
  for (let i = 0; i < n; i++) {
    const fx = x + rint(r, 0, w - 1);
    const fy = y + rint(r, 0, h - 1);
    rect(g, fx, fy + 1, 1, 1, C.grassD);
    rect(g, fx, fy, 1, 1, pick(r, ['#f25c78', '#ffd166', '#ffffff', '#c77dff', '#ff8c42']));
  }
}

function bench(g: G, x: number, y: number) {
  rect(g, x + 1, y + 4, 10, 1, C.shadow);
  rect(g, x, y, 10, 2, '#9b6a3f');
  rect(g, x, y + 2, 10, 1, '#6e4a2b');
  rect(g, x + 1, y + 3, 1, 1, '#3a3a40');
  rect(g, x + 8, y + 3, 1, 1, '#3a3a40');
}

function lamp(g: G, w: World, x: number, y: number) {
  x = mod(x, WW);
  y = mod(y, WH);
  rect(g, x - 1, y, 3, 1, C.shadow);
  rect(g, x - 1, y - 1, 3, 1, '#3d414d');
  rect(g, x, y - 12, 1, 12, '#4a4f5c');
  rect(g, x - 1, y - 13, 3, 2, '#3d414d');
  rect(g, x, y - 12, 1, 1, '#fff3c4');
  w.lamps.push({ x, y: y - 12 });
}

function paving(g: G, x: number, y: number, w: number, h: number) {
  rect(g, x, y, w, h, C.pave);
  for (let yy = y + 5; yy < y + h; yy += 6) rect(g, x, yy, w, 1, C.paveD);
}

// ------------------------------------------------------------ buildings

interface Bld {
  x: number;
  y: number;
  w: number;
  h: number;
  floors: number;
  wall: string;
  roof: string;
  gable: boolean;
  shop: boolean;
  glass: boolean;
}

function windowPane(g: G, x: number, y: number, w: number, h: number, frameC: string) {
  rect(g, x, y, w, h, frameC);
  rect(g, x + 1, y + 1, w - 2, h - 2, '#80b1d5');
  rect(g, x + 1, y + h - 3, w - 2, 2, '#5f8fb8');
  rect(g, x + 1, y + 1, 1, 2, '#d4ebf8');
  if (w > 7) rect(g, x + Math.floor(w / 2), y + 1, 1, h - 2, frameC);
}

function roofDetails(g: G, r: Rng, x: number, y: number, w: number, h: number, wall: string) {
  if (w < 14 || h < 12) return;
  const placed: number[][] = [];
  const place = (iw: number, ih: number) => {
    if (iw > w || ih > h) return null;
    for (let a = 0; a < 14; a++) {
      const px = x + rint(r, 0, w - iw);
      const py = y + rint(r, 0, h - ih);
      if (placed.every(([qx, qy, qw, qh]) => px + iw + 3 < qx || qx + qw + 3 < px || py + ih + 3 < qy || qy + qh + 3 < py)) {
        placed.push([px, py, iw, ih]);
        return [px, py];
      }
    }
    return null;
  };
  const count = rint(r, 1, 2 + Math.floor((w * h) / 1600));
  for (let i = 0; i < count; i++) {
    const type = pick(r, ['ac', 'ac', 'tank', 'solar', 'vent', 'hut'] as const);
    if (type === 'ac') {
      const p = place(9, 7);
      if (!p) continue;
      const [px, py] = p;
      rect(g, px + 1, py + 1, 9, 7, C.shadow);
      rect(g, px, py, 9, 7, '#c3c7cf');
      rect(g, px, py, 9, 2, '#e2e5ea');
      disc(g, px + 4, py + 4, 2, '#6b707a');
      rect(g, px + 4, py + 4, 1, 1, '#a9aeb8');
    } else if (type === 'tank') {
      // black rooftop water tank — a fixture on nearly every Indian rooftop
      const p = place(10, 10);
      if (!p) continue;
      const [px, py] = p;
      disc(g, px + 6, py + 6, 4, C.shadow);
      disc(g, px + 5, py + 5, 4, '#2a2c31');
      disc(g, px + 4, py + 4, 2, '#474a52');
    } else if (type === 'solar') {
      const p = place(20, 11);
      if (!p) continue;
      const [px, py] = p;
      rect(g, px + 1, py + 1, 20, 11, C.shadow);
      rect(g, px, py, 20, 11, '#8c96a6');
      rect(g, px + 1, py + 1, 18, 9, '#2f4a7a');
      for (let cx = px + 5; cx < px + 19; cx += 5) rect(g, cx, py + 1, 1, 9, '#4f6fa6');
      rect(g, px + 1, py + 5, 18, 1, '#4f6fa6');
      rect(g, px + 1, py + 1, 18, 1, '#6d8ec4');
    } else if (type === 'vent') {
      const p = place(4, 4);
      if (!p) continue;
      const [px, py] = p;
      rect(g, px + 1, py + 1, 4, 4, C.shadow);
      rect(g, px, py, 4, 4, '#9aa0aa');
      rect(g, px, py, 4, 1, '#c7ccd4');
    } else {
      const p = place(16, 13);
      if (!p) continue;
      const [px, py] = p;
      rect(g, px + 16, py + 2, 2, 11, C.shadow);
      rect(g, px, py, 16, 7, shade(wall, -0.05));
      rect(g, px, py + 7, 16, 6, shade(wall, -0.2));
      rect(g, px + 6, py + 8, 4, 5, '#5a4636');
      frame(g, px, py, 16, 13, C.outline);
    }
  }
}

function building(g: G, r: Rng, b: Bld, w: World) {
  const { x, y, h } = b;
  const bw = b.w;
  const fh = facadeH(b.floors);
  const fy = y + h - fh;
  const rh = h - fh;
  const wall = b.wall;
  const frameC = shade(wall, -0.5);

  // cast shadow, sun from the top-left
  rect(g, x + bw, y + 5, 7, h - 2, C.shadow);
  rect(g, x + 4, y + h, bw + 3, 3, C.shadow);

  // facade
  rect(g, x, fy, bw, fh, wall);
  rect(g, x, fy, bw, 3, shade(wall, -0.3));
  rect(g, x, y + h - 3, bw, 3, shade(wall, -0.2));
  rect(g, x + 1, fy + 3, 1, fh - 6, shade(wall, 0.3));
  rect(g, x + bw - 2, fy + 3, 1, fh - 6, shade(wall, -0.12));

  const ww = b.glass ? 9 : 6;
  const wh = b.glass ? 9 : 8;
  const n = Math.max(1, Math.floor((bw - 4) / (ww + 5)));
  const gap = (bw - n * ww) / (n + 1);
  for (let f = 0; f < b.floors - 1; f++) {
    const wy = fy + 5 + f * FLOOR;
    for (let i = 0; i < n; i++) {
      const wx = Math.round(x + gap + i * (ww + gap));
      windowPane(g, wx, wy, ww, wh, frameC);
      rect(g, wx, wy + wh, ww, 1, shade(wall, 0.35));
      w.windows.push({ x: wx + 1, y: wy + 1, w: ww - 2, h: wh - 2, on: r() < 0.55 });
    }
  }

  // ground floor
  const gy = y + h - 16;
  const dx = Math.round(x + bw / 2 - 5);
  if (b.shop) {
    rect(g, x + 3, gy + 1, bw - 6, 12, frameC);
    rect(g, x + 4, gy + 2, bw - 8, 10, '#8cc0e0');
    rect(g, x + 4, gy + 2, bw - 8, 1, '#cfe8f7');
    for (let sx = x + 8; sx < x + bw - 8; sx += 11) rect(g, sx, gy + 4, 1, 5, '#b9dcef');
    w.windows.push({ x: x + 4, y: gy + 2, w: bw - 8, h: 10, on: true });
    const ac = pick(r, ['#d8453e', '#3e7fd8', '#3aa37a', '#e58a2e']);
    for (let ax = x + 1; ax < x + bw - 1; ax += 4) {
      const aw = Math.min(2, x + bw - 1 - ax);
      rect(g, ax, gy - 3, aw, 4, ac);
      rect(g, ax + 2, gy - 3, Math.min(2, x + bw - 1 - ax - 2), 4, '#f4f1ea');
      rect(g, ax, gy + 1, aw, 1, ac);
    }
    rect(g, x + 1, gy - 4, bw - 2, 1, shade(ac, -0.35));
  } else if (bw > 40) {
    for (const sx of [x + 5, x + bw - 13]) {
      if (Math.abs(sx + 4 - (dx + 5)) > 10) {
        windowPane(g, sx, gy + 2, 8, 8, frameC);
        w.windows.push({ x: sx + 1, y: gy + 3, w: 6, h: 6, on: r() < 0.5 });
      }
    }
  }
  rect(g, dx - 1, gy, 12, 13, frameC);
  rect(g, dx, gy + 1, 4, 12, '#6f9fc4');
  rect(g, dx + 5, gy + 1, 4, 12, '#6f9fc4');
  rect(g, dx, gy + 1, 1, 3, '#c7e2f3');
  rect(g, dx + 3, gy + 7, 1, 1, '#e8e8e8');
  rect(g, dx + 5, gy + 7, 1, 1, '#e8e8e8');
  rect(g, dx - 2, y + h - 1, 14, 1, shade(wall, -0.35));

  // roof
  if (b.gable) {
    const mid = y + Math.floor(rh / 2);
    rect(g, x, y, bw, mid - y, shade(b.roof, 0.15));
    rect(g, x, mid, bw, y + rh - mid, b.roof);
    let row = 0;
    for (let yy = y + 3; yy < y + rh - 2; yy += 3, row++) {
      const c = shade(b.roof, yy < mid ? -0.08 : -0.25);
      rect(g, x, yy, bw, 1, c);
      for (let xx = x + (row % 2 ? 2 : 0); xx < x + bw; xx += 5) rect(g, xx, yy - 2, 1, 2, c);
    }
    rect(g, x, mid - 1, bw, 2, shade(b.roof, 0.4));
    rect(g, x, y + rh - 2, bw, 2, shade(b.roof, -0.45));
    const chx = x + rint(r, 5, Math.max(6, bw - 11));
    rect(g, chx + 5, y + 4, 2, 7, C.shadow);
    rect(g, chx, y + 2, 5, 8, '#9d5a44');
    rect(g, chx, y + 2, 5, 2, '#c07a5e');
  } else {
    rect(g, x, y, bw, rh, shade(b.roof, 0.32));
    rect(g, x + 3, y + 3, bw - 6, rh - 6, b.roof);
    rect(g, x + 3, y + 3, bw - 6, 2, shade(b.roof, -0.25));
    rect(g, x + 3, y + 3, 2, rh - 6, shade(b.roof, -0.15));
    rect(g, x, y + rh - 1, bw, 1, shade(b.roof, 0.05));
    roofDetails(g, r, x + 6, y + 6, bw - 11, rh - 11, wall);
  }

  frame(g, x - 1, y - 1, bw + 2, h + 2, C.outline);
  rect(g, x, fy - 1, bw, 1, C.outline);
}

// --------------------------------------------------------------- blocks

type BlockFn = (g: G, r: Rng, x: number, y: number, w: number, h: number, world: World) => void;

const miniPark: BlockFn = (g, r, x, y, w, h) => {
  flowers(g, r, x + 4, y + 4, w - 8, h - 8, Math.floor((w * h) / 400));
  const cx = x + w / 2;
  rect(g, cx - 4, y + h / 2, 8, h / 2, C.pathD);
  rect(g, cx - 3, y + h / 2, 6, h / 2, C.path);
  const pts: Pt[] = [];
  for (let i = 0; i < 120 && pts.length < (w * h) / 650; i++) {
    const p = { x: x + rint(r, 8, w - 8), y: y + rint(r, 26, h - 4) };
    if (Math.abs(p.x - cx) < 12 && p.y > y + h / 2 - 4) continue;
    if (pts.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > 16)) pts.push(p);
  }
  pts.sort((a, b) => a.y - b.y).forEach((p) => tree(g, r, p.x, p.y, r() < 0.25));
  if (w > 50) bench(g, cx + 6, y + h - 26);
};

const lot: BlockFn = (g, r, x, y, w, h, world) => {
  if (w < 56 || r() < 0.12) return miniPark(g, r, x, y, w, h, world);
  const small = w < 96;
  const gable = small && r() < 0.65;
  const floors = gable ? rint(r, 1, 2) : rint(r, 2, 5);
  const glass = !gable && floors >= 3 && r() < 0.35;
  const bottom = y + h - rint(r, 24, 30);
  const top = Math.max(y + 10, bottom - facadeH(floors) - rint(r, 40, 80));
  const bx = x + rint(r, 4, 8);
  const bwid = x + w - rint(r, 6, 10) - bx;
  const b: Bld = {
    x: bx,
    y: top,
    w: bwid,
    h: bottom - top,
    floors,
    gable,
    glass,
    shop: !gable && r() < 0.5,
    wall: glass ? pick(r, GLASS_WALLS) : pick(r, WALLS),
    roof: gable ? pick(r, GABLE_ROOFS) : pick(r, FLAT_ROOFS),
  };

  // back garden: rows of trees behind the building
  if (top - y > 28) {
    flowers(g, r, x + 4, y + 4, w - 8, top - y - 8, Math.floor(w / 6));
    for (let ty = y + 26; ty <= top - 1; ty += 22) {
      for (let tx = x + rint(r, 8, 14); tx < x + w - 8; tx += rint(r, 15, 22)) if (r() < 0.85) tree(g, r, tx, ty + rint(r, -2, 2));
    }
  }
  const doorX = Math.round(bx + bwid / 2 - 5);
  paving(g, doorX - 2, bottom, 14, y + h - bottom);
  building(g, r, b, world);
  for (let px = bx + 3; px < bx + bwid - 3; px += 7) {
    if (Math.abs(px - (doorX + 5)) > 11 && r() < 0.75) bush(g, px, bottom + 5);
  }
  if (r() < 0.7 && doorX - x > 26) tree(g, r, x + rint(r, 8, 14), y + h - 4);
  if (r() < 0.7 && x + w - doorX > 36) tree(g, r, x + w - rint(r, 8, 14), y + h - 4);
};

const cityBlock: BlockFn = (g, r, x, y, w, h, world) => {
  let cx = x + 2;
  const end = x + w - 2;
  while (end - cx >= 40) {
    let lw = rint(r, 72, 128);
    if (end - cx - lw < 56) lw = end - cx;
    lot(g, r, cx, y, lw, h, world);
    cx += lw;
  }
};

const parkBlock: BlockFn = (g, r, x, y, w, h, world) => {
  const cx = x + w / 2;
  const cy = y + h / 2;
  rect(g, x, cy - 6, w, 12, C.pathD);
  rect(g, x, cy - 5, w, 10, C.path);
  rect(g, cx - 6, y, 12, h, C.pathD);
  rect(g, cx - 5, y, 10, h, C.path);
  disc(g, cx, cy, 30, C.pathD);
  disc(g, cx, cy, 29, C.path);
  disc(g, cx + 1, cy + 2, 15, C.shadow);
  disc(g, cx, cy, 15, '#8f8a80');
  disc(g, cx, cy, 14, '#c2bbad');
  disc(g, cx, cy, 11, C.water);
  disc(g, cx - 3, cy - 3, 4, '#77c1e3');
  disc(g, cx, cy, 2, '#dcd6c8');
  world.fountains.push({ x: cx, y: cy });

  for (const [fx, fy] of [
    [x + 14, y + 12],
    [x + w - 54, y + 12],
    [x + 14, y + h - 30],
    [x + w - 54, y + h - 30],
  ]) {
    rect(g, fx, fy, 40, 16, '#7b5a3a');
    rect(g, fx + 1, fy + 1, 38, 14, '#5d8a3c');
    flowers(g, r, fx + 2, fy + 2, 36, 12, 24);
  }

  const pts: Pt[] = [];
  for (let i = 0; i < 90; i++) {
    const p = { x: x + rint(r, 8, w - 8), y: y + rint(r, 22, h - 4) };
    const onHPath = p.y > cy - 6 && p.y - 22 < cy + 6;
    const onVPath = Math.abs(p.x - cx) < 16;
    const nearPlaza = Math.hypot(p.x - cx, p.y - 10 - cy) < 44;
    if (onHPath || onVPath || nearPlaza) continue;
    if (pts.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > 17)) pts.push(p);
  }
  pts.sort((a, b) => a.y - b.y).forEach((p) => tree(g, r, p.x, p.y, r() < 0.3));
  bench(g, cx - 48, cy - 10);
  bench(g, cx + 38, cy - 10);
  bench(g, cx - 18, cy + 32);
};

const courtBlock: BlockFn = (g, r, x, y, w, h) => {
  const cw = 184;
  const ch = 112;
  const cx = x + Math.floor((w - cw) / 2);
  const cy = y + Math.floor((h - ch) / 2) + 6;
  rect(g, cx - 9, cy - 9, cw + 18, ch + 18, '#3c3f4a');
  rect(g, cx - 8, cy - 8, cw + 16, ch + 16, '#3f8f62');
  rect(g, cx, cy, cw, ch, '#3b78b5');
  frame(g, cx, cy, cw, ch, '#f2f2ee');
  rect(g, cx + cw / 2, cy, 1, ch, '#f2f2ee');
  disc(g, cx + cw / 2, cy + ch / 2, 14, '#f2f2ee');
  disc(g, cx + cw / 2, cy + ch / 2, 13, '#c8643c');
  for (const kx of [cx, cx + cw - 34]) {
    rect(g, kx + (kx === cx ? 1 : 0), cy + ch / 2 - 18, 33, 36, '#c8643c');
    frame(g, kx, cy + ch / 2 - 18, 34, 36, '#f2f2ee');
  }
  rect(g, cx - 3, cy + ch / 2 - 5, 3, 10, '#e6e6e6');
  rect(g, cx + cw, cy + ch / 2 - 5, 3, 10, '#e6e6e6');
  rect(g, cx + 1, cy + ch / 2 - 1, 3, 2, '#ef6a2a');
  rect(g, cx + cw - 4, cy + ch / 2 - 1, 3, 2, '#ef6a2a');
  for (let i = 0; i < 5; i++) bench(g, cx + 20 + i * 32, cy - 22);
  tree(g, r, x + 12, y + 30);
  tree(g, r, x + w - 12, y + 30);
  tree(g, r, x + 12, y + h - 4);
  tree(g, r, x + w - 12, y + h - 4);
};

const parkingBlock: BlockFn = (g, r, x, y, w, h) => {
  const lx = x + 10;
  const ly = y + 12;
  const lw = w - 20;
  const lh = h - 20;
  rect(g, lx - 1, ly - 1, lw + 2, lh + 2, C.curb);
  rect(g, lx, ly, lw, lh, C.asphalt);
  for (let i = 0; i < 200; i++) rect(g, lx + rint(r, 0, lw - 1), ly + rint(r, 0, lh - 1), 1, 1, r() < 0.5 ? C.asphaltD : C.asphaltL);
  rect(g, x + w / 2 - 14, ly + lh, 28, y + h - ly - lh, C.asphalt); // driveway to the street
  const rows: [number, 'n' | 's'][] = [
    [ly + 3, 's'],
    [ly + lh - 31, 'n'],
  ];
  for (const [ry, facing] of rows) {
    for (let sx = lx + 6; sx + 16 <= lx + lw - 6; sx += 16) {
      rect(g, sx, ry, 1, 28, C.line);
      rect(g, sx + 16, ry, 1, 28, C.line);
      if (r() < 0.65) {
        const img = makeVehicle(r, pick(r, ['car', 'car', 'car', 'van', 'taxi'] as const)).frames[facing];
        const px = sx + 9 - Math.floor(img.width / 2);
        const py = ry + 14 - Math.floor(img.height / 2);
        rect(g, px + 1, py + 2, img.width, img.height, C.shadow);
        g.drawImage(img, px, py);
      }
    }
  }
  for (let dx = lx + 10; dx < lx + lw - 10; dx += 14) rect(g, dx, ly + lh / 2, 7, 1, C.line);
};

const campusBlock: BlockFn = (g, r, x, y, w, h, world) => {
  const bottom = y + h - 44;
  paving(g, x + 6, bottom, w - 12, y + h - bottom);
  const mainStart = world.windows.length;
  building(g, r, { x: x + 16, y: y + 12, w: w - 32, h: bottom - y - 12, floors: 4, wall: '#ecdcc0', roof: '#b25a42', gable: false, shop: false, glass: false }, world);

  // central tower; hide the main-block windows it covers
  const tw = 56;
  const tx = Math.round(x + w / 2 - tw / 2);
  world.windows = world.windows.filter((wn, i) => i < mainStart || wn.x + wn.w < tx - 1 || wn.x > tx + tw + 1);
  building(g, r, { x: tx, y: y + 3, w: tw, h: bottom - y - 3, floors: 6, wall: '#f5ead3', roof: '#9b4a35', gable: false, shop: false, glass: false }, world);

  // clock face at the top of the tower
  const clockY = bottom - facadeH(6) + 10;
  disc(g, tx + tw / 2, clockY, 6, C.outline);
  disc(g, tx + tw / 2, clockY, 5, '#fbf6e8');
  rect(g, tx + tw / 2, clockY - 4, 1, 4, C.outline);
  rect(g, tx + tw / 2, clockY, 3, 1, C.outline);
  world.windows = world.windows.filter((wn) => Math.hypot(wn.x + wn.w / 2 - (tx + tw / 2), wn.y + wn.h / 2 - clockY) > 9);

  // university name board over the entrance
  const sy = bottom - 30;
  rect(g, tx + tw / 2 - 12, sy, 24, 9, C.outline);
  rect(g, tx + tw / 2 - 11, sy + 1, 22, 7, '#1f5b43');
  pixelText(g, 'GEHU', tx + tw / 2 - 7, sy + 2, '#f6e7a8');

  // flagpole + plaza greenery
  const fx = x + w / 2 - 50;
  rect(g, fx + 1, bottom + 26, 3, 1, C.shadow);
  rect(g, fx, bottom + 2, 1, 24, '#9aa0aa');
  rect(g, fx + 1, bottom + 2, 9, 2, '#ff9933');
  rect(g, fx + 1, bottom + 4, 9, 2, '#ffffff');
  rect(g, fx + 5, bottom + 4, 1, 2, '#1f3fa0');
  rect(g, fx + 1, bottom + 6, 9, 2, '#138808');
  for (const bx of [x + 22, x + w - 62]) {
    rect(g, bx, bottom + 14, 40, 14, '#7b5a3a');
    rect(g, bx + 1, bottom + 15, 38, 12, '#5d8a3c');
    flowers(g, r, bx + 2, bottom + 16, 36, 10, 22);
  }
  tree(g, r, x + 10, y + h - 4, true);
  tree(g, r, x + w - 10, y + h - 4, true);
  for (let i = 0; i < 6; i++) bush(g, x + w / 2 + 16 + i * 7, bottom + 34);
};

// ------------------------------------------------------------ assembly

export function buildWorld(seed = 11): World {
  const r = rng(seed);
  const [ground, g] = makeCanvas(WW, WH);
  const world: World = { ground, windows: [], lamps: [], fountains: [], signals: [], start: { x: 0, y: 0 } };

  // ground tiles
  for (let ty = 0; ty < WH / T; ty++) {
    for (let tx = 0; tx < WW / T; tx++) {
      const x = tx * T;
      const y = ty * T;
      const k = kindAt(tx, ty);
      if (k === 'road') {
        rect(g, x, y, T, T, C.asphalt);
        for (let i = 0; i < 4; i++) rect(g, x + rint(r, 0, 15), y + rint(r, 0, 15), 1, 1, i % 2 ? C.asphaltD : C.asphaltL);
      } else if (k === 'side') {
        rect(g, x, y, T, T, C.side);
        rect(g, x, y + 7, T, 1, C.sideD);
        rect(g, x, y + 15, T, 1, C.sideD);
        rect(g, x + 7, y, 1, 7, C.sideD);
        rect(g, x + 15, y + 8, 1, 7, C.sideD);
        if (kindAt(tx - 1, ty) === 'road') rect(g, x, y, 1, T, C.curb);
        if (kindAt(tx + 1, ty) === 'road') rect(g, x + 15, y, 1, T, C.curb);
        if (kindAt(tx, ty - 1) === 'road') rect(g, x, y, T, 1, C.curb);
        if (kindAt(tx, ty + 1) === 'road') rect(g, x, y + 15, T, 1, C.curb);
      } else {
        rect(g, x, y, T, T, C.grass);
        for (let i = 0; i < 5; i++) {
          const gx = x + rint(r, 0, 14);
          const gy = y + rint(r, 1, 15);
          rect(g, gx, gy, 1, 1, C.grassD);
          if (i < 2) rect(g, gx + 1, gy - 1, 1, 1, C.grassL);
        }
      }
    }
  }

  // road markings
  for (let l = 0; l < NY; l++) {
    for (let k = 0; k < NX; k++) {
      const X0 = k * PXW;
      const Y0 = l * PYW;
      // horizontal segment east of this intersection
      const hs = X0 + 3 * T;
      const he = X0 + PXW - T;
      rect(g, hs, Y0 + 1, he - hs, 1, C.edge);
      rect(g, hs, Y0 + 30, he - hs, 1, C.edge);
      for (let x = hs + 4; x < he - 8; x += 13) rect(g, x, Y0 + 15, 7, 1, C.line);
      // vertical segment south of this intersection
      const vs = Y0 + 3 * T;
      const ve = Y0 + PYW - T;
      rect(g, X0 + 1, vs, 1, ve - vs, C.edge);
      rect(g, X0 + 30, vs, 1, ve - vs, C.edge);
      for (let y = vs + 4; y < ve - 8; y += 13) rect(g, X0 + 15, y, 1, 7, C.line);

      // zebra crossings on all four approaches
      for (const cx of [X0 + 2 * T, mod(X0 - T, WW)]) {
        for (let yy = Y0 + 2; yy < Y0 + 30; yy += 4) rect(g, cx + 2, yy, 12, 2, C.line);
      }
      for (const cy of [Y0 + 2 * T, mod(Y0 - T, WH)]) {
        for (let xx = X0 + 2; xx < X0 + 30; xx += 4) rect(g, xx, cy + 2, 2, 12, C.line);
      }
      // stop lines (left-hand traffic)
      rect(g, mod(X0 - T - 2, WW), Y0 + 1, 1, 14, C.line);
      rect(g, X0 + 3 * T + 1, Y0 + 17, 1, 14, C.line);
      rect(g, X0 + 1, Y0 + 3 * T + 1, 14, 1, C.line);
      rect(g, X0 + 17, mod(Y0 - T - 2, WH), 14, 1, C.line);

      world.signals.push(
        { x: mod(X0 - 3, WW), y: mod(Y0 - 2, WH), axis: 'h' },
        { x: X0 + 2 * T + 2, y: mod(Y0 - 2, WH), axis: 'v' },
        { x: mod(X0 - 3, WW), y: Y0 + 2 * T + 13, axis: 'v' },
        { x: X0 + 2 * T + 2, y: Y0 + 2 * T + 13, axis: 'h' },
      );
    }
  }

  // blocks — campus is pinned so the camera can open on it
  const others: BlockFn[] = [parkBlock, parkBlock, courtBlock, parkingBlock, ...Array<BlockFn>(7).fill(cityBlock)];
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  for (let bj = 0; bj < NY; bj++) {
    for (let bi = 0; bi < NX; bi++) {
      const x = (bi * PX + 3) * T;
      const y = (bj * PY + 3) * T;
      const isCampus = bi === 1 && bj === 1;
      (isCampus ? campusBlock : others.pop()!)(g, r, x, y, (PX - 4) * T, (PY - 4) * T, world);
      if (isCampus) world.start = { x: x + (PX - 4) * T * 0.5, y: y + (PY - 4) * T * 0.62 };
    }
  }

  // street furniture on the sidewalks
  for (let bj = 0; bj < NY; bj++) {
    for (let bi = 0; bi < NX; bi++) {
      const X0 = bi * PXW;
      const Y0 = bj * PYW;
      for (const lx of [6, 12, 18]) {
        lamp(g, world, X0 + lx * T + 8, Y0 + 2 * T + 14);
        lamp(g, world, X0 + lx * T + 8, Y0 + (PY - 1) * T + 3);
      }
      for (const ly of [7, 12]) {
        lamp(g, world, X0 + 2 * T + 13, Y0 + ly * T + 8);
        lamp(g, world, X0 + (PX - 1) * T + 2, Y0 + ly * T + 8);
      }
      const hx = X0 + rint(r, 4, PX - 4) * T + 2;
      rect(g, hx, Y0 + 2 * T + 9, 3, 4, '#d23b30');
      rect(g, hx, Y0 + 2 * T + 9, 3, 1, '#f06a5c');
    }
  }

  return world;
}
