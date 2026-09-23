// Live simulation on top of the static world: traffic obeying signals,
// pedestrians using zebra crossings, drifting cloud shadows and a day/night
// cycle that follows the real local clock (override with ?hour=21).

import { type G, type Rng, disc, makeCanvas, mod, rint, rng } from './gfx';
import { type Facing, type PedLook, type VehicleSprite, drawPed, makePedLook, makeVehicle } from './sprites';
import { NX, NY, PXW, PYW, T, WH, WW, buildWorld } from './world';

type Axis = 'h' | 'v';
type Light = 'g' | 'y' | 'r';

const CYCLE = 14; // seconds: 5 green, 1.2 amber, 0.8 all-red, per axis
const phase = (t: number, axis: Axis) => mod(axis === 'h' ? t : t - CYCLE / 2, CYCLE);
const signal = (t: number, axis: Axis): Light => {
  const q = phase(t, axis);
  return q < 5 ? 'g' : q < 6.2 ? 'y' : 'r';
};

export function townHour(): number {
  const q = new URLSearchParams(location.search).get('hour');
  if (q !== null && !Number.isNaN(Number(q))) return mod(Number(q), 24);
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

/** 0 at midday → 0.6 at night, with dusk/dawn ramps. */
function darkness(h: number) {
  const MAX = 0.68;
  if (h >= 7.5 && h <= 17.5) return 0;
  if (h > 17.5 && h < 19.5) return (MAX * (h - 17.5)) / 2;
  if (h > 5.5 && h < 7.5) return (MAX * (7.5 - h)) / 2;
  return MAX;
}
const warmth = (h: number) => Math.max(0, 1 - Math.abs(h - 18.2) / 1.4) + Math.max(0, 1 - Math.abs(h - 6.4) / 1.2);

interface Car {
  axis: Axis;
  lane: number;
  dir: 1 | -1;
  pos: number;
  v: number;
  vmax: number;
  spr: VehicleSprite;
  facing: Facing;
}

interface Ped {
  x: number;
  y: number;
  axis: Axis;
  dir: 1 | -1;
  speed: number;
  off: number;
  walked: number;
  waiting: boolean;
  look: PedLook;
}

const M = 48; // off-screen margin for wrapped drawing
const H_NODES = [2 * T + 8, PXW - T + 8]; // x (mod PXW) of vertical sidewalk centre lines
const V_NODES = [2 * T + 8, PYW - T + 8];

export class Town {
  private g: G;
  private world = buildWorld();
  private cars: Car[] = [];
  private lanes: Car[][] = [];
  private peds: Ped[] = [];
  private clouds: { img: HTMLCanvasElement; x: number; y: number }[] = [];
  private glow: HTMLCanvasElement;
  private camX: number;
  private camY: number;
  private cx = 0;
  private cy = 0;
  private vw = 0;
  private vh = 0;
  private t = 0;
  private raf = 0;
  private last = 0;
  private hour = 12;
  private hourCheck = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private still = false,
  ) {
    this.g = canvas.getContext('2d')!;
    const r = rng(2026);
    this.spawnCars(r);
    this.spawnPeds(r);
    this.spawnClouds(r);

    const [glow, gg] = makeCanvas(32, 32);
    const grad = gg.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,214,140,0.75)');
    grad.addColorStop(0.35, 'rgba(255,190,110,0.28)');
    grad.addColorStop(1, 'rgba(255,170,90,0)');
    gg.fillStyle = grad;
    gg.fillRect(0, 0, 32, 32);
    this.glow = glow;

    this.resize();
    // Open with the campus to the right of the login panel.
    this.camX = this.world.start.x - this.vw * 0.66;
    this.camY = this.world.start.y - this.vh * 0.55;
  }

  // ------------------------------------------------------------ setup

  private spawnCars(r: Rng) {
    const defs: { axis: Axis; lane: number; dir: 1 | -1 }[] = [];
    // Left-hand traffic: eastbound uses the north lane, northbound the west lane.
    for (let l = 0; l < NY; l++) defs.push({ axis: 'h', lane: l * PYW + 8, dir: 1 }, { axis: 'h', lane: l * PYW + 24, dir: -1 });
    for (let k = 0; k < NX; k++) defs.push({ axis: 'v', lane: k * PXW + 8, dir: -1 }, { axis: 'v', lane: k * PXW + 24, dir: 1 });

    for (const d of defs) {
      const L = d.axis === 'h' ? WW : WH;
      const n = d.axis === 'h' ? rint(r, 3, 4) : rint(r, 2, 3);
      const lane: Car[] = [];
      for (let i = 0; i < n; i++) {
        const spr = makeVehicle(r);
        const vmax = spr.kind === 'bus' ? 26 : spr.kind === 'auto' ? 30 : 34 + r() * 12;
        const facing: Facing = d.axis === 'h' ? (d.dir > 0 ? 'e' : 'w') : d.dir > 0 ? 's' : 'n';
        lane.push({ ...d, pos: ((i + r() * 0.4) * L) / n, v: vmax, vmax, spr, facing });
      }
      this.lanes.push(lane);
      this.cars.push(...lane);
    }
  }

  private spawnPeds(r: Rng) {
    for (let i = 0; i < 46; i++) {
      const axis: Axis = r() < 0.5 ? 'h' : 'v';
      let x: number;
      let y: number;
      if (axis === 'h') {
        y = rint(r, 0, NY - 1) * PYW + (r() < 0.5 ? 2 * T + 8 : PYW - T + 8);
        x = rint(r, 0, NX - 1) * PXW + rint(r, 3 * T, PXW - 2 * T);
      } else {
        x = rint(r, 0, NX - 1) * PXW + (r() < 0.5 ? 2 * T + 8 : PXW - T + 8);
        y = rint(r, 0, NY - 1) * PYW + rint(r, 3 * T, PYW - 2 * T);
      }
      this.peds.push({ x, y, axis, dir: r() < 0.5 ? 1 : -1, speed: 9 + r() * 7, off: rint(r, -3, 3), walked: r() * 16, waiting: false, look: makePedLook(r) });
    }
  }

  private spawnClouds(r: Rng) {
    for (let i = 0; i < 6; i++) {
      const [img, g] = makeCanvas(160, 90);
      for (let j = 0; j < 8; j++) disc(g, rint(r, 35, 125), rint(r, 30, 60), rint(r, 14, 28), '#0b1020');
      this.clouds.push({ img, x: r() * WW, y: r() * WH });
    }
  }

  resize() {
    // Integer upscale in *device* pixels so every art pixel is the same size.
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.max(2, Math.round((innerWidth * dpr) / 500));
    this.vw = Math.ceil((innerWidth * dpr) / scale);
    this.vh = Math.ceil((innerHeight * dpr) / scale);
    this.canvas.width = this.vw;
    this.canvas.height = this.vh;
    this.canvas.style.width = `${(this.vw * scale) / dpr}px`;
    this.canvas.style.height = `${(this.vh * scale) / dpr}px`;
    this.g.imageSmoothingEnabled = false;
  }

  start() {
    const loop = (now: number) => {
      const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0;
      this.last = now;
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  // ----------------------------------------------------------- update

  private update(dt: number) {
    this.t += dt;
    if (this.t - this.hourCheck > 5 || this.hourCheck === 0) {
      this.hour = townHour();
      this.hourCheck = this.t || 0.001;
    }
    if (!this.still) {
      this.camX += 7 * dt;
      this.camY += 2.5 * dt;
    }
    for (const lane of this.lanes) for (const c of lane) this.updateCar(c, lane, dt);
    for (const p of this.peds) this.updatePed(p, dt);
    for (const c of this.clouds) {
      c.x = mod(c.x + 5 * dt, WW);
      c.y = mod(c.y + 1.5 * dt, WH);
    }
    if (Math.random() < 0.05) {
      const w = this.world.windows[Math.floor(Math.random() * this.world.windows.length)];
      w.on = !w.on;
    }
  }

  private updateCar(c: Car, lane: Car[], dt: number) {
    const L = c.axis === 'h' ? WW : WH;
    const P = c.axis === 'h' ? PXW : PYW;
    const half = c.spr.len / 2;
    const front = c.pos + c.dir * half;
    // distance from our bumper to the next stop line
    const d = c.dir > 0 ? mod(-T - front, P) : mod(front - 3 * T, P);
    const light = signal(this.t, c.axis);

    let target = c.vmax;
    if (light !== 'g' && !(light === 'y' && d < 10) && d < 44) target = Math.min(target, Math.max(0, (d - 1) * 1.1));
    for (const o of lane) {
      if (o === c) continue;
      const gap = c.dir > 0 ? mod(o.pos - o.spr.len / 2 - front, L) : mod(front - (o.pos + o.spr.len / 2), L);
      target = Math.min(target, Math.max(0, (gap - 5) * 1.4));
    }
    c.v = target < c.v ? Math.max(target, c.v - 90 * dt) : Math.min(target, c.v + 22 * dt);
    c.pos = mod(c.pos + c.dir * c.v * dt, L);
  }

  private updatePed(p: Ped, dt: number) {
    const h = p.axis === 'h';
    const P = h ? PXW : PYW;
    const along = h ? p.x : p.y;
    const lm = mod(along, P);

    // Wait at the kerb unless our walk signal has just turned green.
    if (lm >= 2 * T) {
      const toRoad = p.dir > 0 ? mod(-along, P) : mod(along - 2 * T, P);
      const q = phase(this.t, p.axis);
      if (toRoad < 3 && !(q < 2.6)) {
        p.waiting = true;
        return;
      }
    }
    p.waiting = false;

    const step = p.dir * p.speed * dt;
    const next = lm + step;
    p.walked += Math.abs(step);
    for (const n of h ? H_NODES : V_NODES) {
      const crossed = p.dir > 0 ? lm < n && next >= n : lm > n && next <= n;
      if (crossed && Math.random() < 0.35) {
        const snapped = along - lm + n;
        if (h) p.x = snapped;
        else p.y = snapped;
        p.axis = h ? 'v' : 'h';
        p.dir = Math.random() < 0.5 ? 1 : -1;
        return;
      }
    }
    if (h) p.x = mod(p.x + step, WW);
    else p.y = mod(p.y + step, WH);
  }

  // ------------------------------------------------------------- draw

  private sx = (x: number) => mod(x - this.cx + M, WW) - M;
  private sy = (y: number) => mod(y - this.cy + M, WH) - M;
  private visible = (x: number, y: number) => x < this.vw + M && y < this.vh + M;

  private draw() {
    const g = this.g;
    this.cx = mod(Math.floor(this.camX), WW);
    this.cy = mod(Math.floor(this.camY), WH);

    for (const ox of [0, WW]) {
      for (const oy of [0, WH]) {
        const dx = ox - this.cx;
        const dy = oy - this.cy;
        if (dx < this.vw && dy < this.vh) g.drawImage(this.world.ground, dx, dy);
      }
    }

    this.drawFountains();

    for (const c of this.cars) {
      const img = c.spr.frames[c.facing];
      const x = Math.round(this.sx(c.axis === 'h' ? c.pos : c.lane) - img.width / 2);
      const y = Math.round(this.sy(c.axis === 'h' ? c.lane : c.pos) - img.height / 2);
      if (!this.visible(x, y)) continue;
      g.fillStyle = 'rgba(22,32,48,0.3)';
      g.fillRect(x + 1, y + 2, img.width, img.height);
      g.drawImage(img, x, y);
    }

    const peds = this.peds
      .map((p) => ({ p, x: this.sx(p.axis === 'h' ? p.x : p.x + p.off), y: this.sy(p.axis === 'h' ? p.y + p.off : p.y) + 4 }))
      .filter((d) => this.visible(d.x, d.y))
      .sort((a, b) => a.y - b.y);
    for (const { p, x, y } of peds) {
      const facing: Facing = p.axis === 'h' ? (p.dir > 0 ? 'e' : 'w') : p.dir > 0 ? 's' : 'n';
      drawPed(g, x, y, p.look, facing, p.waiting ? 0 : Math.floor(p.walked / 4) % 4);
    }

    this.drawSignals(false);

    g.globalAlpha = 0.09;
    for (const c of this.clouds) {
      const x = Math.round(this.sx(c.x));
      const y = Math.round(this.sy(c.y));
      g.drawImage(c.img, x, y);
      if (x + c.img.width > WW - M) g.drawImage(c.img, x - WW, y);
      if (y + c.img.height > WH - M) g.drawImage(c.img, x, y - WH);
    }
    g.globalAlpha = 1;

    this.drawLighting();
  }

  private drawFountains() {
    const g = this.g;
    for (const f of this.world.fountains) {
      const x = this.sx(f.x);
      const y = this.sy(f.y);
      if (!this.visible(x, y)) continue;
      g.fillStyle = '#e4f6ff';
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const rr = 2 + ((this.t * 9 + i * 1.7) % 8);
        g.fillRect(Math.round(x + Math.cos(a) * rr), Math.round(y + Math.sin(a) * rr * 0.8 - (8 - rr) * 0.4), 1, 1);
      }
      g.fillRect(Math.round(x), Math.round(y - 3 - ((this.t * 6) % 3)), 1, 3);
    }
  }

  private drawSignals(lightsOnly: boolean) {
    const g = this.g;
    const colors: Record<Light, string> = { r: '#ff4b3e', y: '#ffc53d', g: '#4dff7a' };
    for (const s of this.world.signals) {
      const x = this.sx(s.x);
      const y = this.sy(s.y);
      if (!this.visible(x, y)) continue;
      const light = signal(this.t, s.axis);
      const ly = y - 12 + (light === 'r' ? 0 : light === 'y' ? 2 : 4);
      if (!lightsOnly) {
        g.fillStyle = 'rgba(22,32,48,0.3)';
        g.fillRect(x + 1, y, 2, 1);
        g.fillStyle = '#3a3e49';
        g.fillRect(x, y - 6, 1, 6);
        g.fillStyle = '#1e2027';
        g.fillRect(x - 1, y - 13, 3, 7);
        g.fillStyle = '#44464f';
        g.fillRect(x, y - 12, 1, 1);
        g.fillRect(x, y - 10, 1, 1);
        g.fillRect(x, y - 8, 1, 1);
      }
      g.fillStyle = colors[light];
      g.fillRect(x, ly, 1, 1);
      if (lightsOnly) g.drawImage(this.glow, x - 3, ly - 3, 7, 7);
    }
  }

  private drawLighting() {
    const g = this.g;
    const warm = warmth(this.hour);
    if (warm > 0) {
      g.fillStyle = `rgba(255,128,60,${0.13 * warm})`;
      g.fillRect(0, 0, this.vw, this.vh);
    }
    const dark = darkness(this.hour);
    if (dark <= 0.02) return;

    g.fillStyle = `rgba(14,18,52,${dark})`;
    g.fillRect(0, 0, this.vw, this.vh);

    g.globalCompositeOperation = 'lighter';
    const a = Math.min(1, dark / 0.45);

    g.fillStyle = `rgba(255,196,110,${0.62 * a})`;
    for (const w of this.world.windows) {
      if (!w.on) continue;
      const x = this.sx(w.x);
      const y = this.sy(w.y);
      if (this.visible(x, y)) g.fillRect(x, y, w.w, w.h);
    }

    g.globalAlpha = a;
    for (const l of this.world.lamps) {
      const x = this.sx(l.x);
      const y = this.sy(l.y);
      if (this.visible(x, y)) g.drawImage(this.glow, x - 16, y - 12);
    }

    g.fillStyle = 'rgba(255,236,170,0.2)';
    for (const c of this.cars) {
      const x = this.sx(c.axis === 'h' ? c.pos : c.lane);
      const y = this.sy(c.axis === 'h' ? c.lane : c.pos);
      if (!this.visible(x, y)) continue;
      const f = c.spr.len / 2;
      const hw = c.spr.wid / 2 - 1;
      if (c.axis === 'h') g.fillRect(Math.round(c.dir > 0 ? x + f : x - f - 18), Math.round(y - hw), 18, hw * 2);
      else g.fillRect(Math.round(x - hw), Math.round(c.dir > 0 ? y + f : y - f - 18), hw * 2, 18);
    }
    this.drawSignals(true);

    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }
}
