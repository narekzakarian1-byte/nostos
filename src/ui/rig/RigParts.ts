import type { SpriteId } from '../AssetManifest.ts';

/**
 * Скелет бумажной куклы: из каких деталей собран Одиссей и как они скреплены.
 *
 * Это не балансные числа (CLAUDE.md §1 сюда не относится, как и к
 * AssetManifest.ts) — это метрика конкретных PNG. Пивот привязан к пикселям
 * картинки: перерисовали деталь — правится здесь, а не в balance.json. Углы,
 * которыми кости шевелятся, наоборот, лежат в balance.anim.rig.
 *
 * Все координаты — доли, не пиксели. Тогда риг переживает и замену деталей на
 * другое разрешение, и любой размер фигуры на экране.
 */
export type BoneId =
  | 'cloak'
  | 'legBack'
  | 'armOff'
  | 'torso'
  | 'legFront'
  | 'armMain'
  | 'weapon';

export interface Bone {
  readonly id: BoneId;
  readonly sprite: SpriteId;
  /** Точка вращения внутри своей картинки: доли её ширины и высоты. */
  readonly pivotX: number;
  readonly pivotY: number;
  /** Рост детали в долях роста всей фигуры. Ширина следует из пропорции PNG. */
  readonly height: number;
  /**
   * Куда садится пивот. У торса — доли коробки фигуры, у остальных — доли
   * картинки родителя. Одна система на оба случая: родитель у торса это сама
   * коробка.
   */
  readonly socketX: number;
  readonly socketY: number;
  readonly parent: BoneId | null;
  /** Задняя конечность: притемняется, иначе сливается с передней. */
  readonly behind: boolean;
}

/**
 * Порядок в массиве — порядок отрисовки, от дальнего к ближнему. Плащ уходит
 * за спину, задние конечности прячутся за торс, оружие ложится поверх кисти.
 */
export const ODYSSEUS_RIG: readonly Bone[] = [
  {
    id: 'cloak',
    sprite: 'odysseus-cloak',
    pivotX: 0.5, pivotY: 0.05,
    height: 0.62,
    socketX: 0.5, socketY: 0.38,
    parent: 'torso',
    behind: false,
  },
  {
    id: 'legBack',
    sprite: 'odysseus-leg',
    pivotX: 0.5, pivotY: 0.04,
    height: 0.38,
    socketX: 0.68, socketY: 0.88,
    parent: 'torso',
    behind: true,
  },
  {
    id: 'armOff',
    sprite: 'odysseus-arm',
    pivotX: 0.5, pivotY: 0.06,
    height: 0.4,
    socketX: 0.885, socketY: 0.42,
    parent: 'torso',
    behind: true,
  },
  {
    id: 'torso',
    sprite: 'odysseus-torso',
    pivotX: 0.5, pivotY: 0.0,
    height: 0.72,
    socketX: 0.5, socketY: 0.02,
    parent: null,
    behind: false,
  },
  {
    id: 'legFront',
    sprite: 'odysseus-leg',
    pivotX: 0.5, pivotY: 0.04,
    height: 0.38,
    socketX: 0.32, socketY: 0.88,
    parent: 'torso',
    behind: false,
  },
  {
    id: 'armMain',
    sprite: 'odysseus-arm',
    pivotX: 0.5, pivotY: 0.06,
    height: 0.4,
    socketX: 0.115, socketY: 0.45,
    parent: 'torso',
    behind: false,
  },
];

/**
 * Оружие. Отдельно от скелета, потому что меняется в игре: любой предмет,
 * попавший в сокет кисти, начинает махаться сам — ровно ради этого куклу и
 * резали. Пивот — середина рукояти, socket — кулак на картинке руки.
 */
export interface WeaponPart {
  readonly sprite: SpriteId;
  readonly pivotX: number;
  readonly pivotY: number;
  readonly height: number;
}

export const HAND_SOCKET_X = 0.48;
export const HAND_SOCKET_Y = 0.86;

export const WEAPON_PARTS = {
  sword: { sprite: 'odysseus-sword', pivotX: 0.5, pivotY: 0.84, height: 0.4 },
  spear: { sprite: 'odysseus-spear', pivotX: 0.5, pivotY: 0.76, height: 0.95 },
} as const satisfies Record<string, WeaponPart>;

export type WeaponPartId = keyof typeof WEAPON_PARTS;
