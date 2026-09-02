import { getBalance } from '../../core/Balance.ts';
import {
  dot, normalOf, optics, project, projectShadow, rgba,
  type Face, type MaterialId, type Vec3,
} from './Optics.ts';

/**
 * Заливка граней пропа. Форма объектов — в Models.ts (как векторные пути в
 * Glyphs.ts), камера и свет — в Optics.ts, здесь только собственно рисование.
 */
export interface Box2 {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

function faceColor(mat: MaterialId, n: Vec3): string {
  const o = optics();
  const { shadeGain, shadeBias, shadeSteps } = getBalance().props;
  // half-lambert: теневая грань уходит в тон, а не в чёрное. Ступенчатое
  // округление и даёт фасетку — внутри грани градиента нет, как в референсе.
  const raw = dot(n, o.light) * shadeGain + shadeBias;
  const s = Math.max(0, Math.min(1, Math.round(raw * shadeSteps) / shadeSteps));
  const [lit, mid, dark] = o.tones[mat];
  const from = s < 0.5 ? dark : mid;
  const to = s < 0.5 ? mid : lit;
  const t = s < 0.5 ? s * 2 : (s - 0.5) * 2;
  const mix = (i: 0 | 1 | 2): number => Math.round(from[i] + (to[i] - from[i]) * t);
  return `rgb(${mix(0)},${mix(1)},${mix(2)})`;
}

/** Габарит проекции тела, без тени. По нему задаётся размер пропа в мире. */
export function bodyBox(faces: readonly Face[]): Box2 {
  return boxOf(faces, project);
}

/** Габарит тела вместе с тенью — по нему режется холст и отсечение по камере. */
export function fullBox(faces: readonly Face[]): Box2 {
  const a = boxOf(faces, project);
  const b = boxOf(faces, projectShadow);
  return {
    minX: Math.min(a.minX, b.minX), maxX: Math.max(a.maxX, b.maxX),
    minY: Math.min(a.minY, b.minY), maxY: Math.max(a.maxY, b.maxY),
  };
}

function boxOf(faces: readonly Face[], to: (p: Vec3) => readonly [number, number]): Box2 {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const f of faces) {
    for (const p of f.v) {
      const [x, y] = to(p);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, maxX, minY, maxY };
}

/**
 * Рисует проп в текущей системе координат: начало координат — точка касания
 * земли. Порядок жёсткий: контактное затемнение, отброшенная тень, тело.
 *
 * pxPerUnit нужен только для толщины шва между гранями — без шва антиалиасинг
 * оставляет между соседними гранями просветы в цвет фона, и объект выглядит
 * растрескавшимся.
 */
export function drawSolid(
  ctx: CanvasRenderingContext2D,
  faces: readonly Face[],
  pxPerUnit: number,
): void {
  const p = getBalance().props;
  const o = optics();

  // Контактное затемнение отдельно от тени: одна лишь отброшенная тень уходит
  // вбок, и объект остаётся без привязки к своей точке на земле.
  const body = bodyBox(faces);
  const foot = (body.maxX - body.minX) * p.contactSpread;
  ctx.save();
  ctx.scale(1, o.groundSquash * p.contactSquash);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, foot);
  grad.addColorStop(0, rgba(p.shadowColor, p.contactAlpha));
  grad.addColorStop(1, rgba(p.shadowColor, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, foot, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawCastShadow(ctx, faces);

  // Тело: отсечение задних граней и сортировка по глубине (алгоритм художника).
  // Пропы выпуклые или собраны из выпуклых частей, поэтому z-буфер не нужен.
  const visible = faces
    .map((f) => ({ f, n: normalOf(f) }))
    .filter((item) => dot(item.n, o.cam) > 0)
    .map((item) => ({
      ...item,
      depth: item.f.v.reduce((s, pt) => s + dot(pt, o.cam), 0) / item.f.v.length,
    }))
    .sort((a, b) => a.depth - b.depth);

  ctx.lineJoin = 'round';
  for (const { f, n } of visible) {
    ctx.beginPath();
    f.v.forEach((pt, i) => {
      const [x, y] = project(pt);
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = faceColor(f.mat, n);
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = p.seamWidth / pxPerUnit;
    ctx.stroke();
  }
}

/**
 * Тень одним контуром и одной заливкой. Каждый подпуть приводится к общему
 * обходу: при разном направлении обхода nonzero гасит подпути друг о друга, и
 * тень пропадает ровно там, где объект плотнее всего перекрывает сам себя.
 */
function drawCastShadow(ctx: CanvasRenderingContext2D, faces: readonly Face[]): void {
  const p = getBalance().props;
  ctx.save();
  ctx.globalAlpha = p.shadowAlpha;
  ctx.fillStyle = p.shadowColor;
  ctx.beginPath();
  for (const f of faces) {
    const poly = f.v.map(projectShadow);
    let area = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]!, b = poly[(i + 1) % poly.length]!;
      area += a[0] * b[1] - b[0] * a[1];
    }
    if (area < 0) poly.reverse();
    poly.forEach((pt, i) => (i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])));
    ctx.closePath();
  }
  ctx.fill('nonzero');
  ctx.restore();
}
