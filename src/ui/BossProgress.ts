import { getBalance } from '../core/Balance.ts';
import type { Attempt } from '../world/Gate.ts';
import { islandDef } from '../world/Island.ts';
import { bar, panel, text, ui } from './UiKit.ts';

/**
 * Экран прогресса после попытки по боссу (GDD §6.3).
 *
 *         ПОЛИФЕМ
 *   ▓▓▓▓▓▓▓▓▓▓▓░░░░░  68%
 *   прошлый раз — 54%
 *
 * Дельта здесь важнее самого процента: одно число говорит «я не смог», два —
 * «я стал ближе». Это самый сильный экран монетизации в игре именно потому,
 * что ничего не продаёт.
 */
export function drawBossProgress(
  ctx: CanvasRenderingContext2D,
  attempt: Attempt,
  screenWidth: number,
  viewHeight: number,
): void {
  const u = ui();
  const { prototype } = getBalance();
  const island = islandDef(prototype.islandNumber);
  const won = attempt.progress >= 1;

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = u.colors.veil;
  ctx.globalAlpha = 0.72;
  ctx.fillRect(0, 0, screenWidth, viewHeight);
  ctx.globalAlpha = 1;

  // Высота считается от содержимого: без строки «прошлый раз» в листе зияла
  // бы пустая треть, а пустота на экране из трёх строк читается как ошибка.
  const deltaBlock = u.barHeight + u.chipGap + u.fontSmall * 2;
  const w = u.gateSheetWidth;
  const h = u.gateSheetHeight - (attempt.previous === null ? deltaBlock : 0);
  const x = (screenWidth - w) / 2;
  const y = (viewHeight - h) / 2;
  panel(ctx, x, y, w, h, { fill: u.colors.sheet, radius: u.radius * 2 });

  const center = screenWidth / 2;
  let row = y + u.sheetPad * 2;

  text(ctx, island.boss.toUpperCase(), center, row + u.fontTitle / 2, {
    size: u.fontTitle,
    fill: won ? u.colors.gold : u.colors.text,
  });
  row += u.fontTitle + u.sheetPad * 1.5;

  const barX = center - u.gateBarWidth / 2;
  bar(
    ctx, barX, row, u.gateBarWidth, u.gateBarHeight,
    attempt.progress,
    won ? u.colors.gold : u.colors.hpEnemy,
    percentLabel(attempt.progress),
  );
  row += u.gateBarHeight + u.sheetPad;

  // Прошлая попытка — тонкой полосой под основной: «стало» и «было» должны
  // стоять рядом, иначе дельту приходится держать в голове.
  if (attempt.previous !== null) {
    bar(
      ctx, barX, row, u.gateBarWidth, u.barHeight,
      attempt.previous,
      u.colors.panelDark,
    );
    row += u.barHeight + u.chipGap;
    text(ctx, `прошлый раз — ${percentLabel(attempt.previous)}`, center, row + u.fontSmall, {
      size: u.fontSmall,
      fill: u.colors.textDim,
    });
  }

  text(ctx, won ? 'ОСТРОВ ПРОЙДЕН' : hint(attempt, island.bossWeakness), center, y + h - u.sheetPad * 2, {
    size: u.fontBody,
    fill: won ? u.colors.ready : u.colors.textDim,
  });

  ctx.restore();
}

/**
 * Подсказка вместо приговора. Слабость босса названа прямо: адрес гринда —
 * это честная альтернатива донату (GDD §6.5), и прятать его незачем.
 */
function hint(attempt: Attempt, weakness: string): string {
  const grew = attempt.previous !== null && attempt.progress > attempt.previous;
  if (grew) return 'ты стал ближе';
  return `он слаб к: ${WEAKNESS_RU[weakness] ?? weakness}`;
}

const WEAKNESS_RU: Record<string, string> = {
  pierce: 'колющему',
  slash: 'рубящему',
  crush: 'дробящему',
  any: 'любому урону',
};

function percentLabel(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
