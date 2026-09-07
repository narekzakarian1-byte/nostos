import type { DamageType, TerrainId } from '../core/BalanceTypes.ts';
import type { DecorId } from './Decor.ts';
import raw from '../../islands/01-ismaros.layout.json' with { type: 'json' };

/**
 * Раскладка острова: где точка высадки, где арена, какие зоны и что в них
 * стоит.
 *
 * Зачем вообще файл. До него весь остров бросался костями: `SpawnManager`
 * кидал 22 узла в случайные свободные точки, `Scenery` сыпала декор
 * случайными кластерами. При такой раскладке остров физически не может
 * читаться как задуманный — это зелёное поле, по которому раскидано
 * содержимое. Раскладка возвращает авторство: зоны, ландмарки и вождей
 * ставит рука, а мелочь по-прежнему сеет rng внутри отведённой ей зоны.
 *
 * Числа отсюда — не баланс (CLAUDE.md §1 сюда не относится, как и к
 * AssetManifest.ts): это координаты уровня, а не HP, урон и таймеры. Те
 * остаются в balance.json.
 *
 * Острова без раскладки продолжают работать по-старому — `islandLayout`
 * вернёт null, и `SpawnManager` уйдёт в прежнюю случайную ветку. Новый остров
 * включается одним файлом, без правок кода.
 */

/** Точка в долях мира: [0, 1] по каждой оси. */
export interface LayoutPoint {
  readonly x: number;
  readonly y: number;
}

/** Сколько узлов какого тира сеется в зоне. Мини-боссы сюда не входят —
 *  они стоят поимённо и в фиксированных точках. */
export interface ZoneBudget {
  readonly normal?: number;
  readonly elite?: number;
}

/**
 * Крупный предмет в точно заданной точке: давильня у давильни, костёр на
 * круче, колонны вокруг арены. От случайного декора отличается тем, что
 * ставится первым и безусловно — по ландмаркам зона и узнаётся.
 */
export interface LandmarkDef {
  readonly prop: DecorId;
  readonly at: LayoutPoint;
}

/**
 * Набор декора зоны. Свой у каждой: на террасах шпалеры, в деревне пепелище,
 * на берегу почти пусто. Общий набор на весь остров и давал винный пресс на
 * площади храма — предмет переставал означать место.
 */
export interface ZoneProps {
  /** Сколько групп сеется в зоне. Меньше групп — больше чистого поля вокруг врагов. */
  readonly clusters: number;
  readonly anchors: readonly DecorId[];
  readonly satellites: readonly DecorId[];
}

export interface ZoneDef {
  readonly id: string;
  readonly name: string;
  /** Прямоугольник зоны в долях мира: [x, y, ширина, высота]. */
  readonly rect: readonly [number, number, number, number];
  readonly nodes: ZoneBudget;
  /**
   * Материал земли под зоной (balance.terrain.materials). Галька на берегу,
   * сухая охра на террасах, палевая пыль на площади храма.
   *
   * Это и есть разница между островом и зелёным полем с предметами: место
   * узнаётся по земле раньше, чем по декору на ней. Зона без материала
   * остаётся на общей траве острова.
   */
  readonly ground?: TerrainId;
  readonly landmarks?: readonly LandmarkDef[];
  readonly props?: ZoneProps;
}

/** Именованный узел, стоящий в конкретной точке: вождь у своего ландмарка. */
export interface NamedNode {
  readonly name: string;
  readonly zone: string;
  readonly at: LayoutPoint;
  readonly weakness: DamageType;
  readonly copyType: DamageType;
}

export interface IslandLayout {
  readonly id: string;
  readonly landing: LayoutPoint;
  readonly arena: LayoutPoint;
  readonly zones: readonly ZoneDef[];
  readonly minibosses: readonly NamedNode[];
  /** Стержень: от нижнего края мира к арене. */
  readonly road: readonly LayoutPoint[];
  /** Ответвления к боковым зонам. Каждое начинается точкой, лежащей на стержне. */
  readonly branches: readonly (readonly LayoutPoint[])[];
}

/** Размер мира в единицах — то, во что переводятся доли. */
export interface WorldSize {
  readonly width: number;
  readonly height: number;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

// Приведение через unknown — как в core/Balance.ts: из JSON компилятор выводит
// расширенные типы (string вместо литеральных union'ов, number[] вместо
// кортежей). Соответствие формы проверяет tests/island-layout.test.ts.
const LAYOUTS: Readonly<Record<string, IslandLayout>> = {
  ismaros: raw as unknown as IslandLayout,
};

export function islandLayout(id: string): IslandLayout | null {
  return LAYOUTS[id] ?? null;
}

export function toWorld(point: LayoutPoint, world: WorldSize): { x: number; y: number } {
  return { x: point.x * world.width, y: point.y * world.height };
}

export function zoneRect(zone: ZoneDef, world: WorldSize): Rect {
  const [x, y, width, height] = zone.rect;
  return {
    x: x * world.width,
    y: y * world.height,
    width: width * world.width,
    height: height * world.height,
  };
}

/** Зона, в которой лежит точка мира. null — точка за всеми зонами. */
export function zoneAt(
  layout: IslandLayout,
  world: WorldSize,
  x: number,
  y: number,
): ZoneDef | null {
  for (const zone of layout.zones) {
    const rect = zoneRect(zone, world);
    if (x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height) {
      return zone;
    }
  }
  return null;
}
