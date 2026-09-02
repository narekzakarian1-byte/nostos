import { describe, it, expect } from 'vitest';
import { diminish, statGain } from '../src/core/formulas/growth.ts';

const K = 5000;

describe('formulas/growth — затухание, BALANCE.md §8', () => {
  it('на нулевом стате затухания нет', () => {
    expect(diminish(0, K)).toBe(1);
  });

  it('на уровне k прирост ровно вдвое меньше', () => {
    expect(diminish(K, K)).toBe(0.5);
  });

  it('затухание монотонно убывает и остаётся положительным', () => {
    let previous = diminish(0, K);
    for (const current of [100, 1000, K, 10 * K, 1000 * K]) {
      const value = diminish(current, K);
      expect(value).toBeLessThan(previous);
      expect(value).toBeGreaterThan(0);
      previous = value;
    }
  });

  it('прирост пропорционален ценности врага и скорости роста', () => {
    expect(statGain(12, 1.0, 0, K)).toBe(12);
    expect(statGain(12, 0.5, 0, K)).toBe(6);
    expect(statGain(1, 1.0, K, K)).toBe(0.5);
  });

  it('сильный враг всегда даёт не меньше слабого при равном стате', () => {
    // Иначе фарм самых слабых врагов становится эксплойтом (§8).
    const weak = statGain(1, 1.0, 3000, K);
    const strong = statGain(12, 1.0, 3000, K);
    expect(strong).toBeGreaterThan(weak);
  });
});
