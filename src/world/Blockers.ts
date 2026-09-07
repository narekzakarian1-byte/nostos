import { getBalance } from '../core/Balance.ts';
import type { DecorId, DecorPlacement } from './Decor.ts';

/**
 * Препятствия на земле.
 *
 * Пока сквозь сгоревшую хижину можно было пройти насквозь, декор оставался
 * наклейкой на газоне: дорога ничего не значила, потому что срезать через
 * деревню стоило столько же, сколько идти по тракту. След на земле — то
 * единственное, что превращает предмет в часть уровня.
 *
 * След есть не у всех: щебень, черепки, амфоры и костёр набирают плотность
 * картинки и цеплять игрока не должны (balance.props.footprints).
 *
 * Врагов это не касается намеренно. Маршрут врага — замкнутая фигура вокруг
 * своей точки (Patrol.ts), и он должен повторяться круг за кругом: упрись
 * враг в частокол, круг разорвался бы, а вместе с ним и главное свойство
 * узла — то, что его обход виден заранее.
 */
export interface Blocker {
  readonly x: number;
  readonly y: number;
  /** Полуоси эллипса следа. ry меньше rx: камера наклонена, круг виден овалом. */
  readonly rx: number;
  readonly ry: number;
}

export interface Foot {
  readonly rx: number;
  readonly ry: number;
}

export function footprintOf(id: DecorId): Foot | null {
  const table = getBalance().props.footprints as Partial<Record<DecorId, Foot>>;
  return table[id] ?? null;
}

export function blockersOf(props: readonly DecorPlacement[]): Blocker[] {
  const blockers: Blocker[] = [];
  for (const prop of props) {
    const foot = footprintOf(prop.id);
    // След растёт вместе с пропом: иначе выросший камень пускал бы игрока
    // сквозь себя, а усохший цеплял бы за пустое место рядом.
    if (foot) {
      blockers.push({
        x: prop.x, y: prop.y,
        rx: foot.rx * prop.scale, ry: foot.ry * prop.scale,
      });
    }
  }
  return blockers;
}

/**
 * Шаг с обходом препятствий.
 *
 * Порядок проб — полный шаг, потом только по X, потом только по Y — и даёт
 * скольжение вдоль стены. Без него игрок липнет к углу хижины и стоит, пока
 * не отпустит стик: единственный ввод в игре перестаёт слушаться, и это
 * читается как зависание, а не как препятствие.
 */
export function slide(
  fromX: number, fromY: number,
  toX: number, toY: number,
  foot: Foot,
  blockers: readonly Blocker[],
): { x: number; y: number } {
  const hits = (x: number, y: number) => blocked(x, y, foot, blockers);

  // Уже внутри следа — выпускаем без проверок. Иначе игрок, оказавшийся в
  // препятствии (дев-телепорт, правка раскладки), застревает в нём навсегда.
  if (hits(fromX, fromY)) return { x: toX, y: toY };

  if (!hits(toX, toY)) return { x: toX, y: toY };
  if (!hits(toX, fromY)) return { x: toX, y: fromY };
  if (!hits(fromX, toY)) return { x: fromX, y: toY };
  return { x: fromX, y: fromY };
}

export function blocked(
  x: number, y: number,
  foot: Foot,
  blockers: readonly Blocker[],
): boolean {
  for (const b of blockers) {
    const rx = b.rx + foot.rx;
    const ry = b.ry + foot.ry;
    const dx = x - b.x;
    if (dx > rx || dx < -rx) continue;
    const dy = y - b.y;
    if (dy > ry || dy < -ry) continue;
    // Эллипс, а не прямоугольник: об угол коробки игрок цепляется там, где
    // на экране между ним и пропом ещё есть просвет.
    const nx = dx / rx;
    const ny = dy / ry;
    if (nx * nx + ny * ny < 1) return true;
  }
  return false;
}
