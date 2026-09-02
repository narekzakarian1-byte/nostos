import { describe, it, expect, beforeEach } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { Game } from '../src/core/Game.ts';
import type { Input } from '../src/core/Input.ts';
import { Rng } from '../src/core/Rng.ts';
import { clearNodes } from '../src/save/Save.ts';
import { advance, makePatrol, patrolOutline, patrolPoint } from '../src/world/Patrol.ts';

const balance = getBalance();
const W = balance.render.virtualWidth;
const idleInput = { isHeld: false, dirX: 0, dirY: 0 } as unknown as Input;

function makeGame(): Game {
  return new Game(W, 780 * balance.render.worldScreensY, idleInput, () => {}, balance.rng.defaultSeed);
}

/** Прогон целого круга мелким шагом — так же, как это делает игровой тик. */
function walkFullLoop(path: ReturnType<typeof makePatrol>, steps: number): number {
  const dt = path.length / path.speed / steps;
  let progress = 0;
  for (let i = 0; i < steps; i++) progress = advance(path, progress, dt);
  return progress;
}

beforeEach(() => clearNodes());

describe('Patrol — маршрут врага', () => {
  it('маршрут замкнут: конец круга совпадает с началом', () => {
    for (const tier of ['normal', 'elite'] as const) {
      const path = makePatrol(new Rng(7), tier, 200, 300, 50);
      const start = patrolPoint(path, 0);
      const end = patrolPoint(path, 1);
      expect(end.x).toBeCloseTo(start.x, 6);
      expect(end.y).toBeCloseTo(start.y, 6);
    }
  });

  it('за длину пути враг возвращается ровно туда, откуда вышел', () => {
    const path = makePatrol(new Rng(11), 'normal', 200, 300, 50);
    expect(walkFullLoop(path, 600)).toBeCloseTo(0, 3);
  });

  it('маршрут не выходит за отведённый радиус', () => {
    const path = makePatrol(new Rng(3), 'normal', 400, 400, 40);
    expect(path.radius).toBeLessThanOrEqual(40);
    for (const point of patrolOutline(path, 64)) {
      expect(Math.hypot(point.x - 400, point.y - 400)).toBeLessThanOrEqual(path.radius + 1e-6);
    }
  });

  it('мини-босс сторожит узел и не ходит', () => {
    const path = makePatrol(new Rng(5), 'miniboss', 100, 100, 60);
    expect(path.kind).toBe('guard');
    expect(patrolOutline(path, 16)).toHaveLength(0);
    const moved = patrolPoint(path, advance(path, 0, 10));
    expect(moved.x).toBe(100);
    expect(moved.y).toBe(100);
  });

  it('один сид — одна и та же раскладка маршрутов', () => {
    const a = makeGame().enemies.map((e) => [e.patrol?.kind, e.progress, e.x, e.y]);
    const b = makeGame().enemies.map((e) => [e.patrol?.kind, e.progress, e.x, e.y]);
    expect(a).toEqual(b);
  });
});

describe('Game — враги в движении', () => {
  it('обычные враги за секунду сдвигаются, мини-боссы стоят', () => {
    const game = makeGame();
    const before = game.enemies.map((e) => ({ tier: e.tier, x: e.x, y: e.y }));
    for (let i = 0; i < 60; i++) game.tick(1 / 60);

    const walkers = game.enemies.filter((e, i) => {
      const was = before[i]!;
      return was.tier !== 'miniboss' && Math.hypot(e.x - was.x, e.y - was.y) > 1;
    });
    expect(walkers.length).toBeGreaterThan(0);

    game.enemies.forEach((enemy, i) => {
      if (enemy.tier !== 'miniboss') return;
      expect(enemy.x).toBe(before[i]!.x);
      expect(enemy.y).toBe(before[i]!.y);
    });
  });

  it('сцепленный с игроком враг замирает: уйти из боя должен решать игрок', () => {
    const { pauseInCombat } = balance.patrol;
    expect(pauseInCombat).toBe(true);

    const game = makeGame();
    const target = game.enemies.find((e) => e.tier === 'normal' && e.patrol?.kind !== 'guard');
    expect(target).toBeDefined();

    // Ставим игрока вплотную: сцепка происходит внутри tick по дистанции.
    game.player.x = target!.x;
    game.player.y = target!.y;
    game.tick(1 / 60);
    const held = { x: target!.x, y: target!.y };
    for (let i = 0; i < 30; i++) {
      game.player.x = held.x;
      game.player.y = held.y;
      game.tick(1 / 60);
    }
    expect(target!.x).toBeCloseTo(held.x, 6);
    expect(target!.y).toBeCloseTo(held.y, 6);
  });

  it('после воскрешения враг продолжает свой круг, а не телепортируется', () => {
    const game = makeGame();
    const enemy = game.enemies.find((e) => e.patrol && e.patrol.kind !== 'guard')!;
    enemy.kill();
    enemy.revive();
    const point = patrolPoint(enemy.patrol!, enemy.progress);
    game.tick(1 / 60);
    expect(Math.hypot(enemy.x - point.x, enemy.y - point.y)).toBeLessThan(enemy.size);
  });
});
