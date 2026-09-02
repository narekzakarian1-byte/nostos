import { describe, it, expect } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { applyKill, killValue } from '../src/player/Growth.ts';
import { Stats } from '../src/core/Stats.ts';
import { diminish } from '../src/core/formulas/growth.ts';

const balance = getBalance();

describe('Growth — прирост с убитых, BALANCE.md §8', () => {
  it('падают ровно те статы, что записаны в dropTable архетипа', () => {
    const stats = new Stats();
    const before = stats.keys().map((k) => stats.get(k));
    applyKill(stats, 'normal', 'heavy', 1);

    const grown = stats.keys().filter((k, i) => stats.get(k) > before[i]!);
    expect(grown.sort()).toEqual([...balance.growth.dropTable.heavy].sort());
  });

  it('атакующий враг даёт урон и крит, но не здоровье', () => {
    const stats = new Stats();
    const hpBefore = stats.get('maxHp');
    applyKill(stats, 'normal', 'striker', 1);
    expect(stats.get('pierceAtk')).toBeGreaterThan(balance.player.baseStats.pierceAtk);
    expect(stats.get('maxHp')).toBe(hpBefore);
  });

  it('сильный тир даёт больше слабого', () => {
    expect(killValue('miniboss', 1)).toBeGreaterThan(killValue('elite', 1));
    expect(killValue('elite', 1)).toBeGreaterThan(killValue('normal', 1));
  });

  it('ценность растёт вместе с островом', () => {
    // Иначе фарм первого острова на десятом был бы так же выгоден.
    expect(killValue('normal', 2)).toBeCloseTo(killValue('normal', 1) * balance.islands.powerBase, 6);
  });

  it('затухание: на diminishK прирост ровно вдвое меньше', () => {
    const k = balance.growth.diminishK;
    expect(diminish(k, k)).toBe(0.5);

    const fresh = new Stats();
    const rich = new Stats();
    rich.set('maxHp', k);
    const base = fresh.get('maxHp');

    applyKill(fresh, 'normal', 'heavy', 1);
    applyKill(rich, 'normal', 'heavy', 1);
    const gainFresh = fresh.get('maxHp') - base;
    const gainRich = rich.get('maxHp') - k;
    expect(gainRich).toBeLessThan(gainFresh);
  });

  it('прирост никогда не отрицательный и не бесконечный', () => {
    const stats = new Stats();
    for (let i = 0; i < 500; i++) applyKill(stats, 'miniboss', 'striker', 5);
    for (const key of stats.keys()) {
      expect(Number.isFinite(stats.get(key))).toBe(true);
      expect(stats.get(key)).toBeGreaterThanOrEqual(0);
    }
  });
});
