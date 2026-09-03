import type { EnemyTier } from '../core/BalanceTypes.ts';
import { ENEMY_SPRITES_BY_TIER, type SpriteId } from './AssetManifest.ts';
import { KIKON_RIG, type Rig } from './rig/RigParts.ts';

/**
 * Какой арт берёт остров. Адреса картинок, а не числа, — поэтому здесь, а не
 * в balance.json (CLAUDE.md §1 про магические константы сюда не относится, как
 * и к AssetManifest.ts рядом).
 *
 * Таблица, а не набор общих файлов, потому что островов тринадцать и у каждого
 * свой народ: киконы Исмары и лотофаги второго острова не могут делить один
 * `enemy-normal.png`. Острова, у которых своего арта ещё нет, в таблице просто
 * отсутствуют и продолжают рисоваться прежними фигурами — новый остров
 * включается одной записью, без правок кода.
 */
export interface IslandArt {
  /** Фигуры врагов по тиру. Тир без записи падает на общий запасной силуэт. */
  readonly enemies?: Partial<Record<EnemyTier, SpriteId>>;
  /**
   * Из чего собран враг острова, если его порезали на части. Нет записи —
   * рисуется цельная картинка, как раньше: недостающие детали не должны
   * ронять остров, они добавляются по одной.
   */
  readonly enemyRig?: Rig;
  readonly road?: SpriteId;
  readonly border?: SpriteId;
}

export const ISLAND_ART: Readonly<Record<string, IslandArt>> = {
  ismaros: {
    enemies: {
      normal: 'ismaros-normal',
      elite: 'ismaros-elite',
      miniboss: 'ismaros-miniboss',
      boss: 'ismaros-boss',
    },
    enemyRig: KIKON_RIG,
    road: 'ismaros-road',
    border: 'ismaros-border',
  },
};

/**
 * Цепочка спрайтов врага: сначала фигура острова, за ней общие запасные.
 * Именно цепочка, а не один id: файл может ещё не лежать в public/art, и
 * тогда Sprites.get вернёт undefined — фигура должна найтись дальше по списку,
 * а не пропасть.
 */
export function enemySpriteChain(island: string, tier: EnemyTier): readonly SpriteId[] {
  const own = ISLAND_ART[island]?.enemies?.[tier];
  const fallback = ENEMY_SPRITES_BY_TIER[tier];
  return own ? [own, ...fallback] : fallback;
}

/** Скелет врага острова. null — фигура рисуется цельной картинкой. */
export function islandEnemyRig(island: string): Rig | null {
  return ISLAND_ART[island]?.enemyRig ?? null;
}

/** Дорога острова, иначе общий сегмент. */
export function islandRoad(island: string): SpriteId {
  return ISLAND_ART[island]?.road ?? 'road-segment';
}

/** Кладка по краю острова, иначе общая стена. */
export function islandBorder(island: string): SpriteId {
  return ISLAND_ART[island]?.border ?? 'border-wall';
}
