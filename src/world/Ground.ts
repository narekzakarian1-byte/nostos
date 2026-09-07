import { getBalance } from '../core/Balance.ts';
import type { TerrainId } from '../core/BalanceTypes.ts';
import type { Rng } from '../core/Rng.ts';
import { zoneRect, type IslandLayout, type Rect } from './Layout.ts';

/**
 * Земля острова как данные: береговая линия, материал под ногами по зонам,
 * крупные пятна света и тени. Ни строчки про канвас — печёт картинку
 * ui/GroundPaint.ts, здесь только детерминированная по сиду геометрия
 * (CLAUDE.md §2).
 *
 * Зачем вообще. Вся земля мира заливалась одним тайлом травы, и «Галечный
 * берег», «Площадь у храма» и «Круча» были покрашены одинаково — остров
 * читался зелёным полем, по которому расставлены предметы. Место узнаётся по
 * земле раньше, чем по декору на ней: в референсе биом меняется под ногами, и
 * границу видно.
 *
 * Второе — край. За стеной лежала заливка bgFar, тёмно-синяя пустота. Берег с
 * прибоем объясняет край мира сам, без рамки: дальше вода.
 */
export interface GroundPoint {
  readonly x: number;
  readonly y: number;
}

/** Клякса материала. Их много и они перекрываются — из этого и складывается
 *  неровная граница зоны вместо видимого прямоугольника. */
export interface GroundPatch {
  readonly x: number;
  readonly y: number;
  readonly rx: number;
  readonly ry: number;
  readonly material: TerrainId;
  /** Поворот кляксы: одинаково лежащие эллипсы выдают сетку, по которой сеялись. */
  readonly angle: number;
}

/** Крупное пятно света или тени поверх всей земли. */
export interface ShadeBlob {
  readonly x: number;
  readonly y: number;
  readonly rx: number;
  readonly ry: number;
  readonly dark: boolean;
}

export interface GroundBounds {
  readonly width: number;
  readonly height: number;
}

export class Ground {
  /** Замкнутый контур суши. Идёт снаружи стены: полосу за ней видно, но не ходят. */
  readonly coast: readonly GroundPoint[];
  readonly patches: readonly GroundPatch[];
  readonly blobs: readonly ShadeBlob[];

  constructor(
    rng: Rng,
    bounds: GroundBounds,
    border: Rect,
    layout: IslandLayout | null,
  ) {
    this.coast = coastline(rng, border);
    this.patches = layout ? zonePatches(rng, bounds, layout) : [];
    this.blobs = shadeBlobs(rng, bounds);
  }
}

/**
 * Береговая линия: обход прямоугольника стены со сносом наружу.
 *
 * Снос идёт по лучу из центра, а не по нормали стороны, — тогда углы острова
 * скругляются сами и берег не выходит прямоугольником со скошенными краями.
 * Волнистость — сумма трёх синусов по углу обхода: такая функция замыкается
 * точно, и на стыке первого шага с последним не остаётся шва.
 */
function coastline(rng: Rng, border: Rect): GroundPoint[] {
  const { coast } = getBalance().terrain;
  const cx = border.x + border.width / 2;
  const cy = border.y + border.height / 2;
  const phases = coast.lobes.map(() => rng.range(0, Math.PI * 2));

  const points: GroundPoint[] = [];
  for (let i = 0; i < coast.steps; i++) {
    const t = i / coast.steps;
    const edge = perimeterPoint(border, t);
    const dx = edge.x - cx;
    const dy = edge.y - cy;
    const length = Math.hypot(dx, dy) || 1;

    let wave = 0;
    for (let k = 0; k < coast.lobes.length; k++) {
      wave += Math.sin(t * Math.PI * 2 * coast.lobes[k]! + phases[k]!) / (k + 1);
    }
    const out = coast.outsetUnits * (1 + coast.waviness * wave);
    points.push({ x: edge.x + (dx / length) * out, y: edge.y + (dy / length) * out });
  }
  return points;
}

/** Точка на периметре прямоугольника по доле обхода в [0, 1), от левого верхнего угла. */
function perimeterPoint(rect: Rect, t: number): GroundPoint {
  const total = (rect.width + rect.height) * 2;
  let along = t * total;
  if (along < rect.width) return { x: rect.x + along, y: rect.y };
  along -= rect.width;
  if (along < rect.height) return { x: rect.x + rect.width, y: rect.y + along };
  along -= rect.height;
  if (along < rect.width) return { x: rect.x + rect.width - along, y: rect.y + rect.height };
  along -= rect.width;
  return { x: rect.x, y: rect.y + rect.height - along };
}

/**
 * Материал зоны кляксами по сетке. Прямоугольник заливки читался бы плиткой:
 * граница видна, и девять зон превращались бы в шахматную доску. Кляксы
 * выпускаются за край зоны на bleed, поэтому соседние материалы входят друг в
 * друга, а не стыкуются по линейке.
 */
function zonePatches(rng: Rng, bounds: GroundBounds, layout: IslandLayout): GroundPatch[] {
  const { patch } = getBalance().terrain;
  const patches: GroundPatch[] = [];

  for (const zone of layout.zones) {
    if (!zone.ground) continue;
    const rect = zoneRect(zone, bounds);
    const cols = Math.max(1, Math.round(rect.width / patch.cellUnits));
    const rows = Math.max(1, Math.round(rect.height / patch.cellUnits));
    const cellW = rect.width / cols;
    const cellH = rect.height / rows;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const jx = rng.range(-patch.jitter, patch.jitter) * cellW;
        const jy = rng.range(-patch.jitter, patch.jitter) * cellH;
        patches.push({
          x: rect.x + (col + 0.5) * cellW + jx,
          y: rect.y + (row + 0.5) * cellH + jy,
          rx: (cellW * patch.radiusScale) / 2 + patch.bleedUnits,
          ry: (cellH * patch.radiusScale) / 2 + patch.bleedUnits,
          material: zone.ground,
          angle: rng.range(0, Math.PI),
        });
      }
    }
  }
  return patches;
}

/**
 * Пятна света и тени во весь мир. В референсе на кадре всегда лежит тень от
 * чего-то, чего в кадре нет, — без этого земля любого цвета читается ровной
 * заливкой, сколько ни правь её тон.
 */
function shadeBlobs(rng: Rng, bounds: GroundBounds): ShadeBlob[] {
  const { shade } = getBalance().terrain;
  const blobs: ShadeBlob[] = [];
  for (let i = 0; i < shade.count; i++) {
    const radius = shade.radiusUnits * (1 + rng.range(-shade.radiusJitter, shade.radiusJitter));
    blobs.push({
      x: rng.range(0, bounds.width),
      y: rng.range(0, bounds.height),
      rx: radius,
      ry: radius * shade.squash,
      dark: rng.chance(0.6),
    });
  }
  return blobs;
}
