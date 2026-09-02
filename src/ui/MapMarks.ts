import { getBalance } from '../core/Balance.ts';
import type { Enemy } from '../world/Enemy.ts';
import { glyph } from './Glyphs.ts';
import { panel, ui } from './UiKit.ts';

/** Значки узлов и игрока на карте. Общие у миникарты и полной карты. */

/**
 * Элита и мини-босс на карте — значком типа копий, а не точкой. В референсе
 * карта усыпана такими значками, и они там делают ровно то же: показывают,
 * куда идти за конкретным оружием.
 */
export function drawNodeMark(ctx: CanvasRenderingContext2D, enemy: Enemy, x: number, y: number): void {
  const u = ui();
  // Островной босс крупнее и тревожным цветом: это цель острова, и на карте
  // она должна находиться раньше всех прочих значков.
  const scale = enemy.tier === 'boss' ? 1.2 : enemy.tier === 'miniboss' ? 0.9 : 0.7;
  const size = u.chipSize * scale;
  const fill = enemy.tier === 'boss'
    ? u.colors.alert
    : enemy.tier === 'miniboss' ? u.colors.gold : u.colors.chip;
  panel(ctx, x - size / 2, y - size / 2, size, size, {
    fill,
    radius: size * 0.3,
    lineWidth: u.outline * 0.6,
  });
  glyph(ctx, enemy.copyType, x, y, size * 0.68, u.colors.outline, fill);
}

/** Треугольник по направлению движения: точка не говорит, куда ты смотришь. */
export function drawPlayerMark(
  ctx: CanvasRenderingContext2D,
  point: { x: number; y: number },
  angle: number,
): void {
  const { minimap } = getBalance();
  const u = ui();
  const r = minimap.playerDotRadius * 2;

  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(-r * 0.7, r * 0.75);
  ctx.lineTo(-r * 0.7, -r * 0.75);
  ctx.closePath();
  ctx.fillStyle = u.colors.gold;
  ctx.fill();
  ctx.lineWidth = u.outline * 0.7;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = u.colors.outline;
  ctx.stroke();
  ctx.restore();
}
