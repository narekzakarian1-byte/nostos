import { describe, it, expect } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import {
  armorDefense,
  attackRatio,
  bestType,
  critFactor,
  damageMultiplier,
  damagePerHit,
  effectiveMaxHp,
  hitDamage,
  incomingDps,
  totalDps,
  weaponAttack,
} from '../src/core/Combat.ts';
import { Stats } from '../src/core/Stats.ts';
import { Weapon, startingWeapons } from '../src/player/Weapon.ts';
import { startingArmor } from '../src/player/Armor.ts';

const balance = getBalance();

// Множитель зависит только от отношения атаки к защите, поэтому опорные значения
// проверяются на защите 100 и подобранной под неё атаке.
function multiplierAtRatio(ratio: number): number {
  const def = 100;
  return damageMultiplier(ratio * def, def);
}

describe('Combat — формула размена', () => {
  it('опорная таблица CLAUDE.md при typeExponent = 1.5', () => {
    expect(balance.combat.typeExponent).toBe(1.5);
    expect(multiplierAtRatio(0.5)).toBeCloseTo(0.26, 2);
    expect(multiplierAtRatio(1.0)).toBe(0.5);
    expect(multiplierAtRatio(2.0)).toBeCloseTo(0.74, 2);
    expect(multiplierAtRatio(3.0)).toBeCloseTo(0.84, 2);
  });

  it('множитель монотонно растёт по отношению атака/защита', () => {
    const ratios = [0.25, 0.5, 1, 1.5, 2, 3, 5];
    const values = ratios.map(multiplierAtRatio);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]!);
    }
  });

  it('множитель зажат в damageFloor и damageCeil', () => {
    const { damageFloor, damageCeil } = balance.combat;
    expect(damageMultiplier(1, 100000)).toBe(damageFloor);
    expect(damageMultiplier(100000, 1)).toBe(damageCeil);
  });

  it('защита ниже единицы не даёт деления на ноль', () => {
    expect(attackRatio(10, 0)).toBe(10);
    expect(Number.isFinite(damagePerHit(10, 0))).toBe(true);
  });

  it('урон за удар — это атака, умноженная на множитель', () => {
    expect(damagePerHit(50, 25)).toBeCloseTo(50 * damageMultiplier(50, 25), 10);
  });
});

describe('Combat — оружие множит стат', () => {
  it('множитель оружия входит в атаку сомножителем, а не слагаемым', () => {
    const stats = new Stats();
    const common = new Weapon('pierce');
    const rare = new Weapon('pierce', 'rare');
    const base = stats.atk('pierce');

    expect(weaponAttack(stats, 'pierce', common)).toBeCloseTo(base * 1.0, 10);
    expect(weaponAttack(stats, 'pierce', rare)).toBeCloseTo(
      base * balance.weapons.rarityMult.rare,
      10,
    );
  });

  it('уровень 30 даёт ровно 1 + levelStep * 29', () => {
    const weapon = new Weapon('slash', 'common', 30);
    expect(weapon.multiplier).toBeCloseTo(1 + balance.weapons.levelStep * 29, 10);
  });

  it('прокачка с 1 до 30 уровня растит DPS не меньше чем втрое', () => {
    // Автопроверка 6 из SPEC.md §6: защита от возврата к аддитивной модели.
    const stats = new Stats();
    const enemyDef = { pierce: 20, slash: 20, crush: 20 };
    const level = (n: number) => ({
      pierce: new Weapon('pierce', 'uncommon', n),
      slash: new Weapon('slash', 'uncommon', n),
      crush: new Weapon('crush', 'uncommon', n),
    });

    const low = totalDps(stats, level(1), enemyDef);
    const high = totalDps(stats, level(30), enemyDef);
    expect(high / low).toBeGreaterThanOrEqual(3);
  });
});

describe('Combat — суммарный DPS', () => {
  it('складывает три типа и умножает на скорость атаки и крит', () => {
    const stats = new Stats();
    const weapons = startingWeapons();
    const enemyDef = { pierce: 3, slash: 6, crush: 12 };

    const expected =
      damagePerHit(weaponAttack(stats, 'pierce', weapons.pierce), enemyDef.pierce) +
      damagePerHit(weaponAttack(stats, 'slash', weapons.slash), enemyDef.slash) +
      damagePerHit(weaponAttack(stats, 'crush', weapons.crush), enemyDef.crush);

    expect(hitDamage(stats, weapons, enemyDef)).toBeCloseTo(expected, 10);
    expect(totalDps(stats, weapons, enemyDef)).toBeCloseTo(
      expected * balance.combat.baseAttackSpeed * critFactor(stats),
      10,
    );
  });

  it('при нулевом крите множитель крита равен единице', () => {
    const stats = new Stats();
    expect(stats.critChance).toBe(0);
    expect(critFactor(stats)).toBe(1);
  });

  it('крит поднимает DPS, уклонение срезает входящий урон', () => {
    const stats = new Stats();
    const weapons = startingWeapons();
    const enemyDef = { pierce: 6, slash: 6, crush: 6 };
    const before = totalDps(stats, weapons, enemyDef);

    stats.set('crit', 480); // ровно kCrit: половина от critCap
    expect(stats.critChance).toBeCloseTo(balance.statConversion.critCap / 2, 10);
    expect(totalDps(stats, weapons, enemyDef)).toBeGreaterThan(before);

    stats.set('dodge', 110); // ровно kDodge: половина от dodgeCap
    const armor = startingArmor();
    // Защита ровно равна урону врага: множитель 0.5, дальше срезает уклонение.
    stats.set('pierceDef', 100);
    expect(incomingDps(100, 'pierce', stats, armor))
      .toBeCloseTo(50 * (1 - balance.statConversion.dodgeCap / 2), 10);
  });
});

describe('Combat — броня как второй множитель (BALANCE.md §7.5)', () => {
  it('броня множит защиту и срезает входящий урон', () => {
    const stats = new Stats();
    stats.set('slashDef', 100);
    const bare = startingArmor();
    const geared = startingArmor();
    geared.slash.rarity = 'legendary';
    geared.slash.level = 20;

    expect(armorDefense(stats, 'slash', geared.slash))
      .toBeGreaterThan(armorDefense(stats, 'slash', bare.slash));
    expect(incomingDps(500, 'slash', stats, geared))
      .toBeLessThan(incomingDps(500, 'slash', stats, bare));
  });

  it('работает защита того типа, которым бьёт враг, а не любая', () => {
    const stats = new Stats();
    const armor = startingArmor();
    stats.set('pierceDef', 1000);
    stats.set('crushDef', 1);

    // Прокачанная колющая защита не спасает от дробящего удара.
    expect(incomingDps(100, 'crush', stats, armor))
      .toBeGreaterThan(incomingDps(100, 'pierce', stats, armor));
  });

  it('сет множит и здоровье, иначе порог T_death недостижим', () => {
    const stats = new Stats();
    const bare = startingArmor();
    const geared = startingArmor();
    for (const type of ['pierce', 'slash', 'crush'] as const) {
      geared[type].rarity = 'legendary';
      geared[type].level = 30;
    }

    expect(effectiveMaxHp(stats, bare)).toBeCloseTo(stats.maxHp, 10);
    expect(effectiveMaxHp(stats, geared)).toBeGreaterThan(stats.maxHp * 10);
  });

  it('здоровье считается по всем трём сетам, а не по одному', () => {
    const stats = new Stats();
    const armor = startingArmor();
    const before = effectiveMaxHp(stats, armor);
    armor.slash.level = 20;
    const after = effectiveMaxHp(stats, armor);

    expect(after).toBeGreaterThan(before);
    // Один сет из трёх даёт треть прибавки: полный доспех надо качать целиком.
    const single = armor.slash.multiplier - 1;
    expect(after / stats.maxHp).toBeCloseTo(1 + single / 3, 10);
  });

  it('финальный босс бьёт всеми тремя типами сразу', () => {
    const stats = new Stats();
    const armor = startingArmor();
    for (const key of ['pierceDef', 'slashDef', 'crushDef'] as const) stats.set(key, 100);

    // 'any' делит урон на три и складывает обратно: при равных защитах это
    // совпадает с одиночным ударом той же силы.
    expect(incomingDps(300, 'any', stats, armor))
      .toBeCloseTo(incomingDps(100, 'pierce', stats, armor) * 3, 10);
  });
});

describe('Combat — лучший тип по цели', () => {
  it('лучшим считается тип с наибольшим уроном, а не с наибольшей атакой', () => {
    const stats = new Stats();
    const weapons = startingWeapons();
    // Защита ниже там, где у врага слабость: против неё и должен указать bestType.
    const def = { pierce: 400, slash: 40, crush: 400 };
    expect(bestType(stats, weapons, def)).toBe('slash');
    expect(bestType(stats, weapons, { pierce: 40, slash: 400, crush: 400 })).toBe('pierce');
  });

  it('оружие переигрывает защиту: сильная палица берёт врага, стойкого к ней', () => {
    const stats = new Stats();
    const weapons = startingWeapons();
    const def = { pierce: 100, slash: 100, crush: 160 };
    expect(bestType(stats, weapons, def)).not.toBe('crush');
    weapons.crush = new Weapon('crush', 'legendary', 20);
    expect(bestType(stats, weapons, def)).toBe('crush');
  });
});
