import { describe, it, expect } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { Fog } from '../src/world/Fog.ts';

const balance = getBalance();
const worldWidth = balance.render.virtualWidth * balance.render.worldScreensX;
const worldHeight = 780 * balance.render.worldScreensY;

describe('Fog — туман войны', () => {
  it('сетка укладывается в размер мира', () => {
    const fog = new Fog(worldWidth, worldHeight);
    expect(fog.cols * fog.cellSize).toBeGreaterThanOrEqual(worldWidth);
    expect(fog.rows * fog.cellSize).toBeGreaterThanOrEqual(worldHeight);
  });

  it('до открытия ничего не видно', () => {
    const fog = new Fog(worldWidth, worldHeight);
    expect(fog.isVisitedAt(worldWidth / 2, worldHeight / 2)).toBe(false);
  });

  it('открывает клетки в revealRadius и не трогает дальние', () => {
    const fog = new Fog(worldWidth, worldHeight);
    const cx = worldWidth / 2;
    const cy = worldHeight / 2;
    fog.reveal(cx, cy);

    expect(fog.isVisitedAt(cx, cy)).toBe(true);

    const far = cy - balance.fog.revealRadius * 4;
    expect(fog.isVisitedAt(cx, far)).toBe(false);
  });

  it('клетка за пределами сетки не считается открытой', () => {
    const fog = new Fog(worldWidth, worldHeight);
    expect(fog.isVisitedCell(-1, 0)).toBe(false);
    expect(fog.isVisitedCell(0, fog.rows)).toBe(false);
  });
});
