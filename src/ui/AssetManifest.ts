import type { EnemyTier } from '../core/BalanceTypes.ts';

/**
 * Таблица путей к текстурам. Пропов здесь нет: они рисуются геометрией
 * (ui/props/), потому что у картинок не получается свести камеру и свет —
 * ровно на этом разъезжались колонна, амфора и ворота между собой.
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
  'road-segment': { src: 'art/road/segment.png', width: 128, height: 128 },
  'border-wall': { src: 'art/borders/wall.png', width: 512, height: 256 },
} as const satisfies Record<string, SpriteDef>;

export type SpriteId = keyof typeof SPRITES;

/**
 * Спрайт врага по тиру, с запасными вариантами. Пока картинки мини-босса нет,
 * он берёт силуэт элиты: на экране это узнаваемая фигура покрупнее, а не
 * чёрный квадрат — самый грубый артефакт из всех возможных. Ранг при этом не
 * теряется, его держит кольцо под ногами (Renderer.drawRankRing).
 */
export const ENEMY_SPRITES_BY_TIER: Record<EnemyTier, readonly SpriteId[]> = {
  normal: ['enemy-normal'],
  elite: ['enemy-elite', 'enemy-normal'],
  miniboss: ['enemy-miniboss', 'enemy-elite', 'enemy-normal'],
  // Своей картинки у босса нет и до Фазы 4 не будет. Ранг держат размер фигуры,
  // кольцо арены под ногами и плашка с именем — не текстура.
  boss: ['enemy-miniboss', 'enemy-elite', 'enemy-normal'],
};
