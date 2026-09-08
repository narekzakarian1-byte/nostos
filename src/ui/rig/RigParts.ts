import { RIGS, WEAPONS, type RigBoneSpec } from './RigTable.ts';
import type { SpriteId } from '../AssetManifest.ts';

/**
 * Скелет бумажной куклы: из каких деталей собрана фигура и как они скреплены.
 *
 * Сами ЧИСЛА лежат в RigTable.ts и пишутся генератором, потому что они не
 * подбираются, а считаются: пивот кости — это спроецированное начало её
 * координат в модели, сокет — сустав, ростовая доля — отношение экранных
 * высот (art/blender/lib/rig.py). Раньше здесь стояли выписанные руками доли
 * под нарисованные PNG, и каждая перерисовка детали означала подгонку
 * пивота по пикселям.
 *
 * Здесь остаётся то, что числами не является: какие кости бывают, в каком
 * порядке они рисуются и как связаны вид оружия с хватом. Углы, которыми
 * кости шевелятся, лежат в balance.anim.rig и balance.anim.strokes.
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
   * картинки торса. Одна система на оба случая: родитель у торса это сама
   * коробка.
   */
  readonly socketX: number;
  readonly socketY: number;
  readonly parent: BoneId | null;
  /** Задняя конечность: притемняется, иначе сливается с передней. */
  readonly behind: boolean;
}

/** Скелет фигуры вместе с сокетом кисти: всё, что нужно, чтобы её собрать. */
export interface Rig {
  readonly bones: readonly Bone[];
  /** Куда садится оружие внутри картинки ведущей руки. */
  readonly handX: number;
  readonly handY: number;
}

export type FigureId = keyof typeof RIGS;

/**
 * Порядок костей в таблице — порядок отрисовки, от дальнего к ближнему: плащ
 * уходит за спину, задние конечности прячутся за торс, оружие ложится поверх
 * кисти ведущей руки. Задаёт его фабрика (art/blender/assets/*.py), потому что
 * там же решается, какая конечность ближе к камере.
 */
function rigOf(id: FigureId): Rig {
  const spec = RIGS[id];
  return {
    bones: spec.bones.map((bone: RigBoneSpec) => ({ ...bone, id: bone.id as BoneId })),
    handX: spec.handX,
    handY: spec.handY,
  };
}

export const ODYSSEUS_RIG: Rig = rigOf('odysseus');

/**
 * Киконы Исмары тремя тирами. Не один риг на остров: рядовой, элита и вождь
 * отличаются шлемом, панцирем и плащом (ISLANDS.md §1.5), и общий набор
 * деталей стёр бы всю эскалацию — на арене стоял бы увеличенный рядовой.
 */
export const KIKON_RIG: Rig = rigOf('kikon');
export const KIKON_ELITE_RIG: Rig = rigOf('kikon-elite');
export const KIKON_CHIEF_RIG: Rig = rigOf('kikon-chief');

export interface WeaponPart {
  readonly sprite: SpriteId;
  readonly pivotX: number;
  readonly pivotY: number;
  readonly height: number;
}

export const WEAPON_PARTS = WEAPONS;
export type WeaponPartId = keyof typeof WEAPON_PARTS;

/** Вид оружия. Хват и длина зависят от вида, а не от редкости: золотой ксифос
 *  держат за ту же рукоять, что и бронзовый, — поэтому пивот считает фабрика
 *  по самой модели, а здесь остаётся только перечень видов. */
export const WEAPON_KINDS = ['sword', 'spear', 'club'] as const;
export type WeaponKind = (typeof WEAPON_KINDS)[number];
