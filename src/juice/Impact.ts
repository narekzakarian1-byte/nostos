import { getBalance } from '../core/Balance.ts';
import { bestType, weaponAttack } from '../core/Combat.ts';
import { iconColor } from '../core/IconColor.ts';
import type { Player } from '../player/Player.ts';
import type { Enemy } from '../world/Enemy.ts';
import type { Particles } from './Particles.ts';

/**
 * Момент контакта: кто дёрнулся, где вспыхнуло, куда полетели искры.
 *
 * Отдельно от Game.playerAttack, потому что там про урон и награду, а здесь
 * только про ощущение. Логика вызывает это на фиксированном тике, канваса
 * функции не знают.
 */

/**
 * Удар игрока. Цвет искр — иконки того типа, который сейчас пробивает лучше
 * всех: всплеск подтверждает ровно то решение, что и три иконки над врагом,
 * а не живёт отдельной жизнью.
 */
export function playerImpact(
  player: Player,
  target: Enemy,
  particles: Particles,
  crit: boolean,
): void {
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const length = Math.hypot(dx, dy) || 1;
  const type = bestType(player.stats, player.weapons, target.def);
  const color = iconColor(weaponAttack(player.stats, type, player.weapons[type]), target.def[type]);

  target.anim.hit(dx, dy, crit);
  // Искры бьют из ближней к игроку кромки фигуры, а не из центра: из центра
  // они читаются как взрыв внутри врага.
  const edge = target.size / 2;
  particles.burst(
    target.x - (dx / length) * edge,
    target.y - (dy / length) * edge,
    dx, dy, color, crit,
  );
}

/** Ответный удар врага. Цвет один на всех — это урон по игроку, а не по типу. */
export function enemyImpact(enemy: Enemy, player: Player, particles: Particles): void {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const length = Math.hypot(dx, dy) || 1;
  const edge = getBalance().render.playerSize / 2;

  player.anim.hit(dx, dy, false);
  particles.burst(
    player.x - (dx / length) * edge,
    player.y - (dy / length) * edge,
    dx, dy, getBalance().palette.danger, false,
  );
}
