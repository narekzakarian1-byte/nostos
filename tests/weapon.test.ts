import { describe, it, expect } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { Inventory } from '../src/player/Inventory.ts';
import { Weapon, startingWeapons, RARITY_ORDER } from '../src/player/Weapon.ts';

const balance = getBalance();

describe('Weapon — множитель и слоты', () => {
  it('множитель первого уровня равен множителю редкости', () => {
    const { rarityMult } = balance.weapons;
    expect(new Weapon('pierce', 'common').multiplier).toBeCloseTo(rarityMult.common, 10);
    expect(new Weapon('pierce', 'legendary').multiplier).toBeCloseTo(rarityMult.legendary, 10);
  });

  it('слот никогда не пустует: три оружия, по одному на тип', () => {
    const weapons = startingWeapons();
    expect(Object.keys(weapons).sort()).toEqual(['crush', 'pierce', 'slash']);
    for (const type of ['pierce', 'slash', 'crush'] as const) {
      expect(weapons[type].type).toBe(type);
      expect(weapons[type].rarity).toBe('common');
      expect(weapons[type].level).toBe(1);
    }
  });

  it('следующая редкость идёт по порядку и упирается в золотое', () => {
    expect(new Weapon('pierce', 'rare').nextRarity).toBe('epic');
    expect(new Weapon('pierce', 'legendary').nextRarity).toBeNull();
  });
});

describe('Weapon — наследование уровня, правило 5 CLAUDE.md', () => {
  it('фиолетовое при синем 30 уровня даёт фиолетовое 30, а не первого', () => {
    const owned = new Weapon('crush', 'rare', 30);
    const result = Weapon.onAcquire(new Weapon('crush', 'epic'), owned);

    expect(result.rarity).toBe('epic');
    expect(result.level).toBe(30);
  });

  it('без наследования этот же дроп сделал бы игрока слабее', () => {
    const owned = new Weapon('crush', 'rare', 30);
    const naive = new Weapon('crush', 'epic', 1);
    expect(naive.multiplier).toBeLessThan(owned.multiplier);

    const inherited = Weapon.onAcquire(new Weapon('crush', 'epic'), owned);
    expect(inherited.multiplier).toBeGreaterThan(owned.multiplier);
  });

  it('работает на каждой ступени редкости', () => {
    for (let i = 0; i < RARITY_ORDER.length - 1; i++) {
      const owned = new Weapon('slash', RARITY_ORDER[i]!, 17);
      const result = Weapon.onAcquire(new Weapon('slash', RARITY_ORDER[i + 1]!), owned);
      expect(result.level).toBe(17);
      expect(result.multiplier).toBeGreaterThan(owned.multiplier);
    }
  });

  it('дроп худшей или равной редкости не заменяет уже надетое', () => {
    const owned = new Weapon('pierce', 'epic', 20);
    expect(Weapon.onAcquire(new Weapon('pierce', 'rare', 50), owned)).toBe(owned);
    expect(Weapon.onAcquire(new Weapon('pierce', 'epic', 50), owned)).toBe(owned);
    expect(owned.level).toBe(20);
  });
});

describe('Inventory — копии', () => {
  it('стоимость уровня совпадает с кривой активного профиля', () => {
    const inventory = new Inventory();
    const weapon = new Weapon('pierce');
    const curve = balance.copies.profiles[balance.activeProfile];
    expect(inventory.costFor(weapon)).toBe(Math.ceil(curve.a * 1 ** curve.b + curve.c));
  });

  it('апгрейд тратит копии и поднимает уровень', () => {
    const inventory = new Inventory();
    const weapon = new Weapon('slash');
    const cost = inventory.costFor(weapon);

    expect(inventory.canUpgrade(weapon)).toBe(false);
    expect(inventory.upgrade(weapon)).toBe(false);
    expect(weapon.level).toBe(1);

    inventory.add('slash', cost);
    expect(inventory.upgrade(weapon)).toBe(true);
    expect(weapon.level).toBe(2);
    expect(inventory.get('slash')).toBe(0);
  });

  it('копии одного типа не тратятся на другое оружие', () => {
    const inventory = new Inventory();
    inventory.add('pierce', 999);
    expect(inventory.canUpgrade(new Weapon('crush'))).toBe(false);
  });

  it('стоимость растёт с уровнем', () => {
    const inventory = new Inventory();
    const low = inventory.costFor(new Weapon('pierce', 'common', 1));
    const high = inventory.costFor(new Weapon('pierce', 'common', 30));
    expect(high).toBeGreaterThan(low);
  });
});
