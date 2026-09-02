import type { Face, MaterialId, Vec3 } from './Optics.ts';

/**
 * Примитивы, из которых собраны пропы. Греческий реквизит весь либо тело
 * вращения (колонна, амфора, валун), либо коробка (архитрав, плинт), поэтому
 * трёх примитивов хватает на весь остров.
 */

/**
 * Тело вращения по профилю [[радиус, высота], ...].
 *
 * flute модулирует радиус через грань — так у колонны появляются каннелюры.
 * Без них ствол на сорока пикселях читается гладкой трубой, а не дорийской
 * колонной: на таком размере узнавание держится только на чередовании тонов.
 *
 * vary задаёт неровность по граням и нужен камням: идеальное тело вращения
 * выглядит выточенным на станке, а не отколовшимся.
 */
export function lathe(
  profile: readonly (readonly [number, number])[],
  sides: number,
  mat: MaterialId,
  flute = 0,
  vary: ((i: number) => number) | null = null,
): Face[] {
  const faces: Face[] = [];
  const scale: number[] = [];
  for (let i = 0; i < sides; i++) scale.push((1 - flute * (i % 2)) * (vary ? vary(i) : 1));
  const at = (i: number, r: number, z: number): Vec3 => {
    const a = ((i % sides) / sides) * 2 * Math.PI;
    const k = scale[i % sides]!;
    return [r * k * Math.cos(a), r * k * Math.sin(a), z];
  };

  for (let i = 0; i < sides; i++) {
    for (let k = 0; k < profile.length - 1; k++) {
      const [r0, z0] = profile[k]!;
      const [r1, z1] = profile[k + 1]!;
      if (r0 < 0.001 && r1 < 0.001) continue;
      faces.push({ v: [at(i, r0, z0), at(i + 1, r0, z0), at(i + 1, r1, z1), at(i, r1, z1)], mat });
    }
  }

  const [rTop, zTop] = profile[profile.length - 1]!;
  if (rTop > 0.001) {
    const cap: Vec3[] = [];
    for (let i = 0; i < sides; i++) cap.push(at(i, rTop, zTop));
    faces.push({ v: cap, mat });
  }
  const [rBot, zBot] = profile[0]!;
  if (rBot > 0.001) {
    const cap: Vec3[] = [];
    for (let i = sides - 1; i >= 0; i--) cap.push(at(i, rBot, zBot));
    faces.push({ v: cap, mat });
  }
  return faces;
}

/** Коробка. Дно не строится: проп стоит на земле, и снизу его не видно. */
export function box(
  cx: number, cy: number, z0: number,
  w: number, d: number, h: number,
  mat: MaterialId,
): Face[] {
  const x0 = cx - w / 2, x1 = cx + w / 2;
  const y0 = cy - d / 2, y1 = cy + d / 2;
  const z1 = z0 + h;
  return [
    { v: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], mat },
    { v: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], mat },
    { v: [[x1, y1, z0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1]], mat },
    { v: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], mat },
    { v: [[x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1]], mat },
  ];
}

/**
 * Труба вдоль ломаной. Нужна ровно ради ручек амфоры: без них сосуд читается
 * как горшок или тыква, а ручки — единственная деталь, по которой амфора
 * узнаётся на четырнадцати пикселях.
 */
export function tube(path: readonly Vec3[], r: number, sides: number, mat: MaterialId): Face[] {
  const rings = path.map((p, i) => {
    const a = path[Math.max(0, i - 1)]!;
    const b = path[Math.min(path.length - 1, i + 1)]!;
    const t = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
    // Ручки лежат в плоскости XZ, поэтому опорная ось кадра постоянна.
    const u: Vec3 = [0, 1, 0];
    const v = norm([t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]]);
    const ring: Vec3[] = [];
    for (let k = 0; k < sides; k++) {
      const ang = (k / sides) * 2 * Math.PI;
      const c = Math.cos(ang), s = Math.sin(ang);
      ring.push([
        p[0] + r * (c * u[0] + s * v[0]),
        p[1] + r * (c * u[1] + s * v[1]),
        p[2] + r * (c * u[2] + s * v[2]),
      ]);
    }
    return ring;
  });

  const faces: Face[] = [];
  for (let i = 0; i < rings.length - 1; i++) {
    for (let k = 0; k < sides; k++) {
      const k2 = (k + 1) % sides;
      faces.push({ v: [rings[i]![k]!, rings[i]![k2]!, rings[i + 1]![k2]!, rings[i + 1]![k]!], mat });
    }
  }
  return faces;
}

function norm(v: Vec3): Vec3 {
  const m = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / m, v[1] / m, v[2] / m];
}

export function shift(faces: readonly Face[], dx: number, dy: number, dz: number): Face[] {
  return faces.map((f) => ({ ...f, v: f.v.map((p): Vec3 => [p[0] + dx, p[1] + dy, p[2] + dz]) }));
}

/** Отражение по X с обращением обхода: иначе у зеркальной копии наружу смотрит изнанка. */
export function mirrorX(faces: readonly Face[]): Face[] {
  return faces.map((f) => ({ ...f, v: [...f.v].reverse().map((p): Vec3 => [-p[0], p[1], p[2]]) }));
}

/** Кладёт объект на бок — так из барабана колонны получается лежащий обломок. */
export function layDown(faces: readonly Face[]): Face[] {
  return faces.map((f) => ({ ...f, v: f.v.map((p): Vec3 => [p[0], -p[2], p[1]]) }));
}

/**
 * Неровность по граням, детерминированная по сиду (CLAUDE.md §2): Math.random
 * дал бы разные камни при одном сиде мира.
 */
export function vary(count: number, amount: number, seed: number): (i: number) => number {
  const out: number[] = [];
  let s = seed >>> 0;
  for (let i = 0; i < count; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    out.push(1 + ((s >>> 8) / 16777216 - 0.5) * 2 * amount);
  }
  return (i) => out[i % count]!;
}
