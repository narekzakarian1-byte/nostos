import { describe, it, expect, beforeEach } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { Game } from '../src/core/Game.ts';
import type { Input } from '../src/core/Input.ts';
import { Camera } from '../src/ui/Camera.ts';
import { clearNodes } from '../src/save/Save.ts';
import { formatDps } from '../src/ui/UpgradeScreen.ts';

const balance = getBalance();
const W = balance.render.virtualWidth;
const idleInput = { isHeld: false, dirX: 0, dirY: 0 } as unknown as Input;
// Плюс островной босс: с Фазы 2 он такой же узел карты, как и остальные.
const nodeCount =
  balance.islands.normalsPerIsland + balance.islands.elitesPerIsland +
  balance.islands.minibossesPerIsland + 1;

function makeGame(height = 780 * balance.render.worldScreensY): Game {
  return new Game(W, height, idleInput, () => {}, balance.rng.defaultSeed);
}

beforeEach(() => clearNodes());

describe('Game — состав острова', () => {
  it('узлов столько, сколько задано конфигом: обычные, элита, мини-боссы', () => {
    const game = makeGame();
    expect(game.enemies).toHaveLength(nodeCount);
    const byTier = (t: string) => game.enemies.filter((e) => e.tier === t).length;
    expect(byTier('normal')).toBe(balance.islands.normalsPerIsland);
    expect(byTier('elite')).toBe(balance.islands.elitesPerIsland);
    expect(byTier('miniboss')).toBe(balance.islands.minibossesPerIsland);
    expect(byTier('boss')).toBe(1);
  });

  it('все узлы внутри мира и не слипаются со стартом игрока', () => {
    const game = makeGame();
    for (const enemy of game.enemies) {
      expect(enemy.x).toBeGreaterThanOrEqual(0);
      expect(enemy.x).toBeLessThanOrEqual(game.worldWidth);
      expect(enemy.y).toBeGreaterThanOrEqual(balance.render.hudHeight);
      expect(enemy.y).toBeLessThanOrEqual(game.worldHeight);
    }
  });

  it('мини-босс крупнее, толще и бьёт больнее обычного', () => {
    const game = makeGame();
    const normal = game.enemies.find((e) => e.tier === 'normal')!;
    const boss = game.enemies.find((e) => e.tier === 'miniboss')!;
    expect(boss.maxHp).toBeGreaterThan(normal.maxHp);
    expect(boss.dps).toBeGreaterThan(normal.dps);
    expect(boss.size).toBeGreaterThan(normal.size);
  });

  it('тик не падает и никого не теряет', () => {
    const game = makeGame();
    const step = 1 / balance.loop.tickHz;
    for (let i = 0; i < 600; i++) game.tick(step);
    expect(game.enemies).toHaveLength(nodeCount);
    expect(game.player.hp).toBeGreaterThan(0);
  });

  it('панель апгрейда даёт три строки с абсолютным DPS', () => {
    const game = makeGame();
    const rows = game.upgradeRows();
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.dpsNext).toBeGreaterThan(row.dpsNow);
      expect(row.cost).toBeGreaterThan(0);
      expect(row.ready).toBe(false);
    }
  });

  it('копии позволяют поднять уровень через панель', () => {
    const game = makeGame();
    game.inventory.add('pierce', 500);
    const before = game.player.weapons.pierce.level;
    game.tryUpgrade(0);
    expect(game.player.weapons.pierce.level).toBe(before + 1);
  });
});

describe('Camera — мир больше экрана по обеим осям', () => {
  const worldW = W * balance.render.worldScreensX;

  const { hudHeight, upgradePanelHeight } = balance.render;

  it('держит игрока ровно по центру экрана по горизонтали', () => {
    const camera = new Camera(360, 780);
    for (const x of [0, 180, worldW / 2, worldW]) {
      camera.follow(x, 500);
      expect(x - camera.x).toBeCloseTo(180, 6);
    }
  });

  /**
   * Края мира камеру не ограничивают: кламп по краю прижимал бы игрока к низу
   * экрана — под панель апгрейда и под кольцо джойстика (см. Camera.follow).
   */
  it('игрок всегда в центре игровой области, а не под HUD и не под панелью', () => {
    for (const view of [500, 640, 780, 900]) {
      const camera = new Camera(360, view);
      const world = view * balance.render.worldScreensY;
      const expected = hudHeight + (view - hudHeight - upgradePanelHeight) / 2;
      for (const y of [0, world / 3, world / 2, world]) {
        camera.follow(worldW / 2, y);
        const screenY = y - camera.y;
        expect(screenY).toBeCloseTo(expected, 6);
        expect(screenY).toBeGreaterThan(hudHeight);
        expect(screenY).toBeLessThan(view - upgradePanelHeight);
      }
    }
  });

  it('отсекает то, что за экраном', () => {
    const camera = new Camera(360, 780);
    camera.follow(180, 400);
    expect(camera.isVisible(180, 400, 20, 20)).toBe(true);
    expect(camera.isVisible(2000, 2000, 20, 20)).toBe(false);
  });
});

describe('UpgradeScreen — прирост читается', () => {
  it('на малых числах показывает десятые, иначе прирост выглядит нулевым', () => {
    expect(formatDps(14.0)).toBe('14.0');
    expect(formatDps(14.7)).toBe('14.7');
    expect(formatDps(552.4)).toBe('552');
  });

  it('строка апгрейда всегда показывает разный DPS до и после', () => {
    const game = makeGame();
    for (const row of game.upgradeRows()) {
      expect(formatDps(row.dpsNext)).not.toBe(formatDps(row.dpsNow));
    }
  });
});
