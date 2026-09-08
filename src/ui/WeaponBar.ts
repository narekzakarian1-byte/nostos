import { getBalance } from '../core/Balance.ts';
import type { DamageType, Rarity } from '../core/BalanceTypes.ts';
import { glyph } from './Glyphs.ts';
import type { SpriteId } from './AssetManifest.ts';
import { sprites } from './Sprites.ts';
import { panel, text, ui } from './UiKit.ts';
import type { UpgradeRow } from './UpgradeScreen.ts';

/**
 * Нижняя полоса слотов из референса: квадрат с цветом редкости, значок типа в
 * углу, уровень в углу противоположном. Тап по слоту НАДЕВАЕТ оружие —
 * прокачка живёт на экране характеристик.
 *
 * Надетый слот обведён и приподнят. Без этой отметки игрок не знает, чем он
 * бьёт, а бьёт он ровно одним оружием: полоса перестала быть витриной и стала
 * органом управления.
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
  equipped: DamageType,
): void {
  const boxes = slotBoxes(screenWidth, viewHeight);
  rows.forEach((row, index) => {
    const box = boxes[index];
    if (box) drawSlot(ctx, row, box, row.type === equipped);
  });
  const locked = boxes[rows.length];
  if (locked) drawLockedSlot(ctx, locked);
}

function drawSlot(
  ctx: CanvasRenderingContext2D,
  row: UpgradeRow,
  box: SlotBox,
  equipped: boolean,
): void {
  const u = ui();
  const { equippedLift, equippedOutline } = getBalance().weapons;
  const color = rarityColor(row.rarity);
  const { x, size } = box;
  // Надетый слот приподнят: обводки мало — цветов на полосе и так четыре,
  // а сдвиг читается боковым зрением, не отрывая взгляда от боя.
  const y = box.y - (equipped ? equippedLift : 0);

  panel(ctx, x, y, size, size, {
    fill: color,
    radius: u.radius,
    stroke: equipped ? u.colors.gold : row.ready ? u.colors.ready : u.colors.outline,
    lineWidth: equipped ? u.outline * equippedOutline : row.ready ? u.outline * 1.6 : u.outline,
  });

  // В слоте лежит САМ предмет, а не значок его типа. Оружие множит стат атаки,
  // и разрыв между обычным и золотым больше чем вчетверо — при одинаковых
  // значках самая крупная находка в игре выглядела как та, что уже надета.
  // Значок типа при этом остаётся в углу: по нему слот находят взглядом.
  if (!drawWeaponArt(ctx, row.type, row.rarity, x + size / 2, y + size * 0.5, size * 0.82)) {
    glyph(ctx, row.type, x + size / 2, y + size * 0.46, size * 0.62, u.colors.outline, color);
  }

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

/** Вид оружия по типу урона. Тот же стол, что у фигуры в руке (ui/Figures.ts). */
const WEAPON_ART: Record<DamageType, string> = {
  slash: 'sword',
  pierce: 'spear',
  crush: 'club',
};

/**
 * Картинка предмета, вписанная в квадрат слота. Наклонена: вертикальное копьё
 * в квадратном слоте превращается в полоску шириной в пиксель, а под углом
 * оно занимает диагональ и остаётся узнаваемым.
 *
 * Возвращает false, если файла ещё нет, — тогда слот рисует прежний значок.
 */
function drawWeaponArt(
  ctx: CanvasRenderingContext2D,
  type: DamageType,
  rarity: Rarity,
  cx: number,
  cy: number,
  box: number,
): boolean {
  const id = `weapon-${WEAPON_ART[type]}-${rarity}` as SpriteId;
  const img = sprites.get(id);
  if (!img) return false;

  // Вписывание по большей стороне: копьё вчетверо выше своей ширины, и
  // делить квадрат на обе стороны сразу значит ужать его в шестнадцать раз.
  const aspect = img.naturalWidth / img.naturalHeight;
  const h = aspect > 1 ? box / aspect : box;
  const w = h * aspect;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(SLOT_TILT);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
  return true;
}

/** Наклон предмета в слоте, радианы. Техническая константа отрисовки. */
const SLOT_TILT = -0.55;

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
