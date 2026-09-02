import { describe, it, expect } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { Rng } from '../src/core/Rng.ts';
import { Scenery, type SceneryBounds } from '../src/world/Scenery.ts';

const balance = getBalance();
const worldWidth = balance.render.virtualWidth * balance.render.worldScreensX;
const worldHeight = 780 * balance.render.worldScreensY;
const bounds: SceneryBounds = {
  width: worldWidth,
  height: worldHeight,
  top: balance.render.hudHeight + balance.render.enemySpawnMargin,
  startX: worldWidth / 2,
  startY: worldHeight - balance.render.enemySpawnMargin,
};

function makeScenery(): Scenery {
  return new Scenery(new Rng(balance.rng.defaultSeed), bounds, []);
}

describe('Scenery — детерминированный декор острова', () => {
  it('один сид даёт одну и ту же раскладку', () => {
    const a = makeScenery();
    const b = makeScenery();
    expect(a.props).toEqual(b.props);
    expect(a.roadPoints).toEqual(b.roadPoints);
  });

  it('столько пропов, сколько задано в конфиге, и все внутри мира', () => {
    const scenery = makeScenery();
    expect(scenery.props).toHaveLength(balance.scenery.propCount);
    for (const prop of scenery.props) {
      expect(prop.x).toBeGreaterThanOrEqual(0);
      expect(prop.x).toBeLessThanOrEqual(bounds.width);
      expect(prop.y).toBeGreaterThanOrEqual(bounds.top);
      expect(prop.y).toBeLessThanOrEqual(bounds.height);
    }
  });

  it('дорога идёт через весь остров, от нижнего края к верхнему', () => {
    const scenery = makeScenery();
    expect(scenery.roadPoints[0]).toEqual({ x: bounds.startX, y: bounds.height });
    expect(scenery.roadPoints).toHaveLength(balance.scenery.roadWaypoints);
    const last = scenery.roadPoints[scenery.roadPoints.length - 1]!;
    expect(last.y).toBeCloseTo(bounds.top, 6);
  });

  it('граница вписана в мир с отступом borderInset', () => {
    const scenery = makeScenery();
    expect(scenery.border.x).toBe(balance.scenery.borderInset);
    expect(scenery.border.y).toBe(bounds.top + balance.scenery.borderInset);
  });
});
