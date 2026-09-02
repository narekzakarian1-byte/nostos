import { describe, it, expect, beforeEach } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { Game } from '../src/core/Game.ts';
import type { Input } from '../src/core/Input.ts';
import { applyBossRegen, bossArenaPoint, bossRegen, createBoss } from '../src/world/Boss.ts';
import { Gate } from '../src/world/Gate.ts';
import { currentIslandId } from '../src/world/Island.ts';
import { islandLayout, toWorld } from '../src/world/Layout.ts';
import { clearNodes } from '../src/save/Save.ts';
import { DAMAGE_TYPES } from '../src/core/Combat.ts';
import { rewardKill } from '../src/player/Rewards.ts';

const balance = getBalance();
const W = balance.render.virtualWidth;
const H = 780 * balance.render.worldScreensY;
const idleInput = { isHeld: false, dirX: 0, dirY: 0 } as unknown as Input;
const n = balance.prototype.islandNumber;

function makeGame(): Game {
  return new Game(W, H, idleInput, () => {}, balance.rng.defaultSeed);
}

beforeEach(() => clearNodes());

describe('Островной босс', () => {
  it('слабый тип защищён слабее двух остальных, и те стойкие, а не нейтральные', () => {
    const boss = createBoss(n, 0, 0);
    const weakness = boss.weakness;
    if (weakness === 'any') throw new Error('остров прототипа не Итака');

    const others = DAMAGE_TYPES.filter((t) => t !== weakness);
    for (const type of others) {
      expect(boss.def[type]).toBeGreaterThan(boss.def[weakness]);
      // Оба не-слабых типа стойкие: у босса нет нейтрального (GDD §6.5).
      expect(boss.def[type]).toBe(boss.def[others[0]!]);
    }
  });

  it('регенерирует В БОЮ: HP растёт даже без окна вне боя', () => {
    const boss = createBoss(n, 0, 0);
    boss.hp = boss.maxHp / 2;
    boss.timeSinceDamage = 0; // только что получил урон — окно регена закрыто

    applyBossRegen(boss, 1);
    expect(boss.hp).toBeCloseTo(boss.maxHp / 2 + bossRegen(boss), 6);
  });

  it('реген считается от максимума и равен bossCombatRegen в секунду', () => {
    const boss = createBoss(n, 0, 0);
    expect(bossRegen(boss)).toBeCloseTo(boss.maxHp * balance.regen.bossCombatRegen, 6);
  });

  it('реген не переливает через потолок', () => {
    const boss = createBoss(n, 0, 0);
    boss.hp = boss.maxHp;
    applyBossRegen(boss, 100);
    expect(boss.hp).toBe(boss.maxHp);
  });

  it('стоит на арене из раскладки острова и не ходит по маршруту', () => {
    const game = makeGame();
    const layout = islandLayout(currentIslandId());
    // Арена берётся из раскладки (world/Layout.ts), а у острова без неё —
    // из прежней формулы. Проверяются оба пути, чтобы островá без схемы
    // не сломались молча.
    const arena = layout
      ? toWorld(layout.arena, { width: game.worldWidth, height: game.worldHeight })
      : bossArenaPoint(game.worldWidth, game.worldHeight);
    expect(game.boss.x).toBeCloseTo(arena.x, 6);
    expect(game.boss.y).toBeCloseTo(arena.y, 6);
    expect(game.boss.patrol).toBeNull();
    // Игрок стартует внизу: чтобы дойти до гейта, остров нужно пересечь.
    expect(game.boss.y).toBeLessThan(game.player.y);
  });

  it('копий не даёт, но статы с него капают: награда — открытый гейт', () => {
    const game = makeGame();
    const before = DAMAGE_TYPES.map((t) => game.inventory.get(t));
    const hpBefore = game.player.stats.get('maxHp');

    rewardKill(game.player, game.inventory, game.boss, game.rng);

    expect(DAMAGE_TYPES.map((t) => game.inventory.get(t))).toEqual(before);
    expect(game.player.stats.get('maxHp')).toBeGreaterThan(hpBefore);
  });
});

describe('Гейт в игре', () => {
  it('экран босса не всплывает после смерти вдали от арены', () => {
    const game = makeGame();
    const step = 1 / balance.loop.tickHz;

    // Побывали в бою с боссом: попытка открыта.
    game.player.x = game.boss.x;
    game.player.y = game.boss.y;
    game.tick(step);
    expect(game.gate.inAttempt).toBe(true);

    // Ушли на старт и умерли там — попытка должна была закрыться молча.
    game.player.x = game.player.startX;
    game.player.y = game.player.startY;
    game.tick(step);
    expect(game.gate.inAttempt).toBe(false);

    game.player.die();
    expect(game.bossScreen).toBeNull();
    // Достигнутое при этом не потеряно: дельта следующей попытки его помнит.
    expect(game.gate.best).toBeGreaterThanOrEqual(0);
  });

  it('пока игрок у босса, попытка идёт и прогресс копится', () => {
    const game = makeGame();
    game.player.x = game.boss.x;
    game.player.y = game.boss.y;
    for (let i = 0; i < 60; i++) game.tick(1 / balance.loop.tickHz);
    expect(game.gate.inAttempt).toBe(true);
    expect(game.gate.currentProgress).toBeGreaterThan(0);
  });
});

describe('Гейт — прогресс попытки', () => {
  it('без боя с боссом попытки нет и экран не всплывает', () => {
    const gate = new Gate();
    expect(gate.end()).toBeNull();
  });

  it('считает лучшее за попытку, а не остаток HP на момент смерти', () => {
    const gate = new Gate();
    gate.note(0.6);
    gate.note(0.35); // просадили до 65%
    gate.note(0.5);  // босс отрос обратно
    const attempt = gate.end();
    expect(attempt?.progress).toBeCloseTo(0.65, 6);
  });

  it('вторая попытка помнит первую — это и есть дельта на экране', () => {
    const gate = new Gate();
    gate.note(0.7);
    expect(gate.end()?.previous).toBeNull();

    gate.note(0.4);
    const second = gate.end();
    expect(second?.progress).toBeCloseTo(0.6, 6);
    expect(second?.previous).toBeCloseTo(0.3, 6);
  });

  it('переход дальше закрыт, пока босс не убит', () => {
    const gate = new Gate();
    gate.note(0.02);
    gate.end();
    expect(gate.canAdvance).toBe(false);

    const win = gate.markDefeated();
    expect(win.progress).toBe(1);
    expect(gate.canAdvance).toBe(true);
  });
});
