import { getBalance } from '../core/Balance.ts';
import type { Rng } from '../core/Rng.ts';
import type { Enemy } from '../world/Enemy.ts';
import { applyKill } from './Growth.ts';
import type { Inventory } from './Inventory.ts';
import type { Player } from './Player.ts';
import { RARITY_RU, TYPE_RU, Weapon } from './Weapon.ts';

/**
 * Что даёт убийство: статы, копии и — редко — оружие следующей редкости.
 *
 * Статы прилетают мгновенно прямо в бою, без экрана результатов. Копии падают
 * адресно, по типу оружия, поэтому у игрока всегда есть цель: «нужна палица —
 * иду к тому врагу».
 *
 * Возвращает текст уведомления, если выпала редкость, иначе null.
 */
export function rewardKill(
  player: Player,
  inventory: Inventory,
  enemy: Enemy,
  rng: Rng,
): string | null {
  const { prototype, copies, weapons } = getBalance();
  applyKill(player.stats, enemy.tier, enemy.archetype, prototype.islandNumber);

  // Островной босс копий не даёт (BALANCE.md §7.4 перечисляет только три
  // фармовых тира): его награда — открытый гейт, а не ускорение гринда.
  if (enemy.tier !== 'boss') {
    const drop = copies.drops[enemy.tier];
    if (drop.chance > 0 && rng.chance(drop.chance)) {
      inventory.add(enemy.copyType, rng.int(drop.min, drop.max));
    }
  }

  if (enemy.tier !== 'miniboss' || !rng.chance(weapons.rarityDropChance)) return null;

  const owned = player.weapons[enemy.copyType];
  const next = owned.nextRarity;
  if (!next) return null;

  // Уровень наследуется — правило 5 CLAUDE.md. Без этого лучший дроп в игре
  // сделал бы игрока слабее, и именно здесь люди уходят.
  const kept = Weapon.onAcquire(new Weapon(enemy.copyType, next), owned);
  player.weapons[enemy.copyType] = kept;
  return `${RARITY_RU[kept.rarity].toUpperCase()} ${TYPE_RU[kept.type]}, ур. ${kept.level}`;
}
