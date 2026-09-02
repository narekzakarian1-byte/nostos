import { getBalance } from '../core/Balance.ts';
import type { Game } from '../core/Game.ts';
import type { Camera } from './Camera.ts';
import { currentIslandId } from '../world/Island.ts';
import { SPRITES, type SpriteId } from './AssetManifest.ts';
import { islandRoad } from './IslandArt.ts';
import { sprites } from './Sprites.ts';
import { roundRectPath } from './UiKit.ts';

/**
 * Дорога-стержень: тёмный край, тело и кладка отдельными камнями.
 *
 * Три слоя, а не один: заливка одним цветом на четверть экрана читается как
 * дыра в текстуре. Тёмный край отделяет дорогу от травы, кладка даёт
 * поверхности масштаб — по камню видно, какого размера игрок.
 */
export function drawRoad(ctx: CanvasRenderingContext2D, game: Game, camera: Camera): void {
  const { scenery, palette } = getBalance();
  const points = game.scenery.roadPoints;
  if (points.length < 2) return;

  const id = islandRoad(currentIslandId());
  const img = sprites.get(id);
  if (img) {
    tileRoad(ctx, img, id, points, scenery.roadWidth);
    return;
  }

  // Край и тело — одной ломаной, разной толщиной: два прохода дешевле, чем
  // считать контур полосы, и на изломах не расходятся.
  strokeSpine(ctx, points, scenery.roadWidth + scenery.roadEdgeWidth * 2, palette.roadEdge);
  strokeSpine(ctx, points, scenery.roadWidth, palette.roadDirt);
  drawStones(ctx, game, camera);
}

function strokeSpine(
  ctx: CanvasRenderingContext2D,
  points: readonly { x: number; y: number }[],
  width: number,
  color: string,
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0]!.x, points[0]!.y);
  for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
  ctx.stroke();
  ctx.restore();
}

/** Кладка. За экраном не рисуем: камней на дорогу через весь остров — сотни. */
function drawStones(ctx: CanvasRenderingContext2D, game: Game, camera: Camera): void {
  const { palette, scenery } = getBalance();
  const tones = [palette.roadStoneLight, palette.roadStoneDark];

  ctx.save();
  for (const stone of game.scenery.roadStones) {
    if (!camera.isVisible(stone.x, stone.y, stone.size, stone.size)) continue;
    ctx.save();
    ctx.translate(stone.x, stone.y);
    ctx.rotate(stone.angle);
    ctx.fillStyle = tones[stone.tone] ?? tones[0]!;
    // Обводка цветом самой дороги: камни кладутся внахлёст, и без шва они
    // сливаются в одно светлое пятно вместо кладки.
    ctx.strokeStyle = palette.roadDirt;
    ctx.lineWidth = scenery.roadStoneSeam;
    ctx.lineJoin = 'round';
    const half = stone.size / 2;
    roundRectPath(ctx, -half, -half, stone.size, stone.size, half * 0.55);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/** Повторяет спрайт плашками вдоль ломаной — путь, когда текстура появится. */
function tileRoad(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  id: SpriteId,
  points: readonly { x: number; y: number }[],
  thickness: number,
): void {
  const def = SPRITES[id];
  const tileWidth = (def.width / def.height) * thickness;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(angle);
    for (let x = 0; x < length; x += tileWidth) {
      ctx.drawImage(img, x, -thickness / 2, tileWidth, thickness);
    }
    ctx.restore();
  }
}
