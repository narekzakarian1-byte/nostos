import { describe, it, expect } from 'vitest';
import {
  copiesForNextLevel, copiesToReach, inheritedLevel, weaponMultiplier, type CopyCurve,
} from '../src/core/formulas/weapon.ts';

const STEP = 0.055;
const UNCOMMON = 1.6;
const RARE = 2.6;
const EPIC = 4.2;

const PRODUCTION: CopyCurve = { a: 0.8, b: 1.4, c: 1 };
const PROTOTYPE: CopyCurve = { a: 0.25, b: 1.15, c: 1 };

describe('formulas/weapon — множитель', () => {
  it('таблица BALANCE.md §7.1 для зелёного оружия', () => {
    expect(weaponMultiplier(UNCOMMON, STEP, 1)).toBeCloseTo(1.6, 2);
    expect(weaponMultiplier(UNCOMMON, STEP, 10)).toBeCloseTo(2.39, 2);
    expect(weaponMultiplier(UNCOMMON, STEP, 20)).toBeCloseTo(3.27, 2);
    expect(weaponMultiplier(UNCOMMON, STEP, 30)).toBeCloseTo(4.15, 2);
  });

  it('уровень 50 даёт множитель 3.695 сверх редкости', () => {
    // BALANCE.md §7.1 округляет это до 3.70.
    expect(weaponMultiplier(1, STEP, 50)).toBeCloseTo(1 + STEP * 49, 10);
    expect(weaponMultiplier(1, STEP, 50)).toBeCloseTo(3.7, 1);
  });

  it('первый уровень равен множителю редкости', () => {
    expect(weaponMultiplier(EPIC, STEP, 1)).toBe(EPIC);
  });
});

describe('formulas/weapon — наследование уровня, BALANCE.md §7.2', () => {
  it('без наследования фиолетовое первого уровня СЛАБЕЕ синего', () => {
    // Ровно та проблема референса, ради которой правило и введено.
    for (const level of [15, 30, 50]) {
      const blue = weaponMultiplier(RARE, STEP, level);
      const purpleFresh = weaponMultiplier(EPIC, STEP, inheritedLevel(1, level, false));
      expect(purpleFresh).toBeLessThan(blue);
    }
  });

  it('с наследованием лучший дроп всегда сильнее', () => {
    const cases: readonly [number, number][] = [[15, 7.4], [30, 10.9], [50, 15.5]];
    for (const [level, expected] of cases) {
      const blue = weaponMultiplier(RARE, STEP, level);
      const purple = weaponMultiplier(EPIC, STEP, inheritedLevel(1, level, true));
      expect(purple).toBeCloseTo(expected, 1);
      expect(purple).toBeGreaterThan(blue);
      // Шаг между редкостями ≈ 1.62 (§7.1).
      expect(purple / blue).toBeCloseTo(1.62, 1);
    }
  });

  it('наследование не понижает уровень нового оружия', () => {
    expect(inheritedLevel(20, 5, true)).toBe(20);
  });
});

describe('formulas/weapon — копии, BALANCE.md §7.3', () => {
  it('продакшн-кривая: уровень 5 стоит 9 копий', () => {
    expect(copiesForNextLevel(5, PRODUCTION)).toBe(9);
  });

  it('стоимость растёт монотонно и целая', () => {
    let previous = 0;
    for (let level = 1; level <= 50; level++) {
      const cost = copiesForNextLevel(level, PRODUCTION);
      expect(Number.isInteger(cost)).toBe(true);
      expect(cost).toBeGreaterThanOrEqual(previous);
      previous = cost;
    }
  });

  it('прототип примерно вчетверо дешевле продакшна', () => {
    const proto = copiesToReach(1, 15, PROTOTYPE);
    const prod = copiesToReach(1, 15, PRODUCTION);
    expect(prod / proto).toBeGreaterThan(3);
    expect(prod / proto).toBeLessThan(5);
  });

  it('путь с 1 до 15 уровня стоит около 200 копий в продакшне', () => {
    expect(copiesToReach(1, 15, PRODUCTION)).toBeGreaterThan(150);
    expect(copiesToReach(1, 15, PRODUCTION)).toBeLessThan(260);
  });
});
