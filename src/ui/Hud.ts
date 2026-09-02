import { getBalance } from '../core/Balance.ts';
import type { Game } from '../core/Game.ts';
import { timeUntilRegen } from '../core/Regen.ts';
import { duration, short } from './Format.ts';
import { glyph, type GlyphName } from './Glyphs.ts';
import { measure, panel, text, ui } from './UiKit.ts';
import type { UpgradeRow } from './UpgradeScreen.ts';

/**
 * Интерфейс поверх мира, разложенный как в референсе: кнопки-квадраты в углу,
 * столбик информационных плашек под ними, кнопки магазина и сумки справа.
 *
 * Сплошной полосы сверху нет намеренно — она съедала верхнюю восьмую экрана,
 * а всё, что на ней стояло, помещается в четыре плашки шириной по тексту.
 */
export type HudButton = 'settings' | 'shop' | 'bag';

interface ButtonBox {
  readonly id: HudButton;
  readonly x: number;
  readonly y: number;
  readonly size: number;
}

const BUTTON_GLYPH: Record<HudButton, GlyphName> = {
  settings: 'gear',
  shop: 'shop',
  bag: 'bag',
};

/**
 * Цвет кнопки по её назначению, как в референсе: зелёная лавка и коричневая
 * сумка находятся боковым зрением, три одинаковых серых квадрата — нет.
 */
const BUTTON_FILL: Record<HudButton, () => string> = {
  settings: () => ui().colors.button,
  shop: () => ui().colors.buttonShop,
  bag: () => ui().colors.buttonBag,
};

export function hudButtons(screenWidth: number, viewHeight: number): ButtonBox[] {
  const u = ui();
  const { minimap } = getBalance();
  const size = u.buttonSize;
  const right = screenWidth - u.margin - size;
  // Правый столбик начинается под миникартой: она стоит в том же углу.
  const underMap = u.margin * 2 + minimap.screenRadius * 2;
  return [
    { id: 'settings', x: u.margin, y: u.margin, size },
    { id: 'shop', x: right, y: Math.max(underMap, viewHeight * 0.36), size },
    { id: 'bag', x: right, y: Math.max(underMap, viewHeight * 0.36) + size + u.buttonGap, size },
  ];
}

export function hudButtonAt(x: number, y: number, screenWidth: number, viewHeight: number): HudButton | null {
  for (const box of hudButtons(screenWidth, viewHeight)) {
    if (x >= box.x && x <= box.x + box.size && y >= box.y && y <= box.y + box.size) return box.id;
  }
  return null;
}

export function drawHud(
  ctx: CanvasRenderingContext2D,
  game: Game,
  rows: readonly UpgradeRow[],
  screenWidth: number,
  viewHeight: number,
): void {
  const u = ui();

  for (const box of hudButtons(screenWidth, viewHeight)) {
    const fill = box.id === 'settings' && game.muted ? u.colors.buttonDark : BUTTON_FILL[box.id]();
    panel(ctx, box.x, box.y, box.size, box.size, { fill });
    glyph(ctx, BUTTON_GLYPH[box.id], box.x + box.size / 2, box.y + box.size / 2,
      box.size * 0.62, u.colors.outline, fill);
  }

  drawInfoColumn(ctx, game, rows);
  drawToast(ctx, game, screenWidth);
}

/** Столбик плашек под кнопкой настроек: DPS, HP, реген, готовность апгрейда. */
function drawInfoColumn(
  ctx: CanvasRenderingContext2D,
  game: Game,
  rows: readonly UpgradeRow[],
): void {
  const u = ui();
  const { regen } = getBalance();
  const player = game.player;
  let y = u.margin + u.buttonSize + u.buttonGap;

  // Без цели currentDps равен нулю, и плашка сообщает «у тебя нет урона».
  // Показываем урон по эталонному врагу острова — то же число, что и в панели
  // апгрейда, поэтому они не расходятся.
  const dps = game.currentDps > 0 ? game.currentDps : (rows[0]?.dpsNow ?? 0);
  y = pill(ctx, u.margin, y, 'sword', short(dps), u.colors.text);
  y = pill(ctx, u.margin, y, 'heart', short(Math.max(0, player.hp)), u.colors.hpPlayer);

  const waiting = timeUntilRegen(player, regen.player);
  y = pill(
    ctx, u.margin, y, 'plus',
    waiting > 0 ? duration(waiting) : `+${short(player.maxHp * regen.player.rate)}/с`,
    waiting > 0 ? u.colors.textDim : u.colors.hpPlayer,
  );

  // «ГОТОВО!» из референса, но со смыслом: копий хватает хотя бы на один
  // уровень. Иначе полосу слотов внизу приходится проверять глазами.
  if (rows.some((row) => row.ready)) {
    y = pill(ctx, u.margin, y, 'star', 'ГОТОВО!', u.colors.ready, u.colors.ready);
  }

  const respawn = nearestRespawn(game);
  if (respawn !== null) pill(ctx, u.margin, y, 'hourglass', duration(respawn), u.colors.textDim);
}

/** Ближайшее воскрешение узла — референсный «песочные часы 3h 6m». */
function nearestRespawn(game: Game): number | null {
  let best: number | null = null;
  for (const enemy of game.enemies) {
    if (enemy.alive) continue;
    if (best === null || enemy.respawnIn < best) best = enemy.respawnIn;
  }
  return best;
}

/** Плашка «значок + текст» шириной по содержимому. Возвращает y следующей. */
function pill(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  icon: GlyphName,
  value: string,
  valueColor: string,
  fill?: string,
): number {
  const u = ui();
  const h = u.pillHeight;
  const iconSize = h * 0.62;
  const width = u.pillPad * 2 + iconSize + u.chipGap + measure(ctx, value, u.fontBody);

  panel(ctx, x, y, width, h, { fill: fill ?? u.colors.panelDark, radius: h / 2 });
  glyph(ctx, icon, x + u.pillPad + iconSize / 2, y + h / 2, iconSize,
    fill ? u.colors.outline : u.colors.chip, fill ?? u.colors.panelDark);
  text(ctx, value, x + u.pillPad + iconSize + u.chipGap, y + h / 2, {
    size: u.fontBody,
    align: 'left',
    fill: fill ? u.colors.outline : valueColor,
    outline: fill ? 0 : u.outline,
  });

  return y + h + u.chipGap;
}

/** Уведомление о дропе редкости: без него лучший дроп в игре проходит незамеченным. */
function drawToast(ctx: CanvasRenderingContext2D, game: Game, screenWidth: number): void {
  if (!game.toast) return;
  const u = ui();
  const width = measure(ctx, game.toast, u.fontBody) + u.pillPad * 4;
  const x = (screenWidth - width) / 2;
  const y = getBalance().render.hudHeight;
  panel(ctx, x, y, width, u.pillHeight, { fill: u.colors.gold, radius: u.pillHeight / 2 });
  text(ctx, game.toast, screenWidth / 2, y + u.pillHeight / 2, {
    size: u.fontBody,
    fill: u.colors.outline,
    outline: 0,
  });
}
