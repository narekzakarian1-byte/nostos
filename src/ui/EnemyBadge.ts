import type { DamageType } from '../core/BalanceTypes.ts';
import { DAMAGE_TYPES, weaponAttack } from '../core/Combat.ts';
import { iconColor } from '../core/IconColor.ts';
import type { Stats } from '../core/Stats.ts';
import type { Weapon } from '../player/Weapon.ts';
import type { Enemy } from '../world/Enemy.ts';
import { short } from './Format.ts';
import { glyph, type GlyphName } from './Glyphs.ts';
import { bar, panel, ui } from './UiKit.ts';

/**
 * ТРИ ИКОНКИ НАД ВРАГОМ — ядро игры.
 *
 * Цвет считается из фактического оружия против фактической защиты той же
 * функцией отношения, что кормит формулу урона (core/IconColor.ts). Кеша между
 * кадрами нет намеренно: любое расхождение иконки с реальным уроном ломает
 * единственный механизм принятия решений в игре.
 *
 * Форма иконки разная не для красоты: на шести дюймах цвет читается быстрее,
 * но различать типы только по цвету нельзя.
 */

const TIER_MARK: Record<Enemy['tier'], GlyphName | null> = {
  normal: null,
  elite: 'shield',
  miniboss: 'star',
  // Островной босс помечен тем же значком, что и мини-босс: отдельная иконка
  // ранга ему не нужна, его выдаёт размер фигуры и кольцо арены под ногами.
  boss: 'star',
};

export function drawBadge(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  stats: Stats,
  weapons: Record<DamageType, Weapon>,
): void {
  const u = ui();
  // Размер плашки от тира не зависит: мини-босс вдвое крупнее обычного врага,
  // и вместе с ним раздувалась полоса HP — она заслоняла полэкрана, а читать
  // её было не легче. Тир виден по значку слева и по размеру самой фигуры.
  const barWidth = u.enemyBarWidth;
  const barHeight = u.barHeight;
  const barTop = enemy.y - enemy.size / 2 - u.enemyBarOffset - barHeight;

  const chip = u.chipSize;
  const gap = u.chipGap;
  const marked = TIER_MARK[enemy.tier] !== null;
  // Значок ранга — часть той же строки, поэтому центрируется вся группа
  // целиком. Иначе у элит и мини-боссов иконки уезжают влево от фигуры.
  const rowWidth = chip * 3 + gap * 2 + (marked ? chip + gap : 0);
  const left = enemy.x - rowWidth / 2;
  const chipTop = barTop - u.chipOffset - chip;

  if (marked) drawTierMark(ctx, enemy, left, chipTop, chip);
  drawChips(ctx, enemy, stats, weapons, marked ? left + chip + gap : left, chipTop, chip, gap);

  bar(
    ctx,
    enemy.x - barWidth / 2, barTop, barWidth, barHeight,
    enemy.hpFraction,
    u.colors.hpEnemy,
    short(Math.max(0, enemy.hp)),
  );
}

function drawChips(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  stats: Stats,
  weapons: Record<DamageType, Weapon>,
  left: number,
  top: number,
  size: number,
  gap: number,
): void {
  const u = ui();
  DAMAGE_TYPES.forEach((type, index) => {
    const atk = weaponAttack(stats, type, weapons[type]);
    const color = iconColor(atk, enemy.def[type]);
    const x = left + index * (size + gap);
    panel(ctx, x, top, size, size, { fill: color, radius: size * 0.28 });
    glyph(ctx, type, x + size / 2, top + size / 2, size * 0.72, u.colors.outline, color);
  });
}

/** Элита и мини-босс помечены отдельным значком: к ним ходят адресно. */
function drawTierMark(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  x: number,
  y: number,
  size: number,
): void {
  const mark = TIER_MARK[enemy.tier];
  if (!mark) return;
  const u = ui();
  const fill = enemy.tier === 'miniboss' ? u.colors.gold : u.colors.chip;
  panel(ctx, x, y, size, size, { fill, radius: size * 0.28 });
  glyph(ctx, mark, x + size / 2, y + size / 2, size * 0.7, u.colors.outline, fill);
}

/**
 * Что роняет узел, значком типа копий под ногами. Это единственная причина
 * идти к конкретному мини-боссу («нужна палица — иду сюда»), и по трём
 * иконкам сверху её не прочитать: они говорят про урон, а не про дроп.
 * Обычным врагам не рисуется — копий они не дают.
 */
export function drawDropTag(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
  if (enemy.tier === 'normal') return;
  const u = ui();
  const size = u.chipSize * 0.95;
  // Ниже кольца ранга (Renderer.drawRankRing рисует эллипс высотой size/5),
  // иначе значок ложится прямо на него.
  const y = enemy.y + enemy.size / 2 + enemy.size / 5 + size * 0.6;
  panel(ctx, enemy.x - size / 2, y - size / 2, size, size, {
    fill: u.colors.gold,
    radius: size * 0.28,
  });
  glyph(ctx, enemy.copyType, enemy.x, y, size * 0.7, u.colors.outline, u.colors.gold);
}
