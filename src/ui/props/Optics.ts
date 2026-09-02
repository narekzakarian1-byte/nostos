import { getBalance } from '../../core/Balance.ts';

/**
 * Камера и свет пропов — одни на весь остров. Здесь только они и элементарная
 * векторная арифметика; заливкой граней занимается Solid.ts.
 *
 * Смысл вынесенной оптики: два разных пропа физически не могут разойтись по
 * ракурсу или направлению тени, потому что берут проекцию отсюда. Именно это
 * держит вид референса — и это не воспроизводится аккуратностью при рисовании
 * отдельных спрайтов.
 */
export type Vec3 = readonly [number, number, number];
export type MaterialId = 'marble' | 'stone' | 'rubble' | 'clay' | 'wood' | 'ember';

export interface Face {
  readonly v: readonly Vec3[];
  readonly mat: MaterialId;
}

export type Tone = readonly [number, number, number];

interface Optics {
  readonly groundSquash: number;
  readonly heightScale: number;
  readonly cam: Vec3;
  readonly light: Vec3;
  readonly shadowX: number;
  readonly shadowY: number;
  readonly tones: Readonly<Record<MaterialId, readonly [Tone, Tone, Tone]>>;
}

let cached: Optics | undefined;

/** Считается один раз: тригонометрия на каждую грань каждого пропа лишняя. */
export function optics(): Optics {
  if (cached) return cached;
  const p = getBalance().props;
  const tilt = (p.cameraTiltDeg * Math.PI) / 180;
  const light = unit([p.lightX, p.lightY, p.lightZ]);
  const tones = {} as Record<MaterialId, readonly [Tone, Tone, Tone]>;
  for (const [id, hexes] of Object.entries(p.materials)) {
    tones[id as MaterialId] = hexes.map(rgb) as unknown as readonly [Tone, Tone, Tone];
  }
  cached = {
    groundSquash: Math.sin(tilt),
    heightScale: Math.cos(tilt),
    cam: [0, -Math.cos(tilt), Math.sin(tilt)],
    light,
    // Снос тени по земле на единицу высоты. Тень выходит резкой полигональной
    // копией силуэта, а не эллипсом под ногами: в референсе видно именно
    // проекцию формы, и она же привязывает объект к общему свету.
    shadowX: -light[0] / light[2],
    shadowY: -light[1] / light[2],
    tones,
  };
  return cached;
}

export function rgb(hex: string): Tone {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function unit(v: Vec3): Vec3 {
  const m = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / m, v[1] / m, v[2] / m];
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function project(p: Vec3): readonly [number, number] {
  const o = optics();
  return [p[0], -(p[1] * o.groundSquash + p[2] * o.heightScale)];
}

export function projectShadow(p: Vec3): readonly [number, number] {
  const o = optics();
  return project([p[0] + o.shadowX * p[2], p[1] + o.shadowY * p[2], 0]);
}

export function normalOf(f: Face): Vec3 {
  const [a, b, c] = [f.v[0]!, f.v[1]!, f.v[2]!];
  const u: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const w: Vec3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  return unit([u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]);
}
