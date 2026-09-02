import { getBalance } from '../core/Balance.ts';
import type { EnemyTier } from '../core/BalanceTypes.ts';
import type { Enemy } from '../world/Enemy.ts';
import { duration } from './Format.ts';
import { panel, text, ui } from './UiKit.ts';

/**
 * Циферблат на месте убитого узла: тёмный диск, дуга остатка времени, столбик
 * делений по тиру и время числом над ним.
 *
 * Без него убитый узел просто исчезает, и карта с таймерами читается как
 * пустая поляна: игрок не видит ни того, что здесь кто-то был, ни того, когда
 * он вернётся. Персистентный мир (GDD §5.4) существует ровно настолько,
 * насколько он показан.
 */

/** Сколько делений в столбике: чем выше тир, тем длиннее. */
const TIER_ORDER: readonly EnemyTier[] = ['normal', 'elite', 'miniboss', 'boss'];

export function drawRespawnDial(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
  const { respawnDial } = getBalance().render;
  const u = ui();
  const r = respawnDial.radius;

  ctx.save();
  ctx.globalAlpha = respawnDial.alpha;

  // Ложе циферблата.
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, r, 0, Math.PI * 2);
  ctx.fillStyle = u.colors.hpBack;
  ctx.fill();
  ctx.lineWidth = u.outline;
  ctx.strokeStyle = u.colors.outline;
  ctx.stroke();

  // Дуга остатка. Идёт от «двенадцати часов» по часовой стрелке и укорачивается
  // — то же направление, что у любого таймера на телефоне.
  const left = fraction(enemy);
  if (left > 0) {
    const start = -Math.PI / 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r - respawnDial.thickness / 2, start, start + Math.PI * 2 * left);
    ctx.lineWidth = respawnDial.thickness;
    ctx.lineCap = 'round';
    ctx.strokeStyle = u.colors.ready;
    ctx.stroke();
  }

  drawTierPips(ctx, enemy, r);
  ctx.restore();

  text(ctx, duration(enemy.respawnIn), enemy.x, enemy.y - r - respawnDial.labelOffset, {
    size: u.fontSmall,
    fill: u.colors.text,
  });
}

/** Доля оставшегося времени в [0, 1]. Ноль по длительности — пустая дуга. */
function fraction(enemy: Enemy): number {
  if (enemy.respawnTotal <= 0) return 0;
  return Math.max(0, Math.min(1, enemy.respawnIn / enemy.respawnTotal));
}

/**
 * Столбик делений справа от диска: ранг узла. Цвет времени одинаков у всех, а
 * идти игрок собирается к конкретному тиру — по одной дуге их не различить.
 */
function drawTierPips(ctx: CanvasRenderingContext2D, enemy: Enemy, radius: number): void {
  const { respawnDial } = getBalance().render;
  const u = ui();
  const count = TIER_ORDER.indexOf(enemy.tier) + 1;
  const step = respawnDial.pipHeight + respawnDial.pipGap;
  const x = enemy.x + radius + respawnDial.pipGap * 2;
  const top = enemy.y - (count * step - respawnDial.pipGap) / 2;

  for (let i = 0; i < count; i++) {
    panel(ctx, x, top + i * step, respawnDial.pipWidth, respawnDial.pipHeight, {
      fill: enemy.tier === 'boss' ? u.colors.alert : u.colors.chip,
      radius: respawnDial.pipHeight / 2,
      lineWidth: u.outline / 2,
    });
  }
}
