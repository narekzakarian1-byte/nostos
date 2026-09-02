import { getBalance } from '../core/Balance.ts';
import type { Rarity } from '../core/BalanceTypes.ts';
import { glyph } from './Glyphs.ts';
import { panel, text, ui } from './UiKit.ts';
import type { UpgradeRow } from './UpgradeScreen.ts';

/**
 * Нижняя полоса слотов из референса: квадрат с цветом редкости, значок типа в
 * углу, уровень в углу противоположном. Тап по слоту тратит копии и поднимает
 * уровень.
 *
 * Слоты, а не строки списка: строка сообщает то же самое, но занимает всю
 * ширину экрана и перехватывает тач по всей нижней полосе — джойстик под ней
 * переставал работать. Квадраты ловят тач только по себе.
 */
export interface SlotBox {
  readonly x: number;
  readonly y: number;
  readonly size: number;
}

/** Слоты по центру внизу: три оружия плюс запертый VIP-слот, как в референсе. */
export function slotBoxes(screenWidth: number, viewHeight: number): SlotBox[] {
  const u = ui();
  const count = getBalance().weapons.slots.length + (getBalance().weapons.vipSlot.enabled ? 1 : 0);
  const total = count * u.slotSize + (count - 1) * u.slotGap;
  const left = (screenWidth - total) / 2;
  const y = viewHeight - u.slotBottom - u.slotSize;
  const boxes: SlotBox[] = [];
  for (let i = 0; i < count; i++) {
    boxes.push({ x: left + i * (u.slotSize + u.slotGap), y, size: u.slotSize });
  }
  return boxes;
}

export function drawWeaponBar(
  ctx: CanvasRenderingContext2D,
  rows: readonly UpgradeRow[],
  screenWidth: number,
  viewHeight: number,
): void {
  const boxes = slotBoxes(screenWidth, viewHeight);
  rows.forEach((row, index) => {
    const box = boxes[index];
    if (box) drawSlot(ctx, row, box);
  });
  const locked = boxes[rows.length];
  if (locked) drawLockedSlot(ctx, locked);
}

function drawSlot(ctx: CanvasRenderingContext2D, row: UpgradeRow, box: SlotBox): void {
  const u = ui();
  const color = rarityColor(row.rarity);
  const { x, y, size } = box;

  panel(ctx, x, y, size, size, {
    fill: color,
    radius: u.radius,
    stroke: row.ready ? u.colors.ready : u.colors.outline,
    lineWidth: row.ready ? u.outline * 1.6 : u.outline,
  });

  glyph(ctx, row.type, x + size / 2, y + size * 0.46, size * 0.62, u.colors.outline, color);

  // Значок типа в углу — по нему слот находят взглядом, не читая.
  const chip = u.slotChip;
  panel(ctx, x - chip * 0.2, y - chip * 0.2, chip, chip, {
    fill: color,
    radius: chip * 0.3,
  });
  glyph(ctx, row.type, x - chip * 0.2 + chip / 2, y - chip * 0.2 + chip / 2, chip * 0.66,
    u.colors.outline, color);

  text(ctx, String(row.level), x + size - u.pillPad * 0.4, y + size - u.fontBody * 0.6, {
    size: u.fontBody,
    align: 'right',
  });

  // Подпись над квадратом, а не под ним: под ним нижняя кромка экрана и
  // безопасная зона телефона, и цифра там обрезается.
  text(ctx, row.ready ? 'ГОТОВО' : `${row.copies}/${row.cost}`, x + size / 2, y - u.fontSmall * 0.8, {
    size: u.fontSmall,
    fill: row.ready ? u.colors.ready : u.colors.textDim,
  });
}

function drawLockedSlot(ctx: CanvasRenderingContext2D, box: SlotBox): void {
  const u = ui();
  const { vipSlot } = getBalance().weapons;
  const { x, y, size } = box;

  ctx.save();
  ctx.globalAlpha = u.joystickAlpha * 2;
  panel(ctx, x, y, size, size, { fill: u.colors.panelDark, radius: u.radius });
  ctx.restore();
  panel(ctx, x, y, size, size, { radius: u.radius });

  glyph(ctx, 'lock', x + size / 2, y + size / 2, size * 0.5, u.colors.gold);
  text(ctx, `VIP ${vipSlot.unlockFreeAtIsland}`, x + size / 2, y - u.fontSmall * 0.8, {
    size: u.fontSmall,
    fill: u.colors.gold,
  });
}

export function rarityColor(rarity: Rarity): string {
  return ui().rarityColors[rarity];
}

/** По какому слоту пришёлся тап, или null — тогда тач уходит джойстику. */
export function slotAt(
  x: number, y: number, screenWidth: number, viewHeight: number, count: number,
): number | null {
  const boxes = slotBoxes(screenWidth, viewHeight);
  for (let i = 0; i < Math.min(count, boxes.length); i++) {
    const box = boxes[i]!;
    if (x >= box.x && x <= box.x + box.size && y >= box.y && y <= box.y + box.size) return i;
  }
  return null;
}
