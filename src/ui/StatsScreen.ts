import { getBalance } from '../core/Balance.ts';
import type { Game } from '../core/Game.ts';
import { percent, short } from './Format.ts';
import { glyph, type GlyphName } from './Glyphs.ts';
import { panel, text, ui } from './UiKit.ts';
import { formatDps, type UpgradeRow } from './UpgradeScreen.ts';
import { rarityColor } from './WeaponBar.ts';
import { RARITY_RU, TYPE_RU } from '../player/Weapon.ts';

/**
 * Экран «Характеристики + Инвентарь» из референса, по кнопке сумки.
 *
 * Полоса слотов внизу отвечает на «что нажать прямо сейчас», а этот экран —
 * на «во что я вырос»: одиннадцать статов в бою не читаются, но между
 * заходами их хочется видеть целиком.
 */
interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

interface Layout {
  readonly sheet: Rect;
  readonly close: Rect;
  /** Верх первой строки плиток со статами. */
  readonly tilesTop: number;
  readonly invTitleY: number;
  readonly cards: readonly Rect[];
}

const TILE_ROWS = 3;
const CARD_COUNT = 3;

/**
 * Один расчёт раскладки на всех: и отрисовка, и попадание тапа берут
 * координаты отсюда. Высота листа считается по содержимому — панель на весь
 * экран с пустой нижней половиной выглядит как незагрузившийся экран.
 */
function layout(screenWidth: number, viewHeight: number): Layout {
  const u = ui();
  const x = u.margin;
  const y = u.margin * 2;
  const w = screenWidth - u.margin * 2;

  const tilesTop = y + u.sheetPad * 2 + u.fontTitle;
  const tilesHeight = TILE_ROWS * (u.statTileHeight + u.chipGap);
  const invTitleY = tilesTop + tilesHeight + u.fontTitle;
  const cardsTop = invTitleY + u.fontTitle;

  const cards: Rect[] = [];
  for (let i = 0; i < CARD_COUNT; i++) {
    cards.push({
      x: x + u.sheetPad,
      y: cardsTop + i * (u.cardHeight + u.chipGap),
      w: w - u.sheetPad * 2,
      h: u.cardHeight,
    });
  }

  const bottom = cardsTop + CARD_COUNT * (u.cardHeight + u.chipGap) + u.sheetPad;
  const sheet: Rect = { x, y, w, h: Math.min(bottom - y, viewHeight - u.margin * 4) };
  const close: Rect = {
    x: x + w - u.buttonSize - u.sheetPad,
    y: y + u.sheetPad,
    w: u.buttonSize,
    h: u.buttonSize,
  };
  return { sheet, close, tilesTop, invTitleY, cards };
}

export function drawStatsScreen(
  ctx: CanvasRenderingContext2D,
  game: Game,
  rows: readonly UpgradeRow[],
  screenWidth: number,
  viewHeight: number,
): void {
  const u = ui();
  const { regen } = getBalance();
  const stats = game.player.stats;
  const { sheet, close, tilesTop, invTitleY, cards } = layout(screenWidth, viewHeight);

  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = u.colors.veil;
  ctx.fillRect(0, 0, screenWidth, viewHeight);
  ctx.restore();

  panel(ctx, sheet.x, sheet.y, sheet.w, sheet.h, { fill: u.colors.sheet, radius: u.radius * 2 });
  text(ctx, 'ХАРАКТЕРИСТИКИ', sheet.x + sheet.w / 2, sheet.y + u.sheetPad + u.fontTitle / 2, {
    size: u.fontTitle,
    fill: u.colors.textDim,
  });

  panel(ctx, close.x, close.y, close.w, close.h, { fill: u.colors.alert });
  glyph(ctx, 'close', close.x + close.w / 2, close.y + close.h / 2, close.w * 0.6, u.colors.text);

  // Без цели DPS равен нулю: показываем урон по эталонному врагу острова —
  // ровно то же число, что стоит в карточках оружия ниже.
  const dps = game.currentDps > 0 ? game.currentDps : (rows[0]?.dpsNow ?? 0);
  const left = sheet.x + u.sheetPad;
  const inner = sheet.w - u.sheetPad * 2;
  let y = tilesTop;
  y = drawTileRow(ctx, left, y, inner, [
    ['sword', 'DPS', short(dps)],
    ['heart', 'HP', short(stats.maxHp)],
    ['plus', 'РЕГЕН', short(stats.maxHp * regen.player.rate)],
  ]);
  y = drawTileRow(ctx, left, y, inner, [
    ['pierce', 'АТК', short(stats.atk('pierce'))],
    ['slash', 'АТК', short(stats.atk('slash'))],
    ['crush', 'АТК', short(stats.atk('crush'))],
  ]);
  drawTileRow(ctx, left, y, inner, [
    ['shield', 'ЗАЩ', short(stats.def('pierce') + stats.def('slash') + stats.def('crush'))],
    ['star', 'КРИТ', percent(stats.critChance)],
    ['dodge', 'УКЛОН', percent(stats.dodgeChance)],
  ]);

  text(ctx, 'ИНВЕНТАРЬ', sheet.x + sheet.w / 2, invTitleY, {
    size: u.fontTitle,
    fill: u.colors.textDim,
  });

  rows.forEach((row, index) => {
    const box = cards[index];
    if (box) drawCard(ctx, row, box);
  });
}

type Tile = readonly [GlyphName, string, string];

function drawTileRow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, width: number,
  tiles: readonly Tile[],
): number {
  const u = ui();
  const gap = u.chipGap;
  const w = (width - gap * (tiles.length - 1)) / tiles.length;

  tiles.forEach(([icon, label, value], index) => {
    const left = x + index * (w + gap);
    panel(ctx, left, y, w, u.statTileHeight, { fill: u.colors.panelDark });
    const iconSize = u.statTileHeight * 0.5;
    glyph(ctx, icon, left + u.pillPad + iconSize / 2, y + u.statTileHeight / 2, iconSize,
      u.colors.chip, u.colors.panelDark);
    text(ctx, value, left + w - u.pillPad, y + u.statTileHeight * 0.36, {
      size: u.fontBody,
      align: 'right',
    });
    text(ctx, label, left + w - u.pillPad, y + u.statTileHeight * 0.74, {
      size: u.fontSmall,
      align: 'right',
      fill: u.colors.textDim,
      outline: 0,
    });
  });

  return y + u.statTileHeight + gap;
}

function drawCard(ctx: CanvasRenderingContext2D, row: UpgradeRow, box: Rect): void {
  const u = ui();
  const color = rarityColor(row.rarity);
  panel(ctx, box.x, box.y, box.w, box.h, { fill: u.colors.panel });

  const icon = box.h - u.chipGap * 2;
  panel(ctx, box.x + u.chipGap, box.y + u.chipGap, icon, icon, { fill: color });
  glyph(ctx, row.type, box.x + u.chipGap + icon / 2, box.y + box.h / 2, icon * 0.62,
    u.colors.outline, color);

  const left = box.x + icon + u.chipGap * 3;
  text(ctx, `${TYPE_RU[row.type]} · ${RARITY_RU[row.rarity]}`, left, box.y + box.h * 0.3, {
    size: u.fontBody,
    align: 'left',
  });
  text(ctx, `ур. ${row.level} · копий ${row.copies}/${row.cost}`, left, box.y + box.h * 0.62, {
    size: u.fontSmall,
    align: 'left',
    fill: u.colors.textDim,
  });
  text(ctx, `${formatDps(row.dpsNow)} → ${formatDps(row.dpsNext)}`, left, box.y + box.h * 0.86, {
    size: u.fontSmall,
    align: 'left',
    fill: row.ready ? u.colors.ready : u.colors.textDim,
  });

  const bw = u.buttonSize * 2;
  const bx = box.x + box.w - bw - u.chipGap;
  const by = box.y + (box.h - u.pillHeight) / 2;
  panel(ctx, bx, by, bw, u.pillHeight, {
    fill: row.ready ? u.colors.ready : u.colors.panelDark,
    radius: u.pillHeight / 2,
  });
  text(ctx, row.ready ? 'УЛУЧШИТЬ' : `${row.copies}/${row.cost}`, bx + bw / 2, by + u.pillHeight / 2, {
    size: u.fontSmall,
    fill: row.ready ? u.colors.outline : u.colors.textDim,
    outline: row.ready ? 0 : u.outline,
  });
}

/** Тап по экрану характеристик: 'close', индекс карточки оружия, или null. */
export function statsTap(
  x: number, y: number, screenWidth: number, viewHeight: number,
): 'close' | number | null {
  const { close, cards } = layout(screenWidth, viewHeight);
  if (inside(close, x, y)) return 'close';
  for (let i = 0; i < cards.length; i++) {
    if (inside(cards[i]!, x, y)) return i;
  }
  return null;
}

function inside(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
