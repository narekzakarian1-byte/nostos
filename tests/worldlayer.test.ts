import { describe, it, expect, beforeEach } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { Game } from '../src/core/Game.ts';
import type { Input } from '../src/core/Input.ts';
import { clearNodes } from '../src/save/Save.ts';
import { Camera } from '../src/ui/Camera.ts';
import { depthOrder } from '../src/ui/WorldLayer.ts';

// Перекрытие — единственный признак, по которому объект читается как стоящий в
// мире, а не наклеенный на фон. Глазами его без канваса не проверить, поэтому
// проверяется порядок: он и есть перекрытие.

const balance = getBalance();
const W = balance.render.virtualWidth;
const H = 780;
const idleInput = { isHeld: false, dirX: 0, dirY: 0 } as unknown as Input;

function makeGame(): Game {
  return new Game(W, H * balance.render.worldScreensY, idleInput, () => {}, balance.rng.defaultSeed);
}

function makeCamera(game: Game): Camera {
  const camera = new Camera(W, H);
  camera.follow(game.player.x, game.player.y);
  return camera;
}

beforeEach(() => clearNodes());

describe('WorldLayer — глубина', () => {
  it('список идёт от дальнего к ближнему по точке касания земли', () => {
    const game = makeGame();
    const order = depthOrder(game, game.enemies, makeCamera(game));
    for (let i = 1; i < order.length; i++) {
      expect(order[i]!.footY).toBeGreaterThanOrEqual(order[i - 1]!.footY);
    }
  });

  it('декор и фигуры перемешаны в одном списке, а не идут двумя слоями', () => {
    const game = makeGame();
    const order = depthOrder(game, game.enemies, makeCamera(game));
    const kinds = order.map((item) => item.kind);
    expect(kinds).toContain('prop');
    expect(kinds).toContain('player');
    // Пропы и фигуры двумя блоками — это ровно та ошибка, из-за которой игрок
    // рисовался поверх колонны, стоя за ней.
    const lastProp = kinds.lastIndexOf('prop');
    const firstFigure = kinds.findIndex((k) => k !== 'prop');
    expect(lastProp).toBeGreaterThan(firstFigure);
  });

  it('проп, стоящий ближе игрока, рисуется после него', () => {
    const game = makeGame();
    const camera = makeCamera(game);
    const near = [...game.scenery.props]
      .filter((p) => camera.isVisible(p.x, p.y, 0, 0))
      .sort((a, b) => b.y - a.y)[0];
    expect(near).toBeDefined();

    // Ставим игрока заведомо дальше этого пропа — он обязан уйти под него.
    game.player.y = near!.y - balance.render.playerSize;
    const order = depthOrder(game, game.enemies, camera);
    const playerAt = order.findIndex((item) => item.kind === 'player');
    const propAt = order.findIndex((item) => item.kind === 'prop' && item.footY === near!.y);
    expect(propAt).toBeGreaterThan(playerAt);
  });
});
