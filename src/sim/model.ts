import { getBalance } from '../core/Balance.ts';
import type { DamageType, EnemyArchetype, EnemyTier, Rarity } from '../core/BalanceTypes.ts';
import { bestType, effectiveMaxHp, incomingDps, totalDps, type ByType } from '../core/Combat.ts';
import { bossRegenPerSecond } from '../core/formulas/enemy.ts';
import { statGain } from '../core/formulas/growth.ts';
import { applyKill, killValue } from '../player/Growth.ts';
import { copiesForNextLevel, inheritedLevel, type CopyCurve } from '../core/formulas/weapon.ts';
import { Stats } from '../core/Stats.ts';
import { Weapon, startingWeapons } from '../player/Weapon.ts';
import { Armor, startingArmor } from '../player/Armor.ts';
import { defenseProfile } from '../world/EnemyFactory.ts';
import { enemyDps, enemyMaxHp } from '../world/Island.ts';

export type FarmTier = Exclude<EnemyTier, 'boss'>;
const ARCHETYPES: readonly EnemyArchetype[] = ['fast', 'armored', 'heavy', 'striker'];

export interface BossState {
  readonly hp: number;
  readonly dps: number;
  readonly def: ByType;
  readonly regen: number;
  /** Чем бьёт сам босс: тем же типом, к которому уязвим (GDD §4.2). */
  readonly attackType: DamageType | 'any';
}

export interface Attempt {
  readonly playerDps: number;
  readonly netDps: number;
  readonly tDeath: number;
  readonly progressPct: number;
  readonly won: boolean;
}

export class SimPlayer {
  readonly stats = new Stats();
  readonly weapons: Record<DamageType, Weapon> = startingWeapons();
  readonly armor: Record<DamageType, Armor> = startingArmor();
  readonly copies: Record<DamageType, number> = { pierce: 0, slash: 0, crush: 0 };
  readonly shards: Record<DamageType, number> = { pierce: 0, slash: 0, crush: 0 };
  /** Всего копий добыто за прогон — нужно для отчёта «копий до победы». */
  copiesEarned = 0;
  /** Счётчик архетипов: враги раскладываются по ним равномерно. */
  private archetypeCursor = 0;

  /** Потолок HP с учётом брони — тот же расчёт, что у живого игрока. */
  get hp(): number {
    return effectiveMaxHp(this.stats, this.armor);
  }

  get weaponLevel(): number {
    return this.weapons.pierce.level;
  }

  get rarity(): Rarity {
    return this.weapons.pierce.rarity;
  }

  /**
   * Прирост считает тот же модуль, что и игра (player/Growth.ts). Своя копия
   * формулы здесь означала бы, что симулятор проверяет не то, во что играют.
   */
  applyKill(tier: FarmTier, n: number): void {
    const archetype = ARCHETYPES[this.archetypeCursor % ARCHETYPES.length]!;
    this.archetypeCursor++;
    applyKill(this.stats, tier, archetype, n);
  }
}

export function nodesOfTier(tier: FarmTier): number {
  const { islands } = getBalance();
  if (tier === 'normal') return islands.normalsPerIsland;
  if (tier === 'elite') return islands.elitesPerIsland;
  return islands.minibossesPerIsland;
}

function averageRespawn(tier: FarmTier): number {
  const [min, max] = getBalance().enemyTiers[tier].respawnSec;
  return (min + max) / 2;
}

function averageCopies(tier: FarmTier): number {
  const drop = getBalance().copies.drops[tier];
  return ((drop.min + drop.max) / 2) * drop.chance;
}

function averageShards(tier: FarmTier): number {
  const drop = getBalance().armorShards.drops[tier];
  return ((drop.min + drop.max) / 2) * drop.chance;
}

/** Средний DPS игрока по врагу тира: три профиля защиты равновероятны. */
export function dpsAgainstTier(player: SimPlayer, n: number, tier: FarmTier): number {
  const types: readonly DamageType[] = ['pierce', 'slash', 'crush'];
  let total = 0;
  for (const weakness of types) {
    // Модельный игрок играет правильно: надевает то оружие, которым эта
    // защита пробивается лучше всего. Иначе симулятор мерил бы не потолок
    // системы, а привычку не переодеваться.
    const def = defenseProfile(weakness, n, tier);
    total += totalDps(player.stats, player.weapons, def, bestType(player.stats, player.weapons, def));
  }
  return total / types.length;
}

/**
 * Один круг зачистки острова. Время круга снизу ограничено респауном узлов:
 * когда игрок перерастает остров, темп упирается в таймеры, а не в его DPS.
 * Без этого фарм первого острова на десятом был бы так же выгоден, как фарм десятого.
 */
export function farmCycle(player: SimPlayer, n: number, first: boolean): number {
  const { sim } = getBalance();
  const tiers: readonly FarmTier[] = ['normal', 'elite', 'miniboss'];
  const types: readonly DamageType[] = ['pierce', 'slash', 'crush'];
  let activeSeconds = 0;
  let killIndex = 0;

  for (const tier of tiers) {
    const dps = dpsAgainstTier(player, n, tier);
    const hp = enemyMaxHp(n, tier);
    for (let i = 0; i < nodesOfTier(tier); i++) {
      activeSeconds += hp / dps + sim.travelSecondsPerNode;
      player.applyKill(tier, n);
      // Копии падают своего типа, мини-боссы раскладываются по трём оружиям.
      const drop = averageCopies(tier);
      player.copies[types[killIndex % types.length]!] += drop;
      player.copiesEarned += drop;
      // Осколки брони — своя валюта с того же убитого, по своей таблице дропа.
      player.shards[types[killIndex % types.length]!] += averageShards(tier);
      killIndex++;
    }
  }

  return first ? activeSeconds : Math.max(activeSeconds, averageRespawn('miniboss'));
}

/** Прирост статов в час при фарме одного тира — материал для проверки 5. */
export function statGainPerHour(player: SimPlayer, n: number, tier: FarmTier): number {
  const { growth } = getBalance();
  const killsPerHour = (nodesOfTier(tier) * 3600) / averageRespawn(tier);
  const reference = player.stats.get('pierceAtk');
  return killsPerHour * statGain(killValue(tier, n), growth.gainRate, reference, growth.diminishK);
}

export function spendCopies(player: SimPlayer, curve: CopyCurve): void {
  for (const type of ['pierce', 'slash', 'crush'] as const) {
    const weapon = player.weapons[type];
    let cost = copiesForNextLevel(weapon.level, curve);
    while (player.copies[type] >= cost) {
      player.copies[type] -= cost;
      weapon.level++;
      cost = copiesForNextLevel(weapon.level, curve);
    }
  }
}

/** То же самое для брони: своя валюта, своя кривая (BALANCE.md §7.5). */
export function spendShards(player: SimPlayer, curve: CopyCurve): void {
  for (const type of ['pierce', 'slash', 'crush'] as const) {
    const armor = player.armor[type];
    let cost = copiesForNextLevel(armor.level, curve);
    while (player.shards[type] >= cost) {
      player.shards[type] -= cost;
      armor.level++;
      cost = copiesForNextLevel(armor.level, curve);
    }
  }
}

/** Редкость приходит дропом по островам; уровень при этом наследуется (правило 5). */
export function upgradeRarity(player: SimPlayer, n: number): void {
  const { weapons, armor } = getBalance();

  const bestUnlocked = (
    unlockIsland: { readonly [K in Rarity]: number },
    mult: { readonly [K in Rarity]: number },
  ): Rarity | undefined =>
    (Object.keys(unlockIsland) as Rarity[])
      .filter((rarity) => unlockIsland[rarity] <= n)
      .sort((a, b) => mult[a] - mult[b])
      .pop();

  const unlockedWeapon = bestUnlocked(weapons.rarityUnlockIsland, weapons.rarityMult);
  if (unlockedWeapon) {
    for (const type of ['pierce', 'slash', 'crush'] as const) {
      const weapon = player.weapons[type];
      if (weapons.rarityMult[unlockedWeapon] <= weapons.rarityMult[weapon.rarity]) continue;
      weapon.level = inheritedLevel(1, weapon.level, weapons.inheritLevelOnRarityUp);
      weapon.rarity = unlockedWeapon;
    }
  }

  const unlockedArmor = bestUnlocked(armor.rarityUnlockIsland, armor.rarityMult);
  if (!unlockedArmor) return;
  for (const type of ['pierce', 'slash', 'crush'] as const) {
    const piece = player.armor[type];
    if (armor.rarityMult[unlockedArmor] <= armor.rarityMult[piece.rarity]) continue;
    piece.level = inheritedLevel(1, piece.level, armor.inheritLevelOnRarityUp);
    piece.rarity = unlockedArmor;
  }
}

export function bossState(n: number): BossState {
  const { regen, islands } = getBalance();
  const island = islands.list.find((entry) => entry.n === n)!;
  const hp = enemyMaxHp(n, 'boss');
  return {
    hp,
    dps: enemyDps(n, 'boss'),
    def: defenseProfile(island.bossWeakness, n, 'boss', 'boss'),
    regen: bossRegenPerSecond(hp, regen.bossCombatRegen),
    attackType: island.bossWeakness,
  };
}

/** Условие победы и процент за попытку — BALANCE.md §5. */
export function attemptBoss(player: SimPlayer, boss: BossState): Attempt {
  const playerDps = totalDps(
    player.stats, player.weapons, boss.def,
    bestType(player.stats, player.weapons, boss.def),
  );
  const netDps = playerDps - boss.regen;
  const tDeath = player.hp / incomingDps(boss.dps, boss.attackType, player.stats, player.armor);
  const progressPct = Math.min(100, Math.max(0, (netDps * tDeath) / boss.hp) * 100);
  return { playerDps, netDps, tDeath, progressPct, won: netDps > 0 && netDps * tDeath >= boss.hp };
}
