import type { DamageType } from '../core/BalanceTypes.ts';
import { poly, type Draw } from './Glyphs.ts';

/**
 * Три иконки типов урона — те самые, что висят над каждым врагом.
 *
 * Вынесены из общего набора иконок отдельно, потому что это не оформление:
 * различать копьё, меч и палицу игрок обязан мгновенно и не по цвету одному
 * (CLAUDE.md §6). На четырнадцати единицах разница должна ловиться силуэтом —
 * узкое остриё, широкий полумесяц, тяжёлый обух.
 */
export const TYPE_GLYPHS: Record<DamageType, Draw> = {
  pierce: (ctx, color, detail) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.11;
    ctx.beginPath();
    ctx.moveTo(-0.4, 0.4);
    ctx.lineTo(0.16, -0.16);
    ctx.stroke();
    poly(ctx, [0.46, -0.46, 0.46, -0.06, 0.06, -0.46], color);
    ctx.fillStyle = detail;
    ctx.fillRect(-0.02, -0.02, 0.04, 0.04);
  },

  slash: (ctx, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-0.44, 0.42);
    ctx.quadraticCurveTo(0.1, 0.28, 0.44, -0.42);
    ctx.quadraticCurveTo(0.1, 0.0, -0.44, 0.12);
    ctx.closePath();
    ctx.fill();
  },

  crush: (ctx, color, detail) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.13;
    ctx.beginPath();
    ctx.moveTo(-0.4, 0.4);
    ctx.lineTo(0.1, -0.1);
    ctx.stroke();
    // Обух поперёк рукояти: без поворота молот читается как то же остриё.
    ctx.save();
    ctx.translate(0.25, -0.25);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = color;
    ctx.fillRect(-0.3, -0.15, 0.6, 0.3);
    ctx.fillStyle = detail;
    ctx.fillRect(0.12, -0.15, 0.06, 0.3);
    ctx.restore();
  },
};
