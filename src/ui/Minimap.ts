import { getBalance } from '../core/Balance.ts';
import type { Game } from '../core/Game.ts';
import { drawNodeMark, drawPlayerMark } from './MapMarks.ts';
import { drawZones } from './MapZones.ts';
import { glyph } from './Glyphs.ts';
import { panel, text, ui } from './UiKit.ts';

type Project = (x: number, y: number) => { x: number; y: number };

/** Центр кружка миникарты: правый верхний угол, как в референсе. */
function center(screenWidth: number): { x: number; y: number } {
  const { minimap } = getBalance();
  return {
    x: screenWidth - minimap.margin - minimap.screenRadius,
    y: minimap.margin + minimap.screenRadius,
  };
}

/** Кружок в углу экрана: игрок в центре, worldRadius мира вокруг, туман поверх. */
export function drawMinimap(ctx: CanvasRenderingContext2D, game: Game, screenWidth: number): void {
  const { minimap } = getBalance();
  const u = ui();
  const c = center(screenWidth);
  const scale = minimap.screenRadius / minimap.worldRadius;
  const player = game.player;

  ctx.save();
  ctx.beginPath();
  ctx.arc(c.x, c.y, minimap.screenRadius, 0, Math.PI * 2);
  ctx.clip();

  drawWorldContents(ctx, game, (x, y) => ({
    x: c.x + (x - player.x) * scale,
    y: c.y + (y - player.y) * scale,
  }), scale);

  ctx.restore();

  // Двойное кольцо: тёмное снаружи, светлое внутри — так круг не сливается
  // ни со светлой землёй, ни с тёмной водой за границей острова.
  ctx.lineWidth = u.outline * 2;
  ctx.strokeStyle = u.colors.outline;
  ctx.beginPath();
  ctx.arc(c.x, c.y, minimap.screenRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = u.outline;
  ctx.strokeStyle = u.colors.chip;
  ctx.stroke();

  // Лупа поверх кольца: без подсказки по кружку никто не тапает.
  const size = u.chipSize * 1.4;
  const corner = minimap.screenRadius * 0.72;
  const bx = c.x + corner - size / 2;
  const by = c.y - corner - size / 2;
  panel(ctx, bx, by, size, size, { fill: u.colors.button, radius: size / 2 });
  glyph(ctx, 'magnifier', bx + size / 2, by + size / 2, size * 0.66, u.colors.outline, u.colors.button);
}

/** Есть ли тап в кружке миникарты — используется для перехвата в Input.ts. */
export function isMinimapTap(x: number, y: number, screenWidth: number): boolean {
  const { minimap } = getBalance();
  const c = center(screenWidth);
  return Math.hypot(x - c.x, y - c.y) <= minimap.screenRadius;
}

/** Весь мир на весь экран — открывается тапом по миникарте, закрывается тапом где угодно. */
export function drawFullMap(
  ctx: CanvasRenderingContext2D,
  game: Game,
  screenWidth: number,
  viewHeight: number,
): void {
  const u = ui();

  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = u.colors.veil;
  ctx.fillRect(0, 0, screenWidth, viewHeight);
  ctx.restore();

  const pad = u.margin * 2;
  const scale = Math.min(
    (screenWidth - pad * 2) / game.worldWidth,
    (viewHeight - pad * 2) / game.worldHeight,
  );
  const originX = (screenWidth - game.worldWidth * scale) / 2;
  const originY = (viewHeight - game.worldHeight * scale) / 2;
  const w = game.worldWidth * scale;
  const h = game.worldHeight * scale;

  ctx.save();
  ctx.beginPath();
  ctx.rect(originX, originY, w, h);
  ctx.clip();
  const project = (x: number, y: number) => ({ x: originX + x * scale, y: originY + y * scale });
  // Зоны кладутся между дорогой и значками узлов: подпись места должна лежать
  // поверх тумана, но под плашкой врага — иначе название закрывает цель.
  drawWorldContents(ctx, game, project, scale, () => drawZones(ctx, game, project));
  ctx.restore();

  panel(ctx, originX, originY, w, h, { radius: u.radius });
  text(ctx, getBalance().islands.list[0]?.name ?? '', screenWidth / 2, originY - u.fontTitle, {
    size: u.fontTitle,
    fill: u.colors.textDim,
  });
}

/** Общая начинка для миникарты и полной карты: туман, узлы, игрок. */
function drawWorldContents(
  ctx: CanvasRenderingContext2D,
  game: Game,
  project: Project,
  scale: number,
  betweenRoadAndMarks?: () => void,
): void {
  const { minimap } = getBalance();
  const u = ui();
  const { fog } = game;
  const cell = fog.cellSize * scale + 1;

  ctx.fillStyle = u.colors.ground;
  const origin = project(0, 0);
  ctx.fillRect(origin.x, origin.y, fog.cols * fog.cellSize * scale, fog.rows * fog.cellSize * scale);

  // Туман одним путём и одной заливкой: клетки кладутся внахлёст на пиксель,
  // и раздельные fillRect копили альфу на стыках — карта выглядела
  // миллиметровкой, а не туманом.
  ctx.fillStyle = u.colors.veil;
  ctx.globalAlpha = minimap.fogAlpha;
  ctx.beginPath();
  for (let row = 0; row < fog.rows; row++) {
    for (let col = 0; col < fog.cols; col++) {
      if (fog.isVisitedCell(col, row)) continue;
      const p = project(col * fog.cellSize, row * fog.cellSize);
      ctx.rect(p.x, p.y, cell, cell);
    }
  }
  ctx.fill();
  ctx.globalAlpha = 1;

  drawMapRoad(ctx, game, project, scale);
  betweenRoadAndMarks?.();

  for (const enemy of game.enemies) {
    if (!enemy.alive || !fog.isVisitedAt(enemy.x, enemy.y)) continue;
    const p = project(enemy.x, enemy.y);
    if (enemy.tier === 'normal') {
      ctx.fillStyle = u.colors.hpEnemy;
      ctx.beginPath();
      ctx.arc(p.x, p.y, minimap.enemyDotRadius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      drawNodeMark(ctx, enemy, p.x, p.y);
    }
  }

  drawPlayerMark(ctx, project(game.player.x, game.player.y), game.player.facingAngle);
}

/**
 * Дорога на карте. Без неё карта — тёмное поле с точками: в референсе именно
 * дорога говорит, где ты и куда идти, раньше любых значков.
 */
function drawMapRoad(
  ctx: CanvasRenderingContext2D,
  game: Game,
  project: Project,
  scale: number,
): void {
  const { palette } = getBalance();

  ctx.save();
  ctx.strokeStyle = palette.roadDirt;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Каждая нитка своей толщиной: на карте отвороты к вождям должны читаться
  // как отвороты, а не как второй такой же тракт.
  for (const path of game.scenery.roadPaths) {
    if (path.points.length < 2) continue;
    ctx.lineWidth = Math.max(1, path.width * scale);
    ctx.beginPath();
    const first = project(path.points[0]!.x, path.points[0]!.y);
    ctx.moveTo(first.x, first.y);
    for (const point of path.points.slice(1)) {
      const p = project(point.x, point.y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  ctx.restore();
}
