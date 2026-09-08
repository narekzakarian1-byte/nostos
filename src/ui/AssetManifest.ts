import { ART } from './AssetTable.ts';

/**
 * Таблица путей к текстурам.
 *
 * Весь арт NOSTOS идёт из одного места — фабрики ассетов в Blender
 * (ART_RUNBOOK.md), — поэтому и таблица одна: `AssetTable.ts` пишется
 * генератором из метрик рендера. Раньше здесь руками велись три источника
 * сразу (геометрия движка, рендер и картинки Draw Things), и половина
 * комментариев объясняла, чем они отличаются. Отличаться больше нечему.
 *
 * Не балансные числа (CLAUDE.md §1 сюда не относится) — просто адреса файлов и
 * их исходный размер. Из размера берётся только ПРОПОРЦИЯ: величина объекта в
 * мире задаётся отдельно (balance.props.sizes, render.enemySizeByTier).
 *
 * Отсутствующий файл не роняет игру: Sprites.get() вернёт undefined, и
 * вызывающий рисует запасную фигуру.
 */
export interface SpriteDef {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

export const SPRITES = { ...ART } as const satisfies Record<string, SpriteDef>;

export type SpriteId = keyof typeof SPRITES;

/** Есть ли такая картинка в таблице. Нужен там, где id приходит строкой. */
export function isSpriteId(id: string): id is SpriteId {
  return id in SPRITES;
}
