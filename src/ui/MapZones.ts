import { getBalance } from '../core/Balance.ts';
import type { Game } from '../core/Game.ts';
import { currentIslandId } from '../world/Island.ts';
import { islandLayout, toWorld, zoneRect } from '../world/Layout.ts';
import { text, ui } from './UiKit.ts';

/**
 * Зоны острова на полной карте: рамка, название, точка высадки.
 *
 * Без этого карта — тёмный прямоугольник с точками, по которому нельзя
 * сказать ни где ты, ни куда идти. Названия и есть карта: «давильня»,
 * «сгоревшая пристань», «площадь у храма» превращают россыпь значков в
 * места, между которыми ходят.
 *
 * Только для полной карты. На миникарте в углу экрана подписи не поместятся,
 * а рамки зон спорили бы с дорогой, ради которой она и нужна.
 */
export type Project = (x: number, y: number) => { x: number; y: number };

export function drawZones(ctx: CanvasRenderingContext2D, game: Game, project: Project): void {
  const layout = islandLayout(currentIslandId());
  if (!layout) return;

  const u = ui();
  const { map } = getBalance().minimap;
  const world = { width: game.worldWidth, height: game.worldHeight };

  ctx.save();
  for (const zone of layout.zones) {
    const rect = zoneRect(zone, world);
    const a = project(rect.x, rect.y);
    const b = project(rect.x + rect.width, rect.y + rect.height);
    // Зона считается открытой по своему центру: бегать по всем её клеткам
    // тумана незачем, а на глаз разница неотличима.
    const known = game.fog.isVisitedAt(rect.x + rect.width / 2, rect.y + rect.height / 2);

    ctx.globalAlpha = known ? map.zoneEdgeAlpha : map.zoneEdgeAlpha * map.unknownFade;
    ctx.strokeStyle = u.colors.chip;
    ctx.lineWidth = map.zoneEdgeWidth;
    ctx.setLineDash(map.zoneEdgeDash);
    ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    ctx.setLineDash([]);

    ctx.globalAlpha = known ? 1 : map.unknownFade;
    text(ctx, zone.name, (a.x + b.x) / 2, a.y + map.zoneLabelInset, {
      size: u.fontSmall,
      fill: known ? u.colors.textDim : u.colors.chip,
    });
  }
  ctx.globalAlpha = 1;

  const landing = project(...pointOf(layout.landing, world));
  drawLanding(ctx, landing.x, landing.y);
  ctx.restore();
}

/**
 * Точка высадки. На карте она нужна не меньше босса: это единственное место,
 * куда игрока возвращает смерть, и от неё он каждый раз считает дорогу.
 */
function drawLanding(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const u = ui();
  const { map } = getBalance().minimap;

  ctx.lineWidth = map.landingWidth;
  ctx.strokeStyle = u.colors.textDim;
  ctx.beginPath();
  ctx.arc(x, y, map.landingRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = u.colors.textDim;
  ctx.beginPath();
  ctx.arc(x, y, map.landingRadius * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function pointOf(
  point: { x: number; y: number },
  world: { width: number; height: number },
): [number, number] {
  const world_ = toWorld(point, world);
  return [world_.x, world_.y];
}
