import { getBalance } from '../core/Balance.ts';
import type { GroundPatch } from '../world/Ground.ts';
import { rgba } from './props/Optics.ts';

/**
 * Материал зоны на земле: кляксы и крапины на них.
 *
 * Отдельно от GroundPaint.ts, который отвечает за порядок слоёв печати — море,
 * суша, материал, кромка, свет. Здесь только то, как выглядит один материал под
 * ногами, и это единственное место, где решается, чем «Галечный берег»
 * отличается от «Площади у храма».
 */

/** Кляксы материала зон и крапины на них. */
export function paintPatches(ctx: CanvasRenderingContext2D, patches: readonly GroundPatch[]): void {
  for (const patch of patches) paintPatch(ctx, patch);
  // Крапины отдельным проходом: клякса, севшая позже, замыла бы крапины
  // соседки, и материал снова читался бы плоской заливкой.
  for (const patch of patches) speckle(ctx, patch);
}

/**
 * Одна клякса материала: полная сила в середине, растушёвка по краю.
 *
 * Растушёвка обязательна. Заливка сплошным эллипсом давала на стыке зон
 * ровные дуги — вместо неровной границы было видно, чем зону сеяли, и девять
 * квадратов читались плиткой ничуть не меньше, чем до всей затеи.
 */
function paintPatch(ctx: CanvasRenderingContext2D, patch: GroundPatch): void {
  const { patch: cfg, materials } = getBalance().terrain;
  const base = materials[patch.material][0];

  ctx.save();
  ctx.translate(patch.x, patch.y);
  ctx.rotate(patch.angle);
  ctx.scale(1, patch.ry / patch.rx);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, patch.rx);
  grad.addColorStop(0, base);
  grad.addColorStop(cfg.plateau, base);
  grad.addColorStop(1, rgba(base, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, patch.rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Крапины на кляксе. Плоская заливка любого цвета на четверть экрана читается
 * дырой в текстуре — той же болезнью, которой болела дорога до кладки.
 *
 * Сеются по ядру кляксы, а не по всему радиусу: на растушёванном краю материал
 * уже полупрозрачен, и крапины там повисли бы поверх чужого материала.
 */
function speckle(ctx: CanvasRenderingContext2D, patch: GroundPatch): void {
  const { patch: cfg, materials } = getBalance().terrain;
  const tones = materials[patch.material];
  const core = cfg.plateau;
  const count = Math.round(
    (patch.rx * patch.ry * core * core * Math.PI * cfg.speckPerCell)
    / (cfg.cellUnits * cfg.cellUnits),
  );
  // Своя последовательность на кляксу: сид из её координат, поэтому крапины
  // детерминированы и не зависят от порядка обхода.
  let seed = Math.floor(Math.abs(patch.x) * 131 + Math.abs(patch.y) * 977) + 1;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return ((seed >> 8) % 4096) / 4096;
  };

  ctx.save();
  ctx.globalAlpha = cfg.speckAlpha;
  for (let i = 0; i < count; i++) {
    const angle = next() * Math.PI * 2;
    const radius = Math.sqrt(next()) * core;
    ctx.fillStyle = tones[i % 2 === 0 ? 1 : 2];
    ctx.beginPath();
    ctx.ellipse(
      patch.x + Math.cos(angle) * radius * patch.rx,
      patch.y + Math.sin(angle) * radius * patch.ry,
      cfg.speckSize, cfg.speckSize * 0.7, 0, 0, Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}
