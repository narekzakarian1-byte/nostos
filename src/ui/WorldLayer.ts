import { getBalance } from '../core/Balance.ts';
import type { Game } from '../core/Game.ts';
import type { Enemy } from '../world/Enemy.ts';
import type { DecorPlacement } from '../world/Scenery.ts';
import type { Camera } from './Camera.ts';
import { drawEnemyBody, drawPlayer } from './Figures.ts';
import { propMetrics } from './props/Bake.ts';
import { drawProp } from './Terrain.ts';

/**
 * Всё, что СТОИТ на земле — декор, враги, игрок — рисуется одним списком,
 * отсортированным по точке касания земли: кто ниже по экрану, тот ближе к
 * камере и рисуется позже.
 *
 * Раздельные слои («сначала весь декор, потом все фигуры») давали игрока
 * поверх колонны даже тогда, когда он стоит ЗА ней. Перекрытие — главный
 * сигнал, что объект стоит в мире, а не наклеен на фон, и без него остров
 * читается как обои с картинками.
 */
export interface Standing {
  readonly kind: 'prop' | 'enemy' | 'player';
  /** Точка касания земли. По ней и только по ней считается глубина. */
  readonly footY: number;
  readonly paint: (ctx: CanvasRenderingContext2D) => void;
}

export function drawWorldLayer(
  ctx: CanvasRenderingContext2D,
  game: Game,
  enemies: readonly Enemy[],
  camera: Camera,
): void {
  for (const item of depthOrder(game, enemies, camera)) item.paint(ctx);
}

/**
 * Порядок отрисовки от дальнего к ближнему. Отделён от самой отрисовки, чтобы
 * его можно было проверить тестом: без канваса перекрытие глазами не увидеть,
 * а сломать сортировку легко — достаточно вернуть декор в отдельный слой.
 */
export function depthOrder(
  game: Game,
  enemies: readonly Enemy[],
  camera: Camera,
): readonly Standing[] {
  const { render } = getBalance();
  const items: Standing[] = [];

  for (const prop of visibleProps(game, camera)) {
    items.push({ kind: 'prop', footY: prop.y, paint: (c) => drawProp(c, prop) });
  }
  for (const enemy of enemies) {
    items.push({
      kind: 'enemy',
      footY: enemy.y + enemy.size / 2,
      paint: (c) => drawEnemyBody(c, enemy, game),
    });
  }
  if (game.player.alive || game.player.anim.dying) {
    items.push({
      kind: 'player',
      footY: game.player.y + render.playerSize / 2,
      paint: (c) => drawPlayer(c, game),
    });
  }

  items.sort((a, b) => a.footY - b.footY);
  return items;
}

/** За экраном декор не рисуем: на острове его больше двух сотен. */
function visibleProps(game: Game, camera: Camera): DecorPlacement[] {
  const visible: DecorPlacement[] = [];
  for (const prop of game.scenery.props) {
    const m = propMetrics(prop.id);
    // Запас берётся полный: проп стоит подошвой в prop.y и растёт вверх, а
    // тень уходит вбок — габарит в метриках уже посчитан вместе с ней.
    if (camera.isVisible(prop.x, prop.y, m.width, m.height)) visible.push(prop);
  }
  return visible;
}
