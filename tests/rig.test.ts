import { describe, it, expect } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { swingPhase } from '../src/juice/BodyAnim.ts';
import { rigPose, stroke, walkPhase } from '../src/juice/RigPose.ts';
import { DAMAGE_TYPES } from '../src/core/Combat.ts';
import type { DamageType } from '../src/core/BalanceTypes.ts';
import { KIKON_RIG, ODYSSEUS_RIG, WEAPON_KINDS, WEAPON_PARTS } from '../src/ui/rig/RigParts.ts';
import { SPRITES } from '../src/ui/AssetManifest.ts';
import { RARITY_ORDER } from '../src/player/Weapon.ts';

const balance = getBalance();
const rig = balance.anim.rig;
const period = 1 / balance.combat.baseAttackSpeed;

const STILL: { walk: number; moving: boolean; elapsed: number; type: DamageType } = {
  walk: 0, moving: false, elapsed: 0, type: 'slash',
};
// Меч — эталонный жест, от него отсчитываются два других (balance.anim.strokes).
const sword = stroke('slash');

/** Поза в момент, когда до следующего удара осталось `cooldown` секунд. */
function poseAt(cooldown: number, extra: Partial<typeof STILL> = {}) {
  const merged = { ...STILL, ...extra };
  return rigPose({
    swing: swingPhase(cooldown, stroke(merged.type).windupSec),
    ...merged,
  });
}

describe('rigPose — рука с оружием', () => {
  it('между ударами рука висит в покое', () => {
    // Середина периода: проводка догорела, замах ещё не начался.
    const pose = poseAt(period / 2);
    expect(pose.armMainDeg).toBeCloseTo(sword.restArmDeg, 6);
  });

  it('на замахе рука уходит назад, на контакте выбрасывается вперёд', () => {
    const windup = poseAt(0.02).armMainDeg;
    const contact = poseAt(period).armMainDeg;
    expect(windup).toBeLessThan(sword.restArmDeg);
    expect(contact).toBeGreaterThan(sword.restArmDeg);
    // Замах и проводка идут в разные стороны — иначе удара не видно.
    expect(contact - windup).toBeGreaterThan(sword.strikeArmDeg);
  });

  it('проводка затухает к покою, а не обрывается', () => {
    const at = (t: number) => poseAt(period - t).armMainDeg;
    expect(at(0)).toBeGreaterThan(at(balance.anim.strikeSec / 2));
    expect(at(balance.anim.strikeSec / 2)).toBeGreaterThan(at(balance.anim.strikeSec));
    expect(at(balance.anim.strikeSec)).toBeCloseTo(sword.restArmDeg, 6);
  });
});

describe('rigPose — жест зависит от типа оружия', () => {
  it('у каждого типа свой профиль удара', () => {
    for (const type of DAMAGE_TYPES) expect(stroke(type)).toBeDefined();
  });

  it('копьё колет, а не рубит: разворот руки меньше, выпад корпуса больше', () => {
    const spear = stroke('pierce');
    expect(Math.abs(spear.windupArmDeg)).toBeLessThan(Math.abs(sword.windupArmDeg));
    expect(spear.strikeArmDeg).toBeLessThan(sword.strikeArmDeg);
    expect(spear.lungeUnits).toBeGreaterThan(sword.lungeUnits);
    // След укола — короткая черта вдоль удара, а не полумесяц.
    expect(spear.arcSpanDeg).toBeLessThan(sword.arcSpanDeg / 2);
  });

  it('палица бьёт сверху: замах дольше и дальше за голову, выпад короче', () => {
    const club = stroke('crush');
    expect(club.windupArmDeg).toBeLessThan(sword.windupArmDeg);
    expect(club.windupSec).toBeGreaterThan(sword.windupSec);
    expect(club.lungeUnits).toBeLessThan(sword.lungeUnits);
    // Вес отыгрывается наклоном корпуса, раз не длиной выпада.
    expect(club.tiltDeg).toBeGreaterThan(sword.tiltDeg);
  });

  it('три типа дают три разные позы в один и тот же момент удара', () => {
    const angles = DAMAGE_TYPES.map((type) => poseAt(0.02, { type }).armMainDeg);
    expect(new Set(angles).size).toBe(DAMAGE_TYPES.length);
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
    const height = balance.render.playerSize;
    expect(walkPhase(0, height)).toBe(0);
    // Половина периода на шаг: пройдя ровно шаг, фигура меняет ногу.
    expect(walkPhase(height * rig.stepFraction, height)).toBeCloseTo(Math.PI, 6);
  });

  it('темп ходьбы человеческий, а не мелькающий', () => {
    // Шагов в секунду = скорость / длину шага. Прежняя формула давала здесь 24
    // при росте фигуры в 92 единицы — ноги мелькали вдесятеро быстрее живых.
    const height = balance.render.playerSize;
    const perSecond = walkPhase(balance.player.baseStats.moveSpeed, height) / Math.PI;
    expect(perSecond).toBeGreaterThan(2);
    expect(perSecond).toBeLessThan(3.5);
  });

  it('фигура пониже шагает чаще, а не так же: шаг мерится её ростом', () => {
    // Иначе кикон в 36 единиц перебирал бы ногами в темпе Одиссея в 92 и
    // читался бы не маленьким, а замедленным.
    const walked = 30;
    const small = walkPhase(walked, balance.render.enemySizeByTier.normal);
    const big = walkPhase(walked, balance.render.playerSize);
    expect(small).toBeGreaterThan(big);
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
    const roots = ODYSSEUS_RIG.bones.filter((bone) => bone.parent === null);
    expect(roots).toHaveLength(1);
    expect(roots[0]!.id).toBe('torso');
  });

  it('у каждой кости свой id: иначе порядок отрисовки молча перепутается', () => {
    const ids = ODYSSEUS_RIG.bones.map((bone) => bone.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('пивоты лежат внутри своих картинок', () => {
    const inside = (v: number) => v >= 0 && v <= 1;
    for (const bone of ODYSSEUS_RIG.bones) {
      expect(inside(bone.pivotX) && inside(bone.pivotY)).toBe(true);
      expect(inside(bone.socketX) && inside(bone.socketY)).toBe(true);
      expect(bone.height).toBeGreaterThan(0);
    }
    for (const part of Object.values(WEAPON_PARTS)) {
      expect(inside(part.pivotX) && inside(part.pivotY)).toBe(true);
    }
  });
});

describe('скелет врага', () => {
  it('у кикона тот же корень и те же кости, что у игрока, кроме плаща', () => {
    const player = new Set(ODYSSEUS_RIG.bones.map((b) => b.id));
    const enemy = new Set(KIKON_RIG.bones.map((b) => b.id));
    // Общий скелет — не экономия: враг обязан махать так же, как игрок, иначе
    // его удар весит меньше просто потому, что нарисован иначе.
    for (const id of enemy) expect(player.has(id)).toBe(true);
    expect(enemy.has('cloak')).toBe(false);
    expect(KIKON_RIG.bones.filter((b) => b.parent === null)).toHaveLength(1);
  });

  it('обе задние конечности помечены behind, иначе шаг не читается', () => {
    for (const rig of [ODYSSEUS_RIG, KIKON_RIG]) {
      const back = rig.bones.filter((b) => b.behind).map((b) => b.id);
      expect(back).toContain('legBack');
      expect(back).toContain('armOff');
    }
  });
});

describe('оружие по редкостям', () => {
  it('на каждый вид и каждую ступень есть деталь, и её спрайт объявлен', () => {
    for (const kind of WEAPON_KINDS) {
      for (const rarity of RARITY_ORDER) {
        const part = WEAPON_PARTS[`${kind}-${rarity}` as keyof typeof WEAPON_PARTS];
        expect(part, `нет детали ${kind}-${rarity}`).toBeDefined();
        expect(SPRITES[part.sprite], `спрайт ${part.sprite} не объявлен`).toBeDefined();
      }
    }
  });

  it('хват и длина зависят от вида, а не от ступени', () => {
    // Золотой ксифос держат за ту же рукоять, что и бронзовый. Разъехавшийся
    // пивот увёл бы оружие из кисти ровно на самой ценной находке игрока.
    for (const kind of WEAPON_KINDS) {
      const base = WEAPON_PARTS[kind];
      for (const rarity of RARITY_ORDER) {
        const part = WEAPON_PARTS[`${kind}-${rarity}` as keyof typeof WEAPON_PARTS];
        expect(part.pivotX).toBe(base.pivotX);
        expect(part.pivotY).toBe(base.pivotY);
        expect(part.height).toBe(base.height);
      }
    }
  });

  it('у базовой детали каждого вида есть запасной спрайт без ступени', () => {
    // Пока картинки ступени нет, Figures.handWeapon откатывается сюда:
    // пустой кулак хуже чужого силуэта.
    for (const kind of WEAPON_KINDS) {
      expect(WEAPON_PARTS[kind]).toBeDefined();
      expect(SPRITES[WEAPON_PARTS[kind].sprite]).toBeDefined();
    }
  });
});
