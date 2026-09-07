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
  'odysseus-club': { src: 'art/entities/club.png', width: 108, height: 512 },
  // Оружие по ступеням редкости. Размеры номинальные — пропорция берётся из
  // самой картинки (ui/rig/DrawRig.ts), потому что обрезка по альфе даёт каждому
  // предмету свой размер. Пока файла нет, Figures.handWeapon откатывается на
  // базовую деталь того же типа, и рука не пустует.
  'weapon-spear-common': { src: 'art/weapons/spear-common.png', width: 512, height: 1024 },
  'weapon-spear-uncommon': { src: 'art/weapons/spear-uncommon.png', width: 512, height: 1024 },
  'weapon-spear-rare': { src: 'art/weapons/spear-rare.png', width: 512, height: 1024 },
  'weapon-spear-epic': { src: 'art/weapons/spear-epic.png', width: 512, height: 1024 },
  'weapon-spear-legendary': { src: 'art/weapons/spear-legendary.png', width: 512, height: 1024 },
  'weapon-sword-common': { src: 'art/weapons/sword-common.png', width: 512, height: 1024 },
  'weapon-sword-uncommon': { src: 'art/weapons/sword-uncommon.png', width: 512, height: 1024 },
  'weapon-sword-rare': { src: 'art/weapons/sword-rare.png', width: 512, height: 1024 },
  'weapon-sword-epic': { src: 'art/weapons/sword-epic.png', width: 512, height: 1024 },
  'weapon-sword-legendary': { src: 'art/weapons/sword-legendary.png', width: 512, height: 1024 },
  'weapon-club-common': { src: 'art/weapons/club-common.png', width: 512, height: 1024 },
  'weapon-club-uncommon': { src: 'art/weapons/club-uncommon.png', width: 512, height: 1024 },
  'weapon-club-rare': { src: 'art/weapons/club-rare.png', width: 512, height: 1024 },
  'weapon-club-epic': { src: 'art/weapons/club-epic.png', width: 512, height: 1024 },
  'weapon-club-legendary': { src: 'art/weapons/club-legendary.png', width: 512, height: 1024 },
  // Детали кикона. Костюм на острове один на все три тира (ISLANDS.md §1.5),
  // поэтому набор общий: тиры различает размер фигуры и кольцо ранга.
  'kikon-torso': { src: 'art/entities/kikon-torso.png', width: 345, height: 442 },
  'kikon-arm': { src: 'art/entities/kikon-arm.png', width: 149, height: 429 },
  'kikon-leg': { src: 'art/entities/kikon-leg.png', width: 113, height: 466 },
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
  // Ландмарки: корабль на берегу и сгоревший храм за спиной босса. Без них
  // берег оставался пустым полем, а арена — четырьмя серыми колоннами.
  'prop-ship': { src: 'art/props/ship-beached.png', width: 512, height: 487 },
  'prop-temple': { src: 'art/props/temple-burnt.png', width: 512, height: 498 },
  // Колонны, ворота, валун и щебень были геометрией (ui/props/Models.ts) и на
  // фоне нарисованных хижины и шпалеры читались как серо-голубые плиты.
  'prop-column': { src: 'art/props/column.png', width: 245, height: 512 },
  'prop-column-broken': { src: 'art/props/column-broken.png', width: 393, height: 512 },
  // Первый ассет из Blender (ART_PIPELINE.md §12). Двумя файлами: тело и
  // отброшенная тень. Якорь и габарит лежат в balance.json props.rendered:
  // соглашение «подошва на нижней кромке» с настоящей тенью не работает.
  'prop-ruin-gate': { src: 'art/props/prop-ruin-gate.png', width: 1377, height: 983 },
  'prop-ruin-gate-shadow': { src: 'art/props/prop-ruin-gate-shadow.png', width: 1377, height: 983 },
  'prop-rock': { src: 'art/props/rock.png', width: 491, height: 478 },
  'prop-rubble': { src: 'art/props/rubble.png', width: 435, height: 362 },
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
