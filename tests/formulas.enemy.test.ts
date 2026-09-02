import { describe, it, expect } from 'vitest';
import {
  bossRegenPerSecond, defenseByType, enemyBaseDef, enemyDps, enemyHp, islandPower,
  type DefenseMults,
} from '../src/core/formulas/enemy.ts';

const MULTS: DefenseMults = { weaknessMult: 0.5, neutralMult: 1.0, resistMult: 2.0 };
const power = (n: number): number => islandPower(2.0, n);

describe('formulas/enemy — кривая острова, BALANCE.md §6', () => {
  it('powerBase^(n-1)', () => {
    expect(power(1)).toBe(1);
    expect(power(3)).toBe(4);
    expect(power(13)).toBe(4096);
  });

  it('обычный враг первого острова', () => {
    expect(enemyHp(100, power(1), 1.0)).toBe(100);
    expect(enemyDps(8, power(1), 1.0)).toBe(8);
    expect(enemyBaseDef(6, power(1), 1.0)).toBe(6);
  });

  it('таблица боссов §5.4 сходится на островах 3 и 13', () => {
    expect(enemyHp(100, power(3), 60)).toBe(24_000);
    expect(enemyDps(8, power(3), 4.0)).toBe(128);
    expect(bossRegenPerSecond(24_000, 0.012)).toBe(288);

    expect(enemyHp(100, power(13), 60)).toBe(24_576_000);
    expect(enemyDps(8, power(13), 4.0)).toBe(131_072);
    expect(bossRegenPerSecond(24_576_000, 0.012)).toBe(294_912);
  });

  it('за 13 островов разброс силы составляет 4096 раз', () => {
    expect(power(13) / power(1)).toBe(4096);
  });
});

describe('formulas/enemy — профили защиты', () => {
  it('обычный враг: слабый, нейтральный, стойкий', () => {
    expect(defenseByType('pierce', 6, MULTS, 'enemy')).toEqual({ pierce: 3, slash: 6, crush: 12 });
    expect(defenseByType('slash', 6, MULTS, 'enemy')).toEqual({ pierce: 12, slash: 3, crush: 6 });
    expect(defenseByType('crush', 6, MULTS, 'enemy')).toEqual({ pierce: 6, slash: 12, crush: 3 });
  });

  it('босс: слабый тип и два стойких', () => {
    // Выведено из калибровки §5.4: с двумя нейтральными остров 3 даёт 637 DPS
    // вместо целевых 555, с двумя стойкими — 552.
    expect(defenseByType('crush', 72, MULTS, 'boss')).toEqual({
      pierce: 144, slash: 144, crush: 36,
    });
  });

  it('Итака: финальный босс уязвим ко всем трём типам', () => {
    expect(defenseByType('any', 72, MULTS, 'boss')).toEqual({
      pierce: 36, slash: 36, crush: 36,
    });
  });

  it('у обычного врага набор защит — перестановка одного и того же', () => {
    const values = (weakness: 'pierce' | 'slash' | 'crush'): number[] =>
      Object.values(defenseByType(weakness, 6, MULTS, 'enemy')).sort((a, b) => a - b);
    expect(values('pierce')).toEqual(values('slash'));
    expect(values('slash')).toEqual(values('crush'));
  });
});
