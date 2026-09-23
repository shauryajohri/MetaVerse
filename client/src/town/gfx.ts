// Tiny pixel-art drawing helpers. Everything snaps to whole pixels so the
// low-res canvas stays crisp when CSS scales it up with `image-rendering: pixelated`.

export type G = CanvasRenderingContext2D;
export type Rng = () => number;

export const mod = (a: number, n: number) => ((a % n) + n) % n;

// mulberry32 — small seeded PRNG so the town layout is identical on every load.
export function rng(seed: number): Rng {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T,>(r: Rng, a: readonly T[]): T => a[Math.floor(r() * a.length)];
export const rint = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

/** Lighten (amt > 0) or darken (amt < 0) a #rrggbb colour. */
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

export function rect(g: G, x: number, y: number, w: number, h: number, c: string) {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function ellipse(g: G, cx: number, cy: number, rx: number, ry: number, c: string) {
  g.fillStyle = c;
  cx = Math.round(cx);
  cy = Math.round(cy);
  for (let dy = -ry; dy <= ry; dy++) {
    const dx = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / (ry + 0.5)) ** 2)));
    g.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1);
  }
}

export const disc = (g: G, cx: number, cy: number, r: number, c: string) => ellipse(g, cx, cy, r, r, c);

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, G] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  return [c, g];
}

// 3x5 glyphs for the few letters we paint on signs.
const GLYPHS: Record<string, string> = {
  G: '.##|#..|#.#|#.#|.##',
  E: '###|#..|##.|#..|###',
  H: '#.#|#.#|###|#.#|#.#',
  U: '#.#|#.#|#.#|#.#|###',
};

export function pixelText(g: G, text: string, x: number, y: number, c: string) {
  g.fillStyle = c;
  [...text].forEach((ch, i) => {
    GLYPHS[ch]?.split('|').forEach((row, dy) => {
      [...row].forEach((p, dx) => p === '#' && g.fillRect(x + i * 4 + dx, y + dy, 1, 1));
    });
  });
}
