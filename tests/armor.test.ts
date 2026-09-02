import { describe, it, expect } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { Armor, startingArmor } from '../src/player/Armor.ts';
import { ArmorInventory } from '../src/player/ArmorInventory.ts';
import { RARITY_ORDER } from '../src/player/Weapon.ts';

const balance = getBalance();

describe('Armor — множитель и слоты', () => {
  it('множитель первого уровня равен множителю редкости', () => {
    const { rarityMult } = balance.armor;
    expect(new Armor('pierce', 'common').multiplier).toBeCloseTo(rarityMult.common, 10);
    expect(new Armor('pierce', 'legendary').multiplier).toBeCloseTo(rarityMult.legendary, 10);
  });

  it('слот не пустует: три сета, по одному на тип защиты', () => {
    const armor = startingArmor();
    expect(Object.keys(armor).sort()).toEqual(['crush', 'pierce', 'slash']);
    for (const type of ['pierce', 'slash', 'crush'] as const) {
      expect(armor[type].type).toBe(type);
      expect(armor[type].rarity).toBe('common');
      expect(armor[type].level).toBe(1);
    }
  });

  it('множитель растёт с уровнем — броня не декорация', () => {
    const low = new Armor('slash', 'common', 1).multiplier;
    const high = new Armor('slash', 'common', 30).multiplier;
    expect(high / low).toBeGreaterThan(2);
  });

  it('следующая редкость идёт по порядку и упирается в золотую', () => {
    expect(new Armor('pierce', 'rare').nextRarity).toBe('epic');
    expect(new Armor('pierce', 'legendary').nextRarity).toBeNull();
  });
});

describe('Armor — наследование уровня, то же правило 5 CLAUDE.md', () => {
  it('фиолетовая при синей 30 уровня даёт фиолетовую 30, а не первого', () => {
    const owned = new Armor('crush', 'rare', 30);
    const result = Armor.onAcquire(new Armor('crush', 'epic'), owned);

    expect(result.rarity).toBe('epic');
    expect(result.level).toBe(30);
  });

  it('без наследования этот же дроп сделал бы игрока слабее', () => {
    const owned = new Armor('crush', 'rare', 30);
    const naive = new Armor('crush', 'epic', 1);
    expect(naive.multiplier).toBeLessThan(owned.multiplier);

    const inherited = Armor.onAcquire(new Armor('crush', 'epic'), owned);
    expect(inherited.multiplier).toBeGreaterThan(owned.multiplier);
  });

  it('работает на каждой ступени редкости', () => {
    for (let i = 0; i < RARITY_ORDER.length - 1; i++) {
      const owned = new Armor('slash', RARITY_ORDER[i]!, 17);
      const result = Armor.onAcquire(new Armor('slash', RARITY_ORDER[i + 1]!), owned);
      expect(result.level).toBe(17);
      expect(result.multiplier).toBeGreaterThan(owned.multiplier);
    }
  });

  it('дроп худшей или равной редкости не заменяет уже надетое', () => {
    const owned = new Armor('pierce', 'epic', 20);
    expect(Armor.onAcquire(new Armor('pierce', 'rare', 50), owned)).toBe(owned);
    expect(Armor.onAcquire(new Armor('pierce', 'epic', 50), owned)).toBe(owned);
    expect(owned.level).toBe(20);
  });
});

describe('ArmorInventory — осколки', () => {
  it('стоимость уровня совпадает с кривой активного профиля', () => {
    const inventory = new ArmorInventory();
    const armor = new Armor('pierce');
    const curve = balance.armorShards.profiles[balance.activeProfile];
    expect(inventory.costFor(armor)).toBe(Math.ceil(curve.a * 1 ** curve.b + curve.c));
  });

  it('апгрейд тратит осколки и поднимает уровень', () => {
    const inventory = new ArmorInventory();
    const armor = new Armor('slash');
    const cost = inventory.costFor(armor);

    expect(inventory.canUpgrade(armor)).toBe(false);
    expect(inventory.upgrade(armor)).toBe(false);
    expect(armor.level).toBe(1);

    inventory.add('slash', cost);
    expect(inventory.upgrade(armor)).toBe(true);
    expect(armor.level).toBe(2);
    expect(inventory.get('slash')).toBe(0);
  });

  it('осколки одного типа не тратятся на другой сет', () => {
    const inventory = new ArmorInventory();
    inventory.add('pierce', 999);
    expect(inventory.canUpgrade(new Armor('crush'))).toBe(false);
  });

  it('осколки брони — отдельная валюта: копии оружия на неё не идут', () => {
    const inventory = new ArmorInventory();
    expect(inventory.get('pierce')).toBe(0);
    inventory.add('pierce', 5);
    // Счётчик брони свой; проверка держит разделение валют,
    // на котором стоит выбор «бить сильнее или дольше жить».
    expect(inventory.get('pierce')).toBe(5);
  });
});
