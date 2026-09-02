import { getBalance } from '../core/Balance.ts';
import type { DamageType, EnemyArchetype, EnemyTier } from '../core/BalanceTypes.ts';
import type { ByType } from '../core/Combat.ts';
import { defenseByType, type DefenseStyle } from '../core/formulas/enemy.ts';
import { enemyBaseDef, enemyDps, enemyMaxHp } from './Island.ts';
import { Enemy, type FarmTier } from './Enemy.ts';

/**
 * Профиль защиты задаётся слабым типом. У обычного врага остальные два —
 * нейтральный и стойкий, у босса оба стойкие (см. formulas/enemy.ts).
 */
export function defenseProfile(
  weakness: DamageType | 'any',
  n: number,
  tier: EnemyTier,
  style: DefenseStyle = 'enemy',
): ByType {
  const { weaknessMult, neutralMult, resistMult } = getBalance().enemyDefense;
  return defenseByType(
    weakness,
    enemyBaseDef(n, tier),
    { weaknessMult, neutralMult, resistMult },
    style,
  );
}

export interface EnemySpec {
  readonly x: number;
  readonly y: number;
  readonly weakness: DamageType;
  readonly tier: FarmTier;
  readonly archetype: EnemyArchetype;
  readonly copyType: DamageType;
}

export function createEnemy(spec: EnemySpec, n: number): Enemy {
  return new Enemy(
    spec.x,
    spec.y,
    enemyMaxHp(n, spec.tier),
    enemyDps(n, spec.tier),
    defenseProfile(spec.weakness, n, spec.tier),
    spec.weakness,
    spec.tier,
    spec.archetype,
    spec.copyType,
  );
}
