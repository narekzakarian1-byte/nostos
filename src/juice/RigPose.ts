import { getBalance } from '../core/Balance.ts';
import type { DamageType, WeaponStroke } from '../core/BalanceTypes.ts';
import type { SwingPhase } from './BodyAnim.ts';
import { easeInQuad, easeOutCubic } from './Ease.ts';

/** Жест типа оружия. Всё, что зависит от того, чем именно бьют. */
export function stroke(type: DamageType): WeaponStroke {
  return getBalance().anim.strokes[type];
}

/**
 * Поза бумажной куклы: углы всех костей в градусах.
 *
 * Своих часов здесь нет намеренно — ровно по той же причине, по которой их нет
 * у swingPhase. Замах берётся из счётчика удара, шаг из пройденного пути, ветер
 * из накопленного времени фиксированного тика. Любая из этих величин уже
 * детерминирована по сиду, значит и поза детерминирована, а hitstop морозит её
 * вместе с миром.
 *
 * О канвасе не знает: наружу отдаёт только числа, рисует ui/rig/DrawRig.ts.
 */
export interface RigPoseInput {
  readonly swing: SwingPhase;
  /** Чем бьют прямо сейчас — от типа зависит весь жест руки. */
  readonly type: DamageType;
  /** Фаза шага в радианах. Считается из пути, а не из времени. */
  readonly walk: number;
  readonly moving: boolean;
  /** Накопленное игровое время, секунды. Только для ветра в плаще. */
  readonly elapsed: number;
}

export interface RigPose {
  readonly armMainDeg: number;
  readonly armOffDeg: number;
  readonly legFrontDeg: number;
  readonly legBackDeg: number;
  readonly cloakDeg: number;
  readonly weaponDeg: number;
  /** Подъём ноги над землёй в единицах мира. */
  readonly liftFront: number;
  readonly liftBack: number;
}

/**
 * Фаза шага. Та же формула, что у покачивания корпуса в Figures.ts, и это не
 * дублирование, а единственный источник: если ноги пойдут по своей частоте,
 * шаг разойдётся с покачиванием и фигура начнёт «плыть».
 */
export function walkPhase(walked: number): number {
  return walked * getBalance().ui.walkBobHz * 0.1;
}

export function rigPose(input: RigPoseInput): RigPose {
  const { rig } = getBalance().anim;
  const hand = stroke(input.type);
  const swingDeg = armSwingDeg(input.swing, hand);
  // sin шага, погашенный на месте: стоя игрок не перебирает ногами.
  const step = input.moving ? Math.sin(input.walk) : 0;
  const wind = Math.sin(input.elapsed * rig.cloakWindHz * Math.PI * 2);

  return {
    // Рука с оружием: замах поверх ходьбы. Складываются, а не выбирают одно из
    // двух, — иначе на бегу удар выглядит как подмена картинки.
    armMainDeg: hand.restArmDeg + swingDeg + step * rig.walkArmDeg,
    // Задняя рука идёт в противофазу: так шаг читается даже когда ног не видно.
    armOffDeg: rig.offArmDeg - step * rig.walkArmDeg,
    legFrontDeg: step * rig.walkLegDeg,
    legBackDeg: -step * rig.walkLegDeg,
    // Плащ отстаёт от корпуса на четверть периода и всегда живёт от ветра,
    // даже когда игрок стоит.
    cloakDeg: -step * rig.cloakWalkDeg + wind * rig.cloakWindDeg,
    weaponDeg: hand.weaponGripDeg,
    liftFront: rig.walkLiftUnits * Math.max(0, step),
    liftBack: rig.walkLiftUnits * Math.max(0, -step),
  };
}

/**
 * Угол руки от удара. Форма повторяет swingPush один в один: рука отводится
 * назад на замахе и выбрасывается вперёд в момент контакта. Две разные кривые
 * здесь развели бы оружие и выпад корпуса — удар перестал бы читаться как один
 * жест. Амплитуды берутся из профиля типа: у копья разворот почти нулевой,
 * у палицы рука уходит за голову.
 */
function armSwingDeg(phase: SwingPhase, hand: WeaponStroke): number {
  return (
    hand.strikeArmDeg * (1 - easeOutCubic(phase.strike)) +
    hand.windupArmDeg * easeInQuad(phase.windup)
  );
}
