import { getBalance } from '../core/Balance.ts';
import { bestType, weaponAttack } from '../core/Combat.ts';
import type { Game } from '../core/Game.ts';
import { iconColor } from '../core/IconColor.ts';
import { swingPhase } from '../juice/BodyAnim.ts';
import { stroke } from '../juice/RigPose.ts';
import { degToRad } from '../juice/Ease.ts';

/**
 * След оружия: дуга, прочерченная вокруг игрока в сторону цели.
 *
 * Цвет — иконки того типа, который сейчас пробивает лучше всех. Дуга поэтому
 * не украшение: не отрывая взгляда от боя, видно, чем именно ты его берёшь, —
 * то же, что говорят три иконки над врагом, но в момент удара.
 *
 * Своего состояния нет: фаза берётся из счётчика удара, как и выпад фигуры.
 */
export function drawSlashArc(ctx: CanvasRenderingContext2D, game: Game): void {
  const target = game.target;
  const player = game.player;
  if (!target || !player.alive) return;

  const { anim, render } = getBalance();
  const type = bestType(player.stats, player.weapons, target.def);
  const hand = stroke(type);
  const { strike } = swingPhase(player.attackCooldown, hand.windupSec);
  if (strike >= 1) return;

  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const base = Math.atan2(dy, dx);
  // Размах следа — из профиля типа: у меча широкий полумесяц, у копья
  // короткая толстая черта вдоль удара. Одна дуга на все три и означала бы,
  // что копьё рубит.
  const span = degToRad(hand.arcSpanDeg);
  // Ведущая кромка идёт от одного края разворота к другому, хвост тянется
  // следом: так у дуги есть направление, а не просто мигающий полумесяц.
  const lead = base - span / 2 + span * strike;
  const tail = Math.max(base - span / 2, lead - span / 2);

  const color = iconColor(weaponAttack(player.stats, type, player.weapons[type]), target.def[type]);

  ctx.save();
  ctx.globalAlpha = anim.arcAlpha * (1 - strike);
  ctx.strokeStyle = color;
  ctx.lineWidth = hand.arcWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(player.x, player.y, render.playerSize * anim.arcRadiusScale, tail, lead);
  ctx.stroke();
  ctx.restore();
}
