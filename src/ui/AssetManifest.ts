import type { EnemyTier } from '../core/BalanceTypes.ts';

/**
 * Таблица путей к текстурам.
 *
 * Общие пропы (колонна, амфора, ворота) рисуются геометрией (ui/props/):
 * у картинок не получилось свести камеру и свет — ровно на этом они
 * разъезжались между собой. Островные пропы, наоборот, картинки: они рисуются
 * одной пачкой под один промпт (ISLANDS.md §1.4), поэтому внутри острова
 * ракурс и свет сходятся, а между островами их и не надо сводить.
 *
 * Не балансные числа (CLAUDE.md §1 сюда не относится) — просто адреса файлов
 * и их исходный размер для тайлинга.
 * Отсутствующий файл не роняет игру: Sprites.get() вернёт undefined,
 * и Renderer.ts рисует прежний прямоугольник.
 */
export interface SpriteDef {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

export const SPRITES = {
  'ground-base': { src: 'art/ground/base.png', width: 512, height: 512 },
  // Файлов пока нет — Sprites молча пропустит загрузку, Renderer рисует
  // прямоугольники. Как только появится PNG по этому пути, спрайт включится
  // без правок кода.
  player: { src: 'art/entities/player.png', width: 18, height: 18 },
  'enemy-normal': { src: 'art/entities/enemy-normal.png', width: 22, height: 22 },
  'enemy-elite': { src: 'art/entities/enemy-elite.png', width: 30, height: 30 },
  'enemy-miniboss': { src: 'art/entities/enemy-miniboss.png', width: 42, height: 42 },
  // Иконок типов урона здесь нет: они рисуются вектором (ui/TypeGlyphs.ts).
  // Растровому набору пришлось бы держать по файлу на каждый размер плашки —
  // над врагом, в слоте, на карте и в инвентаре они разной величины.
  // Детали бумажной куклы Одиссея. Размеры — исходные, из них берётся только
  // пропорция: рост кости задаётся долей от роста фигуры (ui/rig/RigParts.ts).
  // Пока хоть одной детали нет, Renderer рисует прежний цельный player.png.
  'odysseus-torso': { src: 'art/entities/odysseus/torso.png', width: 208, height: 384 },
  'odysseus-arm': { src: 'art/entities/odysseus/arm.png', width: 97, height: 384 },
  'odysseus-leg': { src: 'art/entities/odysseus/leg.png', width: 110, height: 384 },
  'odysseus-cloak': { src: 'art/entities/odysseus/cloak.png', width: 366, height: 384 },
  'odysseus-sword': { src: 'art/entities/odysseus/sword.png', width: 123, height: 384 },
  'odysseus-spear': { src: 'art/entities/odysseus/spear.png', width: 45, height: 384 },
  'odysseus-club': { src: 'art/entities/odysseus/club.png', width: 96, height: 384 },
  // Детали кикона. Костюм на острове один на все три тира (ISLANDS.md §1.5),
  // поэтому набор общий: тиры различает размер фигуры и кольцо ранга.
  'kikon-torso': { src: 'art/entities/kikon/torso.png', width: 256, height: 384 },
  'kikon-arm': { src: 'art/entities/kikon/arm.png', width: 96, height: 384 },
  'kikon-leg': { src: 'art/entities/kikon/leg.png', width: 104, height: 384 },
  'road-segment': { src: 'art/road/segment.png', width: 128, height: 128 },
  'border-wall': { src: 'art/borders/wall.png', width: 512, height: 256 },

  // --- Остров 1, Исмара (islands/01-ismaros.md) ---
  // Размеры здесь — исходные размеры файлов. Из них берётся только пропорция:
  // величина объекта в мире задаётся отдельно (props.sizes, enemySizeByTier).
  'ismaros-road': { src: 'art/road/ismaros.png', width: 256, height: 256 },
  'ismaros-border': { src: 'art/borders/ismaros.png', width: 512, height: 110 },
  'ismaros-normal': { src: 'art/entities/ismaros-normal.png', width: 353, height: 512 },
  'ismaros-elite': { src: 'art/entities/ismaros-elite.png', width: 346, height: 512 },
  'ismaros-miniboss': { src: 'art/entities/ismaros-miniboss.png', width: 340, height: 512 },
  'ismaros-boss': { src: 'art/entities/boss-ismaros.png', width: 343, height: 512 },
  'prop-vine-trellis': { src: 'art/props/vine-trellis.png', width: 512, height: 365 },
  'prop-wine-press': { src: 'art/props/wine-press.png', width: 512, height: 359 },
  'prop-cart-broken': { src: 'art/props/cart-broken.png', width: 512, height: 312 },
  'prop-palisade-burnt': { src: 'art/props/palisade-burnt.png', width: 512, height: 421 },
  'prop-hut-burnt': { src: 'art/props/hut-burnt.png', width: 512, height: 341 },
} as const satisfies Record<string, SpriteDef>;

export type SpriteId = keyof typeof SPRITES;

/**
 * Запасные силуэты врага по тиру — общие для всех островов. Островные фигуры
 * встают перед ними (ui/IslandArt.ts); сюда цепочка проваливается, только если
 * у острова своей картинки ещё нет.
 *
 * Тир при этом не теряется даже на запасной фигуре: его держит кольцо под
 * ногами (Figures.drawRankRing) и размер.
 */
export const ENEMY_SPRITES_BY_TIER: Record<EnemyTier, readonly SpriteId[]> = {
  normal: ['enemy-normal'],
  elite: ['enemy-elite', 'enemy-normal'],
  miniboss: ['enemy-miniboss', 'enemy-elite', 'enemy-normal'],
  boss: ['enemy-miniboss', 'enemy-elite', 'enemy-normal'],
};
