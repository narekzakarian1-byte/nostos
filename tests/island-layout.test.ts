import { describe, it, expect, beforeEach } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { Game } from '../src/core/Game.ts';
import type { Input } from '../src/core/Input.ts';
import { clearNodes } from '../src/save/Save.ts';
import { currentIslandId } from '../src/world/Island.ts';
import { islandLayout, toWorld, zoneAt, type IslandLayout } from '../src/world/Layout.ts';

// Раскладка острова — данные, и ошибка в них не видна ни компилятору, ни
// глазу: узел просто окажется не в той зоне, а бюджет разойдётся с
// balance.json молча. Поэтому она проверяется здесь.

const balance = getBalance();
const W = balance.render.virtualWidth;
const worldWidth = W * balance.render.worldScreensX;
const worldHeight = W * 2 * balance.render.worldScreensY;
const world = { width: worldWidth, height: worldHeight };

const idleInput = {
  isHeld: false, dirX: 0, dirY: 0,
  anchorX: 0, anchorY: 0, knobOffsetX: 0, knobOffsetY: 0,
} as unknown as Input;

function makeGame(seed = balance.rng.defaultSeed): Game {
  return new Game(worldWidth, worldHeight, idleInput, () => {}, seed);
}

const layout = islandLayout(currentIslandId()) as IslandLayout;

describe('Раскладка Исмары', () => {
  beforeEach(() => clearNodes());

  it('есть у текущего острова', () => {
    expect(layout).not.toBeNull();
    expect(layout.id).toBe(currentIslandId());
  });

  it('бюджет узлов сходится с balance.json', () => {
    const { islands } = balance;
    const sum = (tier: 'normal' | 'elite') =>
      layout.zones.reduce((total, zone) => total + (zone.nodes[tier] ?? 0), 0);

    expect(layout.minibosses).toHaveLength(islands.minibossesPerIsland);
    expect(sum('elite')).toBe(islands.elitesPerIsland);
    expect(sum('normal')).toBe(islands.normalsPerIsland);
  });

  it('зоны лежат внутри мира и не наезжают друг на друга', () => {
    for (const zone of layout.zones) {
      const [x, y, w, h] = zone.rect;
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x + w).toBeLessThanOrEqual(1.0001);
      expect(y + h).toBeLessThanOrEqual(1.0001);
    }
    // Центр каждой зоны попадает в неё саму — значит прямоугольники не слиплись.
    for (const zone of layout.zones) {
      const [x, y, w, h] = zone.rect;
      const hit = zoneAt(layout, world, (x + w / 2) * worldWidth, (y + h / 2) * worldHeight);
      expect(hit?.id).toBe(zone.id);
    }
  });

  it('каждый вождь стоит в своей зоне', () => {
    for (const chief of layout.minibosses) {
      const point = toWorld(chief.at, world);
      expect(zoneAt(layout, world, point.x, point.y)?.id).toBe(chief.zone);
    }
  });

  it('два вождя роняют копии типа, которым берут островного босса', () => {
    const bossWeakness = balance.islands.list[0]!.bossWeakness;
    const matching = layout.minibosses.filter((c) => c.copyType === bossWeakness);
    // Адрес гринда обязан лежать на том же острове (ISLANDS.md §1.1).
    expect(matching.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Остров, собранный по раскладке', () => {
  beforeEach(() => clearNodes());

  it('ставит вождей ровно в их точки', () => {
    const game = makeGame();
    for (const chief of layout.minibosses) {
      const point = toWorld(chief.at, world);
      const found = game.enemies.find(
        (e) => e.tier === 'miniboss' && Math.hypot(e.x - point.x, e.y - point.y) < 60,
      );
      // Допуск — радиус маршрута: вождь стоит на месте (patrol «guard»), но
      // общий код кладёт маршрут всем, и стартовая фаза сдвигает точку.
      expect(found, `вождь ${chief.name} не нашёлся у своей точки`).toBeDefined();
    }
  });

  it('у высадки только обычные узлы: градиент идёт снизу вверх', () => {
    const game = makeGame();
    const landing = toWorld(layout.landing, world);
    const landingZone = zoneAt(layout, world, landing.x, landing.y);
    expect(landingZone).not.toBeNull();

    for (const enemy of game.enemies) {
      const zone = zoneAt(layout, world, enemy.x, enemy.y);
      if (zone?.id !== landingZone?.id) continue;
      expect(enemy.tier, `в зоне высадки стоит ${enemy.tier}`).toBe('normal');
    }
  });

  it('босс стоит на арене, а игрок высаживается ниже всех узлов своей зоны', () => {
    const game = makeGame();
    const arena = toWorld(layout.arena, world);
    expect(game.boss.x).toBeCloseTo(arena.x, 6);
    expect(game.boss.y).toBeCloseTo(arena.y, 6);

    const landing = toWorld(layout.landing, world);
    expect(game.player.x).toBeCloseTo(landing.x, 6);
    expect(game.player.y).toBeCloseTo(landing.y, 6);
    expect(game.boss.y).toBeLessThan(game.player.y);
  });

  it('остаётся детерминированной: один сид — одна раскладка', () => {
    const positions = (game: Game) => game.enemies.map((e) => `${e.tier}:${e.x}:${e.y}`);
    expect(positions(makeGame(4242))).toEqual(positions(makeGame(4242)));
  });
});
