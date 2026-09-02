import { describe, it, expect } from 'vitest';
import { duration, percent, short } from '../src/ui/Format.ts';

// Форматирование стоит на плашках HP над каждым врагом. Ошибка здесь не падает
// и не ломает бой — она просто показывает игроку неправильное число, и решение
// «дожать или отойти» принимается по вранью.

describe('Format.short — числа как в референсе', () => {
  it('до тысячи показывает как есть', () => {
    expect(short(0)).toBe('0');
    expect(short(7.25)).toBe('7.25');
    expect(short(42)).toBe('42');
    expect(short(384)).toBe('384');
    expect(short(999)).toBe('999');
  });

  it('тысячи и миллионы сокращаются до трёх значащих цифр', () => {
    expect(short(1000)).toBe('1K');
    expect(short(1200)).toBe('1.2K');
    expect(short(17500)).toBe('17.5K');
    expect(short(384000)).toBe('384K');
    expect(short(2220000)).toBe('2.22M');
    expect(short(1.39e6)).toBe('1.39M');
  });

  it('круглые десятки не теряют нолик вместе с разрядом', () => {
    // Жадная обрезка нулей превращала «20.0» в «2»: полоса HP врала в десять раз.
    expect(short(20000)).toBe('20K');
    expect(short(100000)).toBe('100K');
    expect(short(10e6)).toBe('10M');
  });

  it('отрицательные не ломают формат', () => {
    expect(short(-1500)).toBe('-1.5K');
  });
});

describe('Format.duration — таймеры респауна', () => {
  it('часы, минуты и секунды', () => {
    expect(duration(3 * 3600 + 6 * 60)).toBe('3h 6m');
    expect(duration(240)).toBe('4m 0s');
    expect(duration(12)).toBe('12s');
  });

  it('истёкшее и бесконечное время — прочерк, а не «NaNs»', () => {
    expect(duration(0)).toBe('—');
    expect(duration(-5)).toBe('—');
    expect(duration(Number.POSITIVE_INFINITY)).toBe('—');
  });
});

describe('Format.percent', () => {
  it('доля превращается в проценты с десятой', () => {
    expect(percent(0.168)).toBe('16.8%');
    expect(percent(0)).toBe('0.0%');
  });
});
