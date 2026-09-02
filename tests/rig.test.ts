import { describe, it, expect } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { swingPhase } from '../src/juice/BodyAnim.ts';
import { rigPose, walkPhase } from '../src/juice/RigPose.ts';
import { ODYSSEUS_RIG, WEAPON_PARTS } from '../src/ui/rig/RigParts.ts';

const balance = getBalance();
const rig = balance.anim.rig;
const period = 1 / balance.combat.baseAttackSpeed;

const STILL = { walk: 0, moving: false, elapsed: 0 };

/** Поза в момент, когда до следующего удара осталось `cooldown` секунд. */
function poseAt(cooldown: number, extra: Partial<typeof STILL> = {}) {
  return rigPose({
    swing: swingPhase(cooldown, balance.anim.windupSec),
    ...STILL,
    ...extra,
  });
}

describe('rigPose — рука с оружием', () => {
  it('между ударами рука висит в покое', () => {
    // Середина периода: проводка догорела, замах ещё не начался.
    const pose = poseAt(period / 2);
    expect(pose.armMainDeg).toBeCloseTo(rig.restArmDeg, 6);
  });

  it('на замахе рука уходит назад, на контакте выбрасывается вперёд', () => {
    const windup = poseAt(0.02).armMainDeg;
    const contact = poseAt(period).armMainDeg;
    expect(windup).toBeLessThan(rig.restArmDeg);
    expect(contact).toBeGreaterThan(rig.restArmDeg);
    // Замах и проводка идут в разные стороны — иначе удара не видно.
    expect(contact - windup).toBeGreaterThan(rig.strikeArmDeg);
  });

  it('проводка затухает к покою, а не обрывается', () => {
    const at = (t: number) => poseAt(period - t).armMainDeg;
    expect(at(0)).toBeGreaterThan(at(balance.anim.strikeSec / 2));
    expect(at(balance.anim.strikeSec / 2)).toBeGreaterThan(at(balance.anim.strikeSec));
    expect(at(balance.anim.strikeSec)).toBeCloseTo(rig.restArmDeg, 6);
  });
});

describe('rigPose — шаг', () => {
  it('на месте ноги стоят ровно', () => {
    const pose = poseAt(period / 2, { walk: 1.2, moving: false });
    expect(pose.legFrontDeg).toBeCloseTo(0, 10);
    expect(pose.legBackDeg).toBeCloseTo(0, 10);
    expect(pose.liftFront).toBeCloseTo(0, 10);
  });

  it('ноги идут в противофазе, иначе фигура прыгает двумя ногами разом', () => {
    const pose = poseAt(period / 2, { walk: Math.PI / 2, moving: true });
    expect(pose.legFrontDeg).toBeCloseTo(rig.walkLegDeg, 6);
    expect(pose.legBackDeg).toBeCloseTo(-rig.walkLegDeg, 6);
  });

  it('свободная рука противоходит ведущей ноге', () => {
    const pose = poseAt(period / 2, { walk: Math.PI / 2, moving: true });
    expect(pose.armOffDeg).toBeCloseTo(rig.offArmDeg - rig.walkArmDeg, 6);
  });

  it('фаза шага берётся из пути, а не из времени: стоя она не растёт', () => {
    expect(walkPhase(0)).toBe(0);
    expect(walkPhase(10)).toBeCloseTo(10 * balance.ui.walkBobHz * 0.1, 6);
  });
});

describe('rigPose — плащ', () => {
  it('живёт от ветра даже когда игрок стоит', () => {
    // Четверть периода ветра — синус на максимуме.
    const quarter = 1 / (rig.cloakWindHz * 4);
    const pose = poseAt(period / 2, { elapsed: quarter });
    expect(pose.cloakDeg).toBeCloseTo(rig.cloakWindDeg, 6);
  });
});

describe('rigPose — детерминизм', () => {
  it('одинаковый вход даёт одинаковую позу', () => {
    const a = poseAt(0.1, { walk: 2.5, moving: true, elapsed: 7.25 });
    const b = poseAt(0.1, { walk: 2.5, moving: true, elapsed: 7.25 });
    expect(a).toEqual(b);
  });
});

describe('скелет', () => {
  it('ровно один корень, остальные кости висят на нём', () => {
    const roots = ODYSSEUS_RIG.filter((bone) => bone.parent === null);
    expect(roots).toHaveLength(1);
    expect(roots[0]!.id).toBe('torso');
  });

  it('у каждой кости свой id: иначе порядок отрисовки молча перепутается', () => {
    const ids = ODYSSEUS_RIG.map((bone) => bone.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('пивоты лежат внутри своих картинок', () => {
    const inside = (v: number) => v >= 0 && v <= 1;
    for (const bone of ODYSSEUS_RIG) {
      expect(inside(bone.pivotX) && inside(bone.pivotY)).toBe(true);
      expect(inside(bone.socketX) && inside(bone.socketY)).toBe(true);
      expect(bone.height).toBeGreaterThan(0);
    }
    for (const part of Object.values(WEAPON_PARTS)) {
      expect(inside(part.pivotX) && inside(part.pivotY)).toBe(true);
    }
  });
});
