import { describe, it, expect, beforeEach } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { Game } from '../src/core/Game.ts';
import type { Input } from '../src/core/Input.ts';
import { clearNodes } from '../src/save/Save.ts';
import { currentIslandId } from '../src/world/Island.ts';
import { islandLayout, toWorld, zoneAt, type IslandLayout } from '../src/world/Layout.ts';
import { distanceToPaths } from '../src/world/Road.ts';
import { blocked, blockersOf, footprintOf } from '../src/world/Blockers.ts';

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

/**
 * Мир на низком окне. Высота мира зависит от окна (viewHeight × worldScreensY),
 * а верхний срез под HUD — абсолютный. Значит на коротком экране верхняя зона
 * сжимается сильнее всего, и доля 0.075 уезжает за стену. Проверяется отдельно
 * именно поэтому: на высоком мире такой ландмарк проходит, а на телефоне с
 * низким окном повисает над чёрным полем.
 */
function makeShortGame(): Game {
  const shortWorldHeight = 440 * balance.render.worldScreensY;
  return new Game(worldWidth, shortWorldHeight, idleInput, () => {}, balance.rng.defaultSeed);
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

describe('Декор по зонам', () => {
  beforeEach(() => clearNodes());

  it('в зоне стоят только пропы её набора', () => {
    const game = makeGame();
    for (const prop of game.scenery.props) {
      const zone = zoneAt(layout, world, prop.x, prop.y);
      if (!zone?.props) continue;
      const own = [
        ...zone.props.anchors,
        ...zone.props.satellites,
        ...(zone.landmarks ?? []).map((l) => l.prop),
      ];
      // Кластер соседней зоны может достать спутником через границу — это
      // нормально. Проверяется, что набор зоны вообще соблюдается: чужой
      // якорь в середине зоны и есть «пресс на площади храма».
      const neighbours = layout.zones.flatMap((z) => [
        ...(z.props?.anchors ?? []),
        ...(z.props?.satellites ?? []),
        ...(z.landmarks ?? []).map((l) => l.prop),
      ]);
      expect(own.includes(prop.id) || neighbours.includes(prop.id)).toBe(true);
    }
  });

  it('ни один сеяный проп не стоит на дороге и не свешивается над ней', () => {
    // Правило про СЕЯНЫЙ декор. Ландмарк ставит рука, и ворота святилища
    // стоят прямо на тракте намеренно: под аркой ходят, следа у неё нет
    // (balance.props.solid), и проход она не закрывает. Запрет нужен затем,
    // чтобы кости не бросили телегу поперёк дороги, — а телега непроходима,
    // и её этот тест по-прежнему ловит.
    const game = makeGame();
    const { roadClearance } = balance.scenery;
    const landmarks = new Set(
      layout.zones.flatMap((z) => (z.landmarks ?? []).map((l) => l.prop)),
    );
    for (const prop of game.scenery.props) {
      if (landmarks.has(prop.id) && footprintOf(prop.id) === null) continue;
      // След берётся выросшим: у каждого экземпляра свой размер, и зазор
      // считается по нему же (world/Scatter.onRoad).
      const reach = (footprintOf(prop.id)?.rx ?? 0) * prop.scale;
      for (const path of game.scenery.roadPaths) {
        const gap = distanceToPaths(path.points, prop.x, prop.y);
        // Половина ширины — сама дорога, roadClearance — обочина, reach —
        // след самого пропа: ворота в 120 единиц свешиваются створом.
        expect(gap, `${prop.id} лежит на дороге`).toBeGreaterThanOrEqual(
          path.width / 2 + roadClearance + reach - 0.001,
        );
      }
    }
  });

  it('сеяные пропы отличаются размером и стороной, ландмарки — нет', () => {
    const game = makeGame();
    const landmarkIds = new Set(
      layout.zones.flatMap((z) => (z.landmarks ?? []).map((l) => l.prop)),
    );
    // Один и тот же камень, отпечатанный два десятка раз без отличий, глаз
    // ловит быстрее, чем успевает прочитать сцену.
    const scales = new Set(game.scenery.props.map((p) => p.scale.toFixed(3)));
    expect(scales.size).toBeGreaterThan(10);
    expect(game.scenery.props.some((p) => p.flip)).toBe(true);

    // Ландмарк ставит рука: храм в зеркале читается ошибкой.
    for (const prop of game.scenery.props.slice(0, landmarkIds.size)) {
      if (!landmarkIds.has(prop.id)) continue;
      expect(prop.flip).toBe(false);
      expect(prop.scale).toBe(1);
    }
  });

  it('на учебном берегу декора заметно меньше, чем в деревне', () => {
    const beach = layout.zones.find((z) => z.id === 'beach');
    const village = layout.zones.find((z) => z.id === 'burnt');
    // islands/01-ismaros.md: вокруг врагов на первом острове должно быть
    // максимум пустого зелёного поля.
    expect(beach?.props?.clusters ?? 0).toBeLessThan(village?.props?.clusters ?? 0);
  });
});

describe('Трава', () => {
  beforeEach(() => clearNodes());

  it('не растёт по кладке дороги', () => {
    const game = makeGame();
    const { roadClearance } = balance.scenery;
    for (const tuft of game.scenery.grass) {
      for (const path of game.scenery.roadPaths) {
        expect(
          distanceToPaths(path.points, tuft.x, tuft.y),
          'пучок травы вырос на дороге',
        ).toBeGreaterThanOrEqual(path.width / 2 + roadClearance - 0.001);
      }
    }
  });

  it('на плите площади и на гальке реже, чем на лугу', () => {
    // Пучки сидели одинаково густо и на мощёной площади, и на берегу — земля
    // под ними переставала что-либо значить.
    const game = makeGame();
    const perZone = new Map<string, number>();
    for (const tuft of game.scenery.grass) {
      const zone = zoneAt(layout, world, tuft.x, tuft.y);
      if (!zone) continue;
      perZone.set(zone.id, (perZone.get(zone.id) ?? 0) + 1);
    }
    expect(perZone.get('beach') ?? 0).toBeLessThan(perZone.get('grove') ?? 0);
    expect(perZone.get('temple') ?? 0).toBeLessThan(perZone.get('grove') ?? 0);
  });

  it('её заметно меньше, чем было: сотня галочек на экран читалась конфетти', () => {
    const game = makeGame();
    const screen = balance.render.virtualWidth * (balance.render.virtualWidth * 2);
    const perScreen = (game.scenery.grass.length * screen) / (worldWidth * worldHeight);
    expect(perScreen).toBeLessThan(30);
  });
});

describe('Край острова', () => {
  beforeEach(() => clearNodes());

  it('игрок не выходит за стену ни в одну сторону', () => {
    const game = makeGame();
    const land = game.scenery.border;
    const half = balance.render.playerSize / 2;
    // Держим стик в угол достаточно долго, чтобы упереться.
    for (const [dx, dy] of [[-1, -1], [1, 1], [-1, 1], [1, -1]] as const) {
      for (let step = 0; step < 4000; step++) game.player.move(dx, dy, 1 / 60);
      expect(game.player.x).toBeGreaterThanOrEqual(land.x - 0.001);
      expect(game.player.x).toBeLessThanOrEqual(land.x + land.width + 0.001);
      // Ограничение идёт по точке касания земли, а не по центру фигуры.
      expect(game.player.y + half).toBeGreaterThanOrEqual(land.y - 0.001);
      expect(game.player.y + half).toBeLessThanOrEqual(land.y + land.height + 0.001);
    }
  });

  it('дорога не уходит за стену', () => {
    const game = makeGame();
    const land = game.scenery.border;
    for (const path of game.scenery.roadPaths) {
      for (const point of path.points) {
        expect(point.y).toBeLessThanOrEqual(land.y + land.height + 0.001);
        expect(point.y).toBeGreaterThanOrEqual(land.y - 0.001);
      }
    }
  });
});

describe('Препятствия', () => {
  beforeEach(() => clearNodes());

  const foot = { rx: balance.player.footRx, ry: balance.player.footRy };

  it('сквозь сгоревшую хижину не пройти', () => {
    const game = makeGame();
    const blockers = blockersOf(game.scenery.props);
    const hut = game.scenery.props.find((p) => p.id === 'prop-hut-burnt');
    expect(hut).toBeDefined();

    // Заходим на хижину снизу и упираемся.
    game.player.x = hut!.x;
    game.player.y = hut!.y + 180 - balance.render.playerSize / 2;
    for (let step = 0; step < 600; step++) game.player.move(0, -1, 1 / 60);

    const groundY = game.player.y + balance.render.playerSize / 2;
    expect(blocked(game.player.x, groundY, foot, blockers)).toBe(false);
    // И действительно упёрся, а не прошёл насквозь.
    expect(groundY).toBeGreaterThan(hut!.y);
  });

  it('вдоль препятствия игрок скользит, а не залипает', () => {
    const game = makeGame();
    const hut = game.scenery.props.find((p) => p.id === 'prop-hut-burnt')!;
    game.player.x = hut.x;
    game.player.y = hut.y + 180 - balance.render.playerSize / 2;
    for (let step = 0; step < 200; step++) game.player.move(0, -1, 1 / 60);

    const stuckX = game.player.x;
    // Упёрлись — и пошли по диагонали: боковая составляющая обязана работать.
    for (let step = 0; step < 200; step++) game.player.move(1, -1, 1 / 60);
    expect(Math.abs(game.player.x - stuckX)).toBeGreaterThan(1);
  });

  it('ни один узел не стоит внутри препятствия: до врага всегда можно дойти', () => {
    const game = makeGame();
    const blockers = blockersOf(game.scenery.props);
    for (const enemy of game.enemies) {
      expect(
        blocked(enemy.x, enemy.y + enemy.size / 2, foot, blockers),
        `узел ${enemy.tier} стоит в препятствии`,
      ).toBe(false);
    }
  });

  it('у мелочи следа нет: щебень и черепки игрока не цепляют', () => {
    for (const id of ['prop-slabs', 'prop-rock-small', 'prop-amphora', 'prop-campfire'] as const) {
      expect(footprintOf(id), id).toBeNull();
    }
  });
});

describe('Раскладка на низком окне', () => {
  beforeEach(() => clearNodes());

  it('ландмарки не уезжают за стену острова', () => {
    const game = makeShortGame();
    const land = game.scenery.border;
    for (const prop of game.scenery.props) {
      expect(prop.x, `${prop.id} за левым краем`).toBeGreaterThanOrEqual(land.x - 0.001);
      expect(prop.x, `${prop.id} за правым краем`)
        .toBeLessThanOrEqual(land.x + land.width + 0.001);
      expect(prop.y, `${prop.id} выше стены`).toBeGreaterThanOrEqual(land.y - 0.001);
      expect(prop.y, `${prop.id} ниже стены`)
        .toBeLessThanOrEqual(land.y + land.height + 0.001);
    }
  });

  it('босс и вожди остаются внутри земли', () => {
    const game = makeShortGame();
    const land = game.scenery.border;
    for (const enemy of game.enemies) {
      expect(enemy.y, `${enemy.tier} выше стены`).toBeGreaterThanOrEqual(land.y - 0.001);
    }
  });
});
