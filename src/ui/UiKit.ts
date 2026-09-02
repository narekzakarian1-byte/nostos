import { getBalance } from '../core/Balance.ts';
import type { UiColors, UiConfig } from '../core/BalanceTypes.ts';

/**
 * Общий словарь интерфейса по референсу: скруглённая плашка, толстый тёмный
 * контур, белый текст с обводкой. Все модули ui/ рисуют этими четырьмя
 * функциями, поэтому панели нельзя случайно развести по стилю.
 *
 * Числа и цвета — из balance.json.ui, ни одного значения здесь не задано.
 */
export function ui(): UiConfig {
  return getBalance().ui;
}

export function colors(): UiColors {
  return getBalance().ui.colors;
}

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export interface PanelStyle {
  readonly fill?: string;
  /** null — без контура. По умолчанию тёмный контур из ui.colors.outline. */
  readonly stroke?: string | null;
  readonly radius?: number;
  readonly lineWidth?: number;
}

/** Плашка: заливка + тёмный контур. Основа всего интерфейса. */
export function panel(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  style: PanelStyle = {},
): void {
  const u = ui();
  roundRectPath(ctx, x, y, w, h, style.radius ?? u.radius);
  if (style.fill) {
    ctx.fillStyle = style.fill;
    ctx.fill();
  }
  const stroke = style.stroke === undefined ? u.colors.outline : style.stroke;
  if (stroke) {
    ctx.lineWidth = style.lineWidth ?? u.outline;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

export interface TextStyle {
  readonly size?: number;
  readonly fill?: string;
  readonly align?: CanvasTextAlign;
  readonly baseline?: CanvasTextBaseline;
  /** Толщина тёмной обводки. 0 — без неё (для текста на светлой плашке). */
  readonly outline?: number;
  readonly outlineColor?: string;
}

/**
 * Белый жирный текст с тёмной обводкой. Обводка не украшение: подписи лежат
 * прямо на земле и на спрайтах врагов, и без неё «384K» пропадает на светлом.
 */
export function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number, y: number,
  style: TextStyle = {},
): void {
  const u = ui();
  const size = style.size ?? u.fontBody;
  ctx.font = `bold ${size}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = style.align ?? 'center';
  ctx.textBaseline = style.baseline ?? 'middle';

  const width = style.outline ?? u.textOutline;
  if (width > 0) {
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = style.outlineColor ?? u.colors.outline;
    ctx.strokeText(value, x, y);
  }
  ctx.fillStyle = style.fill ?? u.colors.text;
  ctx.fillText(value, x, y);
}

/** Ширина строки в тех же метриках, что и text() — для авторазмера плашек. */
export function measure(ctx: CanvasRenderingContext2D, value: string, size: number): number {
  ctx.font = `bold ${size}px system-ui, -apple-system, sans-serif`;
  return ctx.measureText(value).width;
}

/**
 * Полоса здоровья: тёмное ложе, цветная заливка, контур и число внутри.
 * Одна функция и над врагом, и над игроком — иначе две полосы разъезжаются
 * по толщине и читаются как разные сущности.
 */
export function bar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  fraction: number,
  fill: string,
  label?: string,
): void {
  const u = ui();
  const radius = h / 2;
  panel(ctx, x, y, w, h, { fill: u.colors.hpBack, radius });

  const filled = Math.max(0, Math.min(1, fraction)) * w;
  if (filled > 0) {
    ctx.save();
    roundRectPath(ctx, x, y, w, h, radius);
    ctx.clip();
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, filled, h);
    ctx.restore();
  }
  panel(ctx, x, y, w, h, { radius });

  if (label) {
    text(ctx, label, x + w / 2, y + h / 2, { size: h * 0.82, outline: u.outline });
  }
}

/**
 * Мягкая тень-эллипс под ногами: без неё фигуры «висят» над землёй.
 * alphaScale гасит её вместе с фигурой, когда та растворяется при смерти.
 */
export function groundShadow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number,
  alphaScale = 1,
): void {
  const u = ui();
  const p = getBalance().props;
  // Снос по тому же свету, что у пропов (props/Optics.ts считает его так же):
  // тень колонны уезжает влево, а тень игрока лежала бы строго под ним, и
  // сцена читалась бы как два разных освещения на одной поляне.
  const lift = size * u.shadowLean;
  ctx.save();
  ctx.globalAlpha = u.shadowAlpha * alphaScale;
  ctx.fillStyle = p.shadowColor;
  ctx.beginPath();
  ctx.ellipse(
    x - (p.lightX / p.lightZ) * lift,
    y - (p.lightY / p.lightZ) * lift,
    (size / 2) * u.shadowScale * 2, (size / 2) * u.shadowScale, 0, 0, Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
}
