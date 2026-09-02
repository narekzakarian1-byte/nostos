import { getBalance } from '../../core/Balance.ts';
import { degToRad } from '../../juice/Ease.ts';
import type { RigPose } from '../../juice/RigPose.ts';
import { SPRITES } from '../AssetManifest.ts';
import { sprites } from '../Sprites.ts';
import {
  HAND_SOCKET_X,
  HAND_SOCKET_Y,
  ODYSSEUS_RIG,
  WEAPON_PARTS,
  type Bone,
  type BoneId,
  type WeaponPartId,
} from './RigParts.ts';

/**
 * Отрисовка бумажной куклы. Рисует в той же локальной системе координат, в
 * которой раньше лежала одна картинка игрока: коробка size×size с центром в
 * нуле. Поэтому выпад, наклон, сплющивание и распад из Body.ts продолжают
 * работать поверх рига, ничего не зная о костях.
 */
export interface RigDraw {
  readonly size: number;
  readonly pose: RigPose;
  readonly weapon: WeaponPartId | null;
  /** Залить силуэт цветом вместо текстуры — этим рисуется вспышка попадания. */
  readonly tint?: string;
}

interface PartRect {
  readonly w: number;
  readonly h: number;
}

const TORSO = ODYSSEUS_RIG.find((bone) => bone.parent === null) as Bone;

/** Пока хоть одной детали нет, звать риг нельзя — Body.ts рисует цельный спрайт. */
export function rigReady(): boolean {
  if (!sprites.get(TORSO.sprite)) return false;
  return ODYSSEUS_RIG.every((bone) => sprites.get(bone.sprite) !== undefined);
}

export function weaponReady(id: WeaponPartId): boolean {
  return sprites.get(WEAPON_PARTS[id].sprite) !== undefined;
}

export function drawRig(ctx: CanvasRenderingContext2D, draw: RigDraw): void {
  const { size } = draw;
  const torsoRect = rectOf(TORSO, size);

  for (const bone of ODYSSEUS_RIG) {
    ctx.save();
    // Кадр торса: его пивот встаёт в точку коробки фигуры.
    ctx.translate((TORSO.socketX - 0.5) * size, (TORSO.socketY - 0.5) * size);

    if (bone.parent !== null) {
      ctx.translate(
        (bone.socketX - TORSO.pivotX) * torsoRect.w,
        (bone.socketY - TORSO.pivotY) * torsoRect.h,
      );
      // Подъём ноги идёт до поворота: иначе шаг превращается в подскок вбок.
      ctx.translate(0, -liftOf(bone.id, draw.pose));
      ctx.rotate(degToRad(angleOf(bone.id, draw.pose)));
    }

    const rect = rectOf(bone, size);
    drawPart(ctx, bone, rect, draw);
    if (bone.id === 'armMain') drawWeapon(ctx, rect, draw);
    ctx.restore();
  }
}

/**
 * Оружие рисуется внутри кадра ведущей руки, а не отдельной костью. Поэтому
 * любой предмет, положенный в сокет кисти, машется вместе с рукой сам, без
 * своей анимации, — ради этого куклу и резали на части.
 */
function drawWeapon(ctx: CanvasRenderingContext2D, armRect: PartRect, draw: RigDraw): void {
  if (draw.weapon === null) return;
  const part = WEAPON_PARTS[draw.weapon];
  const img = sprites.get(part.sprite);
  if (!img) return;

  const arm = ODYSSEUS_RIG.find((bone) => bone.id === 'armMain');
  if (!arm) return;

  ctx.save();
  ctx.translate(
    (HAND_SOCKET_X - arm.pivotX) * armRect.w,
    (HAND_SOCKET_Y - arm.pivotY) * armRect.h,
  );
  ctx.rotate(degToRad(draw.pose.weaponDeg));

  const h = part.height * draw.size;
  const def = SPRITES[part.sprite];
  const w = h * (def.width / def.height);
  stamp(ctx, part.sprite, -part.pivotX * w, -part.pivotY * h, w, h, draw.tint);
  ctx.restore();
}

function drawPart(
  ctx: CanvasRenderingContext2D,
  bone: Bone,
  rect: PartRect,
  draw: RigDraw,
): void {
  const x = -bone.pivotX * rect.w;
  const y = -bone.pivotY * rect.h;
  stamp(ctx, bone.sprite, x, y, rect.w, rect.h, draw.tint);

  // Задняя конечность притемняется силуэтом поверх себя же: без этого она
  // сливается с передней и шаг перестаёт читаться.
  if (bone.behind && draw.tint === undefined) {
    const { backLimbShade } = getBalance().anim.rig;
    const shade = sprites.silhouette(bone.sprite, '#000000');
    if (shade) {
      const before = ctx.globalAlpha;
      ctx.globalAlpha = before * (1 - backLimbShade);
      ctx.drawImage(shade, x, y, rect.w, rect.h);
      ctx.globalAlpha = before;
    }
  }
}

/** Текстура или её одноцветный отпечаток — второе для вспышки попадания. */
function stamp(
  ctx: CanvasRenderingContext2D,
  sprite: Bone['sprite'],
  x: number,
  y: number,
  w: number,
  h: number,
  tint: string | undefined,
): void {
  const source = tint === undefined ? sprites.get(sprite) : sprites.silhouette(sprite, tint);
  if (source) ctx.drawImage(source, x, y, w, h);
}

function rectOf(bone: Bone, size: number): PartRect {
  const def = SPRITES[bone.sprite];
  const h = bone.height * size;
  return { w: h * (def.width / def.height), h };
}

function angleOf(id: BoneId, pose: RigPose): number {
  switch (id) {
    case 'armMain':
      return pose.armMainDeg;
    case 'armOff':
      return pose.armOffDeg;
    case 'legFront':
      return pose.legFrontDeg;
    case 'legBack':
      return pose.legBackDeg;
    case 'cloak':
      return pose.cloakDeg;
    default:
      return 0;
  }
}

function liftOf(id: BoneId, pose: RigPose): number {
  if (id === 'legFront') return pose.liftFront;
  if (id === 'legBack') return pose.liftBack;
  return 0;
}
