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

/**
 * Земля под картой: море, контур острова и материал зон.
 *
 * Без него карта — зелёный прямоугольник с рыбьей костью дороги, и по нему
 * нельзя сказать даже того, что это остров. Берётся та же геометрия, что и в
 * мире (world/Ground.ts): карта обязана совпадать с тем, что игрок видит под
 * ногами, иначе она врёт.
 *
 * Кляксы кладутся плоской заливкой, без растушёвки: на карте в полтысячи
 * пикселей градиент на каждую из двух сотен клякс стоит дороже, чем виден.
 */
/**
 * Контур острова на карте. Общий для заливки земли и для тумана: туман,
 * положенный прямоугольником мира, рисовал внутри острова тёмный прямоугольник
 * с прямыми углами — карта опять читалась таблицей.
 */
export function coastPath(
  ctx: CanvasRenderingContext2D,
  game: Game,
  project: Project,
): boolean {
  const coast = game.scenery.ground.coast;
  if (coast.length < 3) return false;
  ctx.beginPath();
  const first = project(coast[0]!.x, coast[0]!.y);
  ctx.moveTo(first.x, first.y);
  for (const point of coast.slice(1)) {
    const p = project(point.x, point.y);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  return true;
}

export function drawMapGround(
  ctx: CanvasRenderingContext2D,
  game: Game,
  project: Project,
): void {
  const { palette, terrain } = getBalance();
  const ground = game.scenery.ground;
  if (ground.coast.length < 3) return;

  ctx.save();
  coastPath(ctx, game, project);
  ctx.fillStyle = palette.shore;
  ctx.fill();

  // Материал зон — внутри контура: клякса зоны доходит до края мира, а карта
  // не должна выплёскивать сушу в море.
  ctx.clip();
  ctx.fillStyle = terrain.materials.grass[0];
  const a = project(0, 0);
  const b = project(game.worldWidth, game.worldHeight);
  ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);

  for (const patch of ground.patches) {
    const center = project(patch.x, patch.y);
    const edge = project(patch.x + patch.rx, patch.y + patch.ry);
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(patch.angle);
    ctx.fillStyle = terrain.materials[patch.material][0];
    ctx.beginPath();
    ctx.ellipse(0, 0, edge.x - center.x, edge.y - center.y, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

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

    // Пунктирных рамок зон больше нет: сетка 3×3 читалась таблицей, а границы
    // теперь рисует сам материал земли — неровные и те же, что под ногами.
    // Подписи соседних зон сходились вплотную: столбцы через один опускаются
    // на строку, и три названия в ряд перестают наезжать друг на друга.
    const column = Math.round(zone.rect[0] * 3);
    const stagger = column % 2 === 1 ? u.fontSmall * map.zoneLabelStagger : 0;

    ctx.globalAlpha = known ? 1 : map.unknownFade;
    text(ctx, zone.name, (a.x + b.x) / 2, a.y + map.zoneLabelInset + stagger, {
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
