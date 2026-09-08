// СГЕНЕРИРОВАНО: node tools/gen-art-code.mjs. Руками не править.
// Числа бумажной куклы, посчитанные фабрикой ассетов из самой модели.
// Пивот кости — спроецированное начало её координат, сокет — сустав в долях
// картинки торса, height — доля роста фигуры. Скрепляет их ui/rig/RigParts.ts.
import type { SpriteId } from '../AssetManifest.ts';

export interface RigBoneSpec {
  readonly id: string;
  readonly sprite: SpriteId;
  readonly pivotX: number;
  readonly pivotY: number;
  readonly height: number;
  readonly socketX: number;
  readonly socketY: number;
  readonly parent: 'torso' | null;
  readonly behind: boolean;
}

export interface RigSpec {
  readonly bones: readonly RigBoneSpec[];
  readonly handX: number;
  readonly handY: number;
}

export interface WeaponSpec {
  readonly sprite: SpriteId;
  readonly pivotX: number;
  readonly pivotY: number;
  readonly height: number;
}

export const RIGS = {
  'kikon': {
    bones: [
      { id: 'legBack', sprite: 'kikon-legBack', pivotX: 0.5, pivotY: 0.0765, height: 0.437, socketX: 0.6855, socketY: 0.8873, parent: 'torso', behind: true },
      { id: 'armOff', sprite: 'kikon-armOff', pivotX: 0.5, pivotY: 0.1724, height: 0.4, socketX: 1.0997, socketY: 0.4443, parent: 'torso', behind: true },
      { id: 'torso', sprite: 'kikon-torso', pivotX: 0.5, pivotY: 1.4485, height: 0.6741, socketX: 0.5, socketY: 1, parent: null, behind: false },
      { id: 'legFront', sprite: 'kikon-legFront', pivotX: 0.5, pivotY: 0.0765, height: 0.437, socketX: 0.3145, socketY: 0.9111, parent: 'torso', behind: false },
      { id: 'armMain', sprite: 'kikon-armMain', pivotX: 0.5, pivotY: 0.1724, height: 0.4, socketX: -0.0997, socketY: 0.4681, parent: 'torso', behind: false },
    ],
    handX: 0.5, handY: 0.9747,
  },
  'kikon-chief': {
    bones: [
      { id: 'cloak', sprite: 'kikon-chief-cloak', pivotX: 0.5, pivotY: 0.0812, height: 0.5212, socketX: 0.5, socketY: 0.4525, parent: 'torso', behind: false },
      { id: 'legBack', sprite: 'kikon-chief-legBack', pivotX: 0.5, pivotY: 0.0794, height: 0.3923, socketX: 0.6569, socketY: 0.8994, parent: 'torso', behind: true },
      { id: 'armOff', sprite: 'kikon-chief-armOff', pivotX: 0.5, pivotY: 0.1694, height: 0.3577, socketX: 1.0072, socketY: 0.5307, parent: 'torso', behind: true },
      { id: 'torso', sprite: 'kikon-chief-torso', pivotX: 0.5, pivotY: 1.3666, height: 0.7269, socketX: 0.5, socketY: 1, parent: null, behind: false },
      { id: 'legFront', sprite: 'kikon-chief-legFront', pivotX: 0.5, pivotY: 0.0794, height: 0.3923, socketX: 0.3431, socketY: 0.9192, parent: 'torso', behind: false },
      { id: 'armMain', sprite: 'kikon-chief-armMain', pivotX: 0.5, pivotY: 0.1694, height: 0.3577, socketX: -0.0072, socketY: 0.5504, parent: 'torso', behind: false },
    ],
    handX: 0.5, handY: 0.9749,
  },
  'kikon-elite': {
    bones: [
      { id: 'legBack', sprite: 'kikon-elite-legBack', pivotX: 0.5, pivotY: 0.0763, height: 0.4333, socketX: 0.6757, socketY: 0.8881, parent: 'torso', behind: true },
      { id: 'armOff', sprite: 'kikon-elite-armOff', pivotX: 0.5, pivotY: 0.1709, height: 0.3967, socketX: 1.068, socketY: 0.4536, parent: 'torso', behind: true },
      { id: 'torso', sprite: 'kikon-elite-torso', pivotX: 0.5, pivotY: 1.4386, height: 0.6833, socketX: 0.5, socketY: 1, parent: null, behind: false },
      { id: 'legFront', sprite: 'kikon-elite-legFront', pivotX: 0.5, pivotY: 0.0763, height: 0.4333, socketX: 0.3243, socketY: 0.9114, parent: 'torso', behind: false },
      { id: 'armMain', sprite: 'kikon-elite-armMain', pivotX: 0.5, pivotY: 0.1709, height: 0.3967, socketX: -0.068, socketY: 0.4769, parent: 'torso', behind: false },
    ],
    handX: 0.5, handY: 0.9755,
  },
  'odysseus': {
    bones: [
      { id: 'cloak', sprite: 'odysseus-cloak', pivotX: 0.5, pivotY: 0.0816, height: 0.5813, socketX: 0.5, socketY: 0.3499, parent: 'torso', behind: false },
      { id: 'legBack', sprite: 'odysseus-legBack', pivotX: 0.5, pivotY: 0.0777, height: 0.4375, socketX: 0.6767, socketY: 0.8863, parent: 'torso', behind: true },
      { id: 'armOff', sprite: 'odysseus-armOff', pivotX: 0.5, pivotY: 0.1717, height: 0.4, socketX: 1.0714, socketY: 0.4437, parent: 'torso', behind: true },
      { id: 'torso', sprite: 'odysseus-torso', pivotX: 0.5, pivotY: 1.4469, height: 0.675, socketX: 0.5, socketY: 1, parent: null, behind: false },
      { id: 'legFront', sprite: 'odysseus-legFront', pivotX: 0.5, pivotY: 0.0777, height: 0.4375, socketX: 0.3233, socketY: 0.91, parent: 'torso', behind: false },
      { id: 'armMain', sprite: 'odysseus-armMain', pivotX: 0.5, pivotY: 0.1717, height: 0.4, socketX: -0.0714, socketY: 0.4674, parent: 'torso', behind: false },
    ],
    handX: 0.5, handY: 0.9744,
  },
} as const satisfies Record<string, RigSpec>;

export const WEAPONS = {
  'weapon-club-common': { sprite: 'weapon-club-common', pivotX: 0.5, pivotY: 0.9447, height: 0.4063 },
  'weapon-club-epic': { sprite: 'weapon-club-epic', pivotX: 0.5059, pivotY: 0.9447, height: 0.4063 },
  'weapon-club-legendary': { sprite: 'weapon-club-legendary', pivotX: 0.5197, pivotY: 0.9447, height: 0.4063 },
  'weapon-club-rare': { sprite: 'weapon-club-rare', pivotX: 0.5139, pivotY: 0.9447, height: 0.4063 },
  'weapon-club-uncommon': { sprite: 'weapon-club-uncommon', pivotX: 0.5012, pivotY: 0.9447, height: 0.4063 },
  'weapon-spear-common': { sprite: 'weapon-spear-common', pivotX: 0.5, pivotY: 0.7915, height: 1.0719 },
  'weapon-spear-epic': { sprite: 'weapon-spear-epic', pivotX: 0.5, pivotY: 0.7984, height: 1.1125 },
  'weapon-spear-legendary': { sprite: 'weapon-spear-legendary', pivotX: 0.5, pivotY: 0.8, height: 1.1281 },
  'weapon-spear-rare': { sprite: 'weapon-spear-rare', pivotX: 0.5, pivotY: 0.7959, height: 1.1 },
  'weapon-spear-uncommon': { sprite: 'weapon-spear-uncommon', pivotX: 0.5, pivotY: 0.7933, height: 1.0875 },
  'weapon-sword-common': { sprite: 'weapon-sword-common', pivotX: 0.5, pivotY: 0.9358, height: 0.4719 },
  'weapon-sword-epic': { sprite: 'weapon-sword-epic', pivotX: 0.5, pivotY: 0.9428, height: 0.5531 },
  'weapon-sword-legendary': { sprite: 'weapon-sword-legendary', pivotX: 0.5, pivotY: 0.9439, height: 0.5813 },
  'weapon-sword-rare': { sprite: 'weapon-sword-rare', pivotX: 0.5, pivotY: 0.9416, height: 0.525 },
  'weapon-sword-uncommon': { sprite: 'weapon-sword-uncommon', pivotX: 0.5, pivotY: 0.9402, height: 0.4969 },
} as const satisfies Record<string, WeaponSpec>;
