import type { DamageType } from '../core/BalanceTypes.ts';
import { TYPE_GLYPHS } from './TypeGlyphs.ts';
import { colors } from './UiKit.ts';

/**
 * Векторные иконки интерфейса. Рисуются кодом, а не грузятся картинками:
 * иконка должна быть читаема на шести дюймах при любом размере плашки, а
 * растровый набор под каждый размер — это ещё пятнадцать файлов, которые
 * невозможно перекрасить под состояние кнопки.
 *
 * Каждый глиф живёт в квадрате [-0.5, 0.5] вокруг нуля, glyph() его двигает
 * и масштабирует. Числа внутри — пропорции рисунка, не баланс.
 */
export type ChromeGlyph =
  | 'gear' | 'mail' | 'skull' | 'hourglass' | 'bag' | 'shop' | 'magnifier'
  | 'lock' | 'shield' | 'heart' | 'sword' | 'plus' | 'star' | 'close' | 'dodge';

/** Иконки интерфейса плюс три типа урона — они живут в TypeGlyphs.ts. */
export type GlyphName = ChromeGlyph | DamageType;

export function glyph(
  ctx: CanvasRenderingContext2D,
  name: GlyphName,
  cx: number,
  cy: number,
  size: number,
  color: string,
  detail?: string,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(size, size);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  DRAW[name](ctx, color, detail ?? colors().outline);
  ctx.restore();
}

export type Draw = (ctx: CanvasRenderingContext2D, color: string, detail: string) => void;

export function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function poly(ctx: CanvasRenderingContext2D, points: readonly number[], fill: string): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(points[0]!, points[1]!);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i]!, points[i + 1]!);
  ctx.closePath();
  ctx.fill();
}

const CHROME: Record<ChromeGlyph, Draw> = {
  gear: (ctx, color, detail) => {
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.rotate((Math.PI / 4) * i);
      ctx.fillStyle = color;
      ctx.fillRect(-0.09, -0.5, 0.18, 0.26);
      ctx.restore();
    }
    circle(ctx, 0, 0, 0.34, color);
    circle(ctx, 0, 0, 0.13, detail);
  },

  mail: (ctx, color, detail) => {
    ctx.fillStyle = color;
    ctx.fillRect(-0.44, -0.3, 0.88, 0.6);
    ctx.strokeStyle = detail;
    ctx.lineWidth = 0.08;
    ctx.beginPath();
    ctx.moveTo(-0.44, -0.3);
    ctx.lineTo(0, 0.08);
    ctx.lineTo(0.44, -0.3);
    ctx.stroke();
  },

  skull: (ctx, color, detail) => {
    circle(ctx, 0, -0.08, 0.4, color);
    ctx.fillStyle = color;
    ctx.fillRect(-0.22, 0.14, 0.44, 0.24);
    circle(ctx, -0.16, -0.06, 0.12, detail);
    circle(ctx, 0.16, -0.06, 0.12, detail);
    ctx.fillStyle = detail;
    ctx.fillRect(-0.05, 0.16, 0.1, 0.18);
  },

  hourglass: (ctx, color, detail) => {
    ctx.fillStyle = color;
    ctx.fillRect(-0.34, -0.46, 0.68, 0.1);
    ctx.fillRect(-0.34, 0.36, 0.68, 0.1);
    poly(ctx, [-0.28, -0.36, 0.28, -0.36, 0, 0], color);
    poly(ctx, [-0.28, 0.36, 0.28, 0.36, 0, 0], color);
    circle(ctx, 0, 0.2, 0.09, detail);
  },

  bag: (ctx, color, detail) => {
    ctx.fillStyle = color;
    ctx.fillRect(-0.42, -0.18, 0.84, 0.6);
    ctx.strokeStyle = detail;
    ctx.lineWidth = 0.09;
    ctx.beginPath();
    ctx.arc(0, -0.16, 0.26, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = detail;
    ctx.fillRect(-0.11, 0.02, 0.22, 0.18);
  },

  shop: (ctx, color, detail) => {
    poly(ctx, [-0.5, -0.06, -0.32, -0.42, 0.32, -0.42, 0.5, -0.06], color);
    ctx.fillStyle = detail;
    ctx.fillRect(-0.38, -0.02, 0.76, 0.44);
    ctx.fillStyle = color;
    ctx.fillRect(-0.24, 0.08, 0.48, 0.26);
  },

  magnifier: (ctx, color, detail) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.13;
    ctx.beginPath();
    ctx.arc(-0.08, -0.08, 0.28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0.13, 0.13);
    ctx.lineTo(0.42, 0.42);
    ctx.stroke();
    circle(ctx, -0.08, -0.08, 0.19, detail);
  },

  lock: (ctx, color, detail) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.12;
    ctx.beginPath();
    ctx.arc(0, -0.16, 0.22, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(-0.33, -0.12, 0.66, 0.48);
    circle(ctx, 0, 0.1, 0.08, detail);
  },

  shield: (ctx, color, detail) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -0.46);
    ctx.lineTo(0.4, -0.28);
    ctx.lineTo(0.4, 0.08);
    ctx.quadraticCurveTo(0.4, 0.38, 0, 0.48);
    ctx.quadraticCurveTo(-0.4, 0.38, -0.4, 0.08);
    ctx.lineTo(-0.4, -0.28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = detail;
    ctx.fillRect(-0.06, -0.24, 0.12, 0.46);
  },

  heart: (ctx, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0.44);
    ctx.bezierCurveTo(-0.62, 0.04, -0.4, -0.46, 0, -0.18);
    ctx.bezierCurveTo(0.4, -0.46, 0.62, 0.04, 0, 0.44);
    ctx.closePath();
    ctx.fill();
  },

  sword: (ctx, color, detail) => {
    poly(ctx, [0.34, -0.46, 0.46, -0.34, -0.16, 0.3, -0.3, 0.3, -0.3, 0.16], color);
    ctx.strokeStyle = detail;
    ctx.lineWidth = 0.1;
    ctx.beginPath();
    ctx.moveTo(-0.34, 0.06);
    ctx.lineTo(0.06, 0.46);
    ctx.stroke();
  },

  plus: (ctx, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(-0.14, -0.44, 0.28, 0.88);
    ctx.fillRect(-0.44, -0.14, 0.88, 0.28);
  },

  star: (ctx, color) => {
    const points: number[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const r = i % 2 === 0 ? 0.48 : 0.21;
      points.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    poly(ctx, points, color);
  },

  // Уклонение — две встречные стрелки: замок на этой плашке читался как
  // «характеристика закрыта», а не как «увернулся».
  dodge: (ctx, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.13;
    // Две «птички» в одну сторону, как перемотка: зеркальные складывались в
    // крестик и читались как кнопка закрытия.
    for (const shift of [-0.26, 0.1]) {
      ctx.beginPath();
      ctx.moveTo(shift, -0.3);
      ctx.lineTo(shift + 0.3, 0);
      ctx.lineTo(shift, 0.3);
      ctx.stroke();
    }
  },

  close: (ctx, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.17;
    ctx.beginPath();
    ctx.moveTo(-0.3, -0.3);
    ctx.lineTo(0.3, 0.3);
    ctx.moveTo(0.3, -0.3);
    ctx.lineTo(-0.3, 0.3);
    ctx.stroke();
  },
};

const DRAW: Record<GlyphName, Draw> = { ...CHROME, ...TYPE_GLYPHS };
