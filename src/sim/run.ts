import { getBalance } from '../core/Balance.ts';
import { weaponAttack, type ByType } from '../core/Combat.ts';
import type { CopyCurve } from '../core/formulas/weapon.ts';
import type { Rarity } from '../core/BalanceTypes.ts';
import {
  attemptBoss, bossState, farmCycle, spendCopies, spendShards, statGainPerHour, upgradeRarity,
  SimPlayer, type Attempt, type BossState,
} from './model.ts';

export interface IslandReport {
  readonly n: number;
  readonly name: string;
  readonly boss: string;
  readonly weakness: string;
  readonly playerHp: number;
  readonly weaponLevel: number;
  readonly rarity: Rarity;
  readonly bossState: BossState;
  /** Атака игрока по типам на момент первой попытки — для разбора --island=N. */
  readonly atk: ByType;
  readonly first: Attempt;
  readonly final: Attempt;
  readonly copiesToWin: number;
  readonly prepSeconds: number;
  readonly cycles: number;
  readonly won: boolean;
  readonly gainPerHour: { normal: number; elite: number; miniboss: number };
}

const WEAKNESS_RU: Record<string, string> = {
  pierce: 'колющий',
  slash: 'рубящий',
  crush: 'дробящий',
  any: 'все три',
};

/**
 * Проход по одному острову: круг зачистки, прокачка, первая попытка босса,
 * затем круги до победы. Потолок по времени — из gateTargets.prepTimeMinutes.late,
 * иначе при неположительном чистом DPS цикл не завершился бы никогда.
 */
export function runIsland(player: SimPlayer, n: number, curve: CopyCurve): IslandReport {
  const { islands, gateTargets, armorShards, activeProfile } = getBalance();
  const shardCurve: CopyCurve = armorShards.profiles[activeProfile];
  const island = islands.list.find((entry) => entry.n === n)!;
  const maxPrepSeconds = gateTargets.prepTimeMinutes.late[1] * 60;

  upgradeRarity(player, n);
  let prepSeconds = farmCycle(player, n, true);
  spendCopies(player, curve);
  spendShards(player, shardCurve);

  const boss = bossState(n);
  const first = attemptBoss(player, boss);
  const atk: ByType = {
    pierce: weaponAttack(player.stats, 'pierce', player.weapons.pierce),
    slash: weaponAttack(player.stats, 'slash', player.weapons.slash),
    crush: weaponAttack(player.stats, 'crush', player.weapons.crush),
  };

  let cycles = 1;
  let attempt = first;
  const copiesAtStart = player.copiesEarned;

  while (!attempt.won && prepSeconds < maxPrepSeconds) {
    prepSeconds += farmCycle(player, n, false);
    spendCopies(player, curve);
    spendShards(player, shardCurve);
    attempt = attemptBoss(player, boss);
    cycles++;
  }

  return {
    n,
    name: island.name,
    boss: island.boss,
    weakness: WEAKNESS_RU[island.bossWeakness] ?? island.bossWeakness,
    playerHp: player.hp,
    weaponLevel: player.weaponLevel,
    rarity: player.rarity,
    bossState: boss,
    atk,
    first,
    final: attempt,
    copiesToWin: player.copiesEarned - copiesAtStart,
    prepSeconds,
    cycles,
    won: attempt.won,
    gainPerHour: {
      normal: statGainPerHour(player, n, 'normal'),
      elite: statGainPerHour(player, n, 'elite'),
      miniboss: statGainPerHour(player, n, 'miniboss'),
    },
  };
}

export function runAll(curve: CopyCurve): IslandReport[] {
  const player = new SimPlayer();
  return getBalance().islands.list.map((island) => runIsland(player, island.n, curve));
}
