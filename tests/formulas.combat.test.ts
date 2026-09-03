import { describe, it, expect } from 'vitest';
import {
  attackRatio, critChanceFrom, critFactor, critMultFrom, damageMultiplier, damagePerHit,
  dodgeChanceFrom, dps, incomingDamage, type DamageParams,
} from '../src/core/formulas/combat.ts';

const P: DamageParams = { exponent: 1.5, floor: 0.05, ceil: 0.95 };
const at = (ratio: number): number => damageMultiplier(ratio * 100, 100, P);

describe('formulas/combat — размен', () => {
  it('опорная таблица BALANCE.md §2.1', () => {
    expect(at(0.33)).toBeCloseTo(0.16, 2);
    expect(at(0.5)).toBeCloseTo(0.26, 2);
    expect(at(1.0)).toBe(0.5);
    expect(at(1.5)).toBeCloseTo(0.65, 2);
    expect(at(2.0)).toBeCloseTo(0.74, 2);
    expect(at(3.0)).toBeCloseTo(0.84, 2);
  });

  it('разница между неправильным и правильным типом — около пяти раз', () => {
    // BALANCE.md §2.1: иконки имеют вес, но неправильный тип не обнуляется.
    expect(at(3.0) / at(0.33)).toBeGreaterThan(4.5);
    expect(at(3.0) / at(0.33)).toBeLessThan(5.5);
  });

  it('пол и потолок зажимают множитель', () => {
    expect(damageMultiplier(1, 1e9, P)).toBe(P.floor);
    expect(damageMultiplier(1e9, 1, P)).toBe(P.ceil);
  });

  it('защита ниже единицы не даёт деления на ноль', () => {
    expect(attackRatio(10, 0)).toBe(10);
    expect(Number.isFinite(damagePerHit(10, 0, P))).toBe(true);
  });

  it('экспонента управляет важностью типов', () => {
    const flat = damageMultiplier(200, 100, { ...P, exponent: 1.0 });
    const steep = damageMultiplier(200, 100, { ...P, exponent: 2.0 });
    expect(steep).toBeGreaterThan(flat);
  });

  it('переход урона в DPS', () => {
    // Суммы по трём типам больше нет: бьёт только надетое оружие, и залп —
    // это ровно один damagePerHit (Combat.hitDamage).
    const damage = damagePerHit(100, 50, P);
    expect(dps(damage, 1.0, 1.0)).toBeCloseTo(damage, 10);
    expect(dps(damage, 2.0, 1.5)).toBeCloseTo(damage * 3, 10);
  });

  it('входящий урон срезается защитой, потом уклонением', () => {
    // Защита равна урону врага: отношение 1.0, множитель ровно 0.5 (§2.1).
    expect(incomingDamage(100, 100, P, 0)).toBeCloseTo(50, 10);
    expect(incomingDamage(100, 100, P, 0.25)).toBeCloseTo(37.5, 10);
  });

  it('вдвое большая защита срезает входящий урон заметно сильнее', () => {
    const weak = incomingDamage(100, 50, P, 0);
    const strong = incomingDamage(100, 100, P, 0);
    expect(strong).toBeLessThan(weak);
    // Та же кривая, что у исходящего урона: ratio 2.0 → 0.74, ratio 1.0 → 0.50.
    expect(weak).toBeCloseTo(damagePerHit(100, 50, P), 10);
  });
});

describe('formulas/combat — конверсии BALANCE.md §1', () => {
  it('крит: 139 сырых дают 16.8% [репер из референса]', () => {
    expect(critChanceFrom(139, 0.75, 480)).toBeCloseTo(0.168, 3);
  });

  it('уклонение: 18 сырых дают ~8.4% [репер из референса — 8.49%]', () => {
    expect(dodgeChanceFrom(18, 0.6, 110)).toBeCloseTo(0.0844, 4);
  });

  it('урон крита: 82 сырых дают 213% [репер из референса]', () => {
    expect(critMultFrom(82, 1.5, 130)).toBeCloseTo(2.131, 3);
  });

  it('насыщение: на уровне k набирается ровно половина потолка', () => {
    expect(critChanceFrom(480, 0.75, 480)).toBeCloseTo(0.375, 10);
    expect(dodgeChanceFrom(110, 0.6, 110)).toBeCloseTo(0.3, 10);
  });

  it('крит-фактор равен единице без крита', () => {
    expect(critFactor(0, 1.5)).toBe(1);
    expect(critFactor(0.5, 2.0)).toBeCloseTo(1.5, 10);
  });
});
