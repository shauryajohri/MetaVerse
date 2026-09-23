import { type G, type Rng, ellipse, makeCanvas, pick, rect, shade } from './gfx';

const OUTLINE = '#262833';
const GLASS = '#3b5877';
const GLASS_HI = '#8fb6d8';

export type Facing = 'e' | 'w' | 'n' | 's';
export type VehicleKind = 'car' | 'taxi' | 'van' | 'bus' | 'auto';

export interface VehicleSprite {
  kind: VehicleKind;
  len: number; // along direction of travel
  wid: number;
  frames: Record<Facing, HTMLCanvasElement>;
}

const CAR_COLORS = ['#d8453e', '#3e7fd8', '#f1f1ee', '#2d2f36', '#9aa3ad', '#3aa37a', '#e58a2e', '#7b4bb3', '#c7b299'];

/** Draws a vehicle facing east into a fresh canvas. */
function drawEast(kind: VehicleKind, color: string): HTMLCanvasElement {
  const L = { car: 22, taxi: 22, van: 26, bus: 42, auto: 16 }[kind];
  const W = { car: 12, taxi: 12, van: 13, bus: 15, auto: 10 }[kind];
  const [c, g] = makeCanvas(L, W);

  const wheel = (x: number) => {
    rect(g, x, 0, 5, 2, '#15161b');
    rect(g, x, W - 2, 5, 2, '#15161b');
  };

  if (kind === 'auto') {
    // Auto-rickshaw: green body, yellow canvas roof, single front wheel.
    rect(g, 2, 0, 4, 2, '#15161b');
    rect(g, 2, W - 2, 4, 2, '#15161b');
    rect(g, L - 4, 4, 3, 2, '#15161b');
    rect(g, 1, 1, L - 3, W - 2, OUTLINE);
    rect(g, 2, 2, L - 5, W - 4, '#3f9a4a');
    rect(g, 1, 1, 10, W - 2, OUTLINE);
    rect(g, 2, 2, 8, W - 4, '#f3c93b');
    rect(g, 2, 2, 8, 1, '#fbe38a');
    rect(g, 11, 3, 2, W - 6, GLASS);
    rect(g, L - 3, W / 2 - 1, 1, 2, '#fff6c8');
    return c;
  }

  wheel(3);
  wheel(L - 8);
  if (kind === 'bus') wheel(L - 15);

  // body with clipped corners
  rect(g, 1, 1, L - 2, W - 2, OUTLINE);
  rect(g, 0, 2, L, W - 4, OUTLINE);
  rect(g, 1, 2, L - 2, W - 4, color);
  rect(g, 2, 1, L - 4, 1, shade(color, 0.3)); // top-edge highlight
  rect(g, 2, W - 2, L - 4, 1, shade(color, -0.3)); // bottom-edge shade

  if (kind === 'bus') {
    rect(g, 3, 3, L - 8, W - 6, shade(color, 0.55)); // pale roof
    for (let x = 6; x < L - 10; x += 9) {
      rect(g, x, 5, 6, W - 10, '#c9ccd3'); // rooftop AC units
      rect(g, x + 1, 6, 4, 1, '#8a8e97');
    }
    rect(g, L - 4, 3, 2, W - 6, GLASS);
    rect(g, L - 4, 3, 1, 2, GLASS_HI);
  } else {
    const ws = kind === 'van' ? L - 8 : L - 9;
    rect(g, ws, 2, 3, W - 4, GLASS); // windscreen
    rect(g, ws, 2, 1, 2, GLASS_HI);
    rect(g, 3, 3, 2, W - 6, GLASS); // rear window
    rect(g, 5, 2, ws - 5, W - 4, shade(color, 0.12)); // roof
    rect(g, 5, 2, ws - 5, 1, shade(color, 0.35));
    if (kind === 'taxi') {
      rect(g, 9, W / 2 - 2, 4, 4, OUTLINE);
      rect(g, 10, W / 2 - 1, 2, 2, '#fff6c8');
    }
  }
  rect(g, L - 1, 2, 1, 2, '#fff6c8'); // headlights
  rect(g, L - 1, W - 4, 1, 2, '#fff6c8');
  rect(g, 0, 2, 1, 2, '#d33a2c'); // tail lights
  rect(g, 0, W - 4, 1, 2, '#d33a2c');
  return c;
}

function transform(src: HTMLCanvasElement, facing: Facing) {
  const rot = facing === 'n' || facing === 's';
  const [c, g] = makeCanvas(rot ? src.height : src.width, rot ? src.width : src.height);
  g.save();
  if (facing === 'w') {
    g.translate(src.width, 0);
    g.scale(-1, 1);
  } else if (facing === 's') {
    g.translate(src.height, 0);
    g.rotate(Math.PI / 2);
  } else if (facing === 'n') {
    g.translate(0, src.width);
    g.rotate(-Math.PI / 2);
  }
  g.drawImage(src, 0, 0);
  g.restore();
  return c;
}

export function makeVehicle(r: Rng, kind?: VehicleKind): VehicleSprite {
  kind ??= pick(r, ['car', 'car', 'car', 'car', 'taxi', 'van', 'bus', 'auto', 'auto'] as const);
  const color = kind === 'taxi' ? '#f5c542' : kind === 'bus' ? pick(r, ['#d8453e', '#3e7fd8', '#e58a2e']) : pick(r, CAR_COLORS);
  const east = drawEast(kind, color);
  return {
    kind,
    len: east.width,
    wid: east.height,
    frames: { e: east, w: transform(east, 'w'), n: transform(east, 'n'), s: transform(east, 's') },
  };
}

// ---- pedestrians (drawn live each frame; they're only ~70 pixels) ----

const SKIN = ['#f1c7a3', '#e0ac85', '#c68e64', '#9c6a44', '#7a4f33'];
const HAIR = ['#1d1510', '#3a2618', '#111111', '#6b3f22', '#b8864f', '#2b2b2b'];
const SHIRT = ['#e2574c', '#3f8ed8', '#f2c14e', '#5bb577', '#f1f1ee', '#8a5cc2', '#ef8a3a', '#2f3a56', '#d95d9b'];
const PANTS = ['#2f3a56', '#3b3b40', '#5a4a3a', '#6b7fa8', '#1f2026'];
const BAG = ['#2b2d3a', '#b8413a', '#2f6fb0', '#3f7a4a'];

export interface PedLook {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  bag: string | null;
}

export const makePedLook = (r: Rng): PedLook => ({
  skin: pick(r, SKIN),
  hair: pick(r, HAIR),
  shirt: pick(r, SHIRT),
  pants: pick(r, PANTS),
  bag: r() < 0.45 ? pick(r, BAG) : null,
});

/** (x, y) is the point between the feet. */
export function drawPed(g: G, x: number, y: number, p: PedLook, facing: Facing, step: number) {
  x = Math.round(x);
  y = Math.round(y);
  ellipse(g, x, y, 3, 1, 'rgba(20,25,35,0.28)');

  const a = step === 1 ? 1 : 0;
  const b = step === 3 ? 1 : 0;
  // legs
  rect(g, x - 2, y - 3, 2, 3 - a, p.pants);
  rect(g, x, y - 3, 2, 3 - b, p.pants);
  // body + arms
  rect(g, x - 3, y - 7, 6, 4, p.shirt);
  rect(g, x - 3, y - 4, 6, 1, shade(p.shirt, -0.2));
  if (facing === 'e' || facing === 'w') {
    rect(g, x - 1 + (step === 1 ? 1 : step === 3 ? -1 : 0), y - 6, 1, 3, p.skin);
  } else {
    rect(g, x - 4, y - 7 + a, 1, 3, p.skin);
    rect(g, x + 3, y - 7 + b, 1, 3, p.skin);
  }
  // head
  rect(g, x - 2, y - 11, 4, 4, p.skin);
  rect(g, x - 2, y - 12, 4, 2, p.hair);
  if (facing === 'n') rect(g, x - 2, y - 11, 4, 3, p.hair);
  else if (facing === 's') {
    rect(g, x - 2, y - 11, 1, 2, p.hair);
    rect(g, x + 1, y - 11, 1, 2, p.hair);
    rect(g, x - 1, y - 9, 1, 1, '#1a1a22');
    rect(g, x + 1, y - 9, 1, 1, '#1a1a22');
  } else {
    const back = facing === 'e' ? x - 2 : x + 1;
    const front = facing === 'e' ? x + 1 : x - 2;
    rect(g, back, y - 11, 1, 3, p.hair);
    rect(g, front, y - 9, 1, 1, '#1a1a22');
  }
  // backpack is visible from behind or the side
  if (p.bag) {
    if (facing === 'n') rect(g, x - 2, y - 7, 4, 3, p.bag);
    else if (facing === 'e') rect(g, x - 4, y - 7, 2, 3, p.bag);
    else if (facing === 'w') rect(g, x + 2, y - 7, 2, 3, p.bag);
  }
}
