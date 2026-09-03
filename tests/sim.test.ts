import { describe, it, expect, beforeEach } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { Game } from '../src/core/Game.ts';
import type { Input } from '../src/core/Input.ts';
import { bestType, effectiveMaxHp, incomingDps, totalDps } from '../src/core/Combat.ts';
import { clearNodes } from '../src/save/Save.ts';
import { attemptBoss, bossState, SimPlayer } from '../src/sim/model.ts';

/**
 * Перекрёстная проверка симулятора живой игрой.
 *
 * Формулы у них общие по построению, но сценарий разный: симулятор считает бой
 * одной строкой `netDps * tDeath / bossHp`, а игра крутит фиксированный тик,
 * дискретные удары раз в 1/baseAttackSpeed и непрерывный реген босса. Если эти
 * два ответа разъедутся, все настройки баланса уйдут в молоко: числа крутят по
 * симулятору, а играют в игру.
 *
 * Поэтому здесь не проверяются конкретные числа — только то, что два способа
 * посчитать один и тот же бой дают один и тот же ответ.
 */

const balance = getBalance();
const idleInput = { isHeld: false, dirX: 0, dirY: 0 } as unknown as Input;
const TICK = 1 / balance.loop.tickHz;

/** Сколько секунд боя закладываем в сценарий: длинный бой гасит краевые эффекты. */
const TARGET_DEATH_SEC = 130;
/** DPS игрока относительно регена босса. Больше единицы — шкала едет вниз. */
const TARGET_DPS_OVER_REGEN = 1.35;

beforeEach(() => clearNodes());

/**
 * Игрок, собранный под конкретный бой, а не взятый из прогона островов.
 *
 * Статы выводятся из чисел самого босса, а не вписаны числами: иначе любая
 * правка balance.json ломала бы сценарий (бой становился бы мгновенным или
 * бесконечным), и тест начал бы падать на том, что к его предмету отношения
 * не имеет.
 */
function fittedPlayer(islandNumber: number): SimPlayer {
  const player = new SimPlayer();
  const boss = bossState(islandNumber);

  // Крит и уклонение обнуляем: обе величины случайны в игре и усреднены в
  // симуляторе, а проверяется здесь не совпадение матожиданий, а совпадение боя.
  player.stats.set('crit', 0);
  player.stats.set('dodge', 0);

  const targetDps = boss.regen * TARGET_DPS_OVER_REGEN;
  let low = 0;
  let high = 1;
  const dpsAt = (atk: number): number => {
    for (const type of ['pierce', 'slash', 'crush'] as const) {
      player.stats.set(`${type}Atk`, atk);
    }
    return totalDps(
      player.stats, player.weapons, boss.def,
      bestType(player.stats, player.weapons, boss.def),
    );
  };
  while (dpsAt(high) < targetDps) high *= 2;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if (dpsAt(mid) < targetDps) low = mid;
    else high = mid;
  }
  dpsAt(high);

  const incoming = incomingDps(boss.dps, boss.attackType, player.stats, player.armor);
  // maxHp задаётся до множителя брони: effectiveMaxHp домножит его сам.
  const armorMult = effectiveMaxHp(player.stats, player.armor) / player.stats.maxHp;
  player.stats.set('maxHp', (incoming * TARGET_DEATH_SEC) / armorMult);
  return player;
}

/** Переносит состояние симулятора в живую игру: считать должны одно и то же. */
function transplant(game: Game, player: SimPlayer): void {
  for (const key of player.stats.keys()) game.player.stats.set(key, player.stats.get(key));
  game.player.weapons = player.weapons;
  game.player.armor = player.armor;
  game.player.hp = game.player.maxHp;
}

/** Оставляет на острове одного босса: посторонний враг исказил бы обе стороны. */
function isolateBoss(game: Game): void {
  for (const enemy of game.enemies) {
    if (enemy === game.boss) continue;
    enemy.kill();
    // Без этого SpawnManager.tick поднимет их обратно на первом же тике.
    enemy.respawnIn = Number.POSITIVE_INFINITY;
  }
  game.player.x = game.boss.x;
  game.player.y = game.boss.y;
}

interface Measured {
  readonly tDeath: number;
  readonly progressPct: number;
}

/** Живой бой по фиксированному тику — ровно то, во что играет игрок. */
function fight(game: Game, limitSec: number): Measured {
  let elapsed = 0;
  let lowest = 1;
  while (game.player.alive && game.boss.alive && elapsed < limitSec) {
    game.tick(TICK);
    elapsed += TICK;
    lowest = Math.min(lowest, Math.max(0, game.boss.hpFraction));
  }
  return { tDeath: elapsed, progressPct: (1 - lowest) * 100 };
}

describe('симулятор против живой игры', () => {
  const islandNumber = balance.prototype.islandNumber;

  it('сценарий боя вообще состоятелен: игрок продавливает босса, но умирает', () => {
    const player = fittedPlayer(islandNumber);
    const predicted = attemptBoss(player, bossState(islandNumber));
    expect(predicted.netDps).toBeGreaterThan(0);
    expect(predicted.won).toBe(false);
    expect(predicted.tDeath).toBeCloseTo(TARGET_DEATH_SEC, 0);
  });

  it('DPS по боссу совпадает с точностью до числа', () => {
    const player = fittedPlayer(islandNumber);
    const game = makeGame();
    transplant(game, player);
    isolateBoss(game);
    game.tick(TICK); // сцепка происходит внутри тика

    const predicted = attemptBoss(player, bossState(islandNumber));
    expect(game.currentDps).toBeCloseTo(predicted.playerDps, 6);
    expect(game.netDps).toBeCloseTo(predicted.netDps, 6);
  });

  it('входящий DPS и потолок HP совпадают с точностью до числа', () => {
    const player = fittedPlayer(islandNumber);
    const game = makeGame();
    transplant(game, player);
    isolateBoss(game);
    game.tick(TICK);

    const boss = bossState(islandNumber);
    expect(game.incomingDps).toBeCloseTo(
      incomingDps(boss.dps, boss.attackType, player.stats, player.armor), 6,
    );
    expect(game.player.maxHp).toBeCloseTo(player.hp, 6);
  });

  it('время до смерти и прогресс по боссу сходятся с предсказанием', () => {
    const player = fittedPlayer(islandNumber);
    const predicted = attemptBoss(player, bossState(islandNumber));
    const game = makeGame();
    transplant(game, player);
    isolateBoss(game);

    const measured = fight(game, predicted.tDeath * 3);

    expect(game.player.alive).toBe(false);
    // Удары дискретны, реген босса непрерывен — на длинном бою расхождение
    // укладывается в один удар, то есть в проценты.
    expect(measured.tDeath).toBeGreaterThan(predicted.tDeath * 0.9);
    expect(measured.tDeath).toBeLessThan(predicted.tDeath * 1.1);
    expect(measured.progressPct).toBeGreaterThan(predicted.progressPct * 0.9);
    expect(measured.progressPct).toBeLessThan(predicted.progressPct * 1.1);
  });

  it('гейт не теряет ни одного удара, включая последний перед смертью', () => {
    const player = fittedPlayer(islandNumber);
    const game = makeGame();
    const boss = bossState(islandNumber);
    transplant(game, player);
    isolateBoss(game);

    const measured = fight(game, attemptBoss(player, boss).tDeath * 3);

    // bossScreen выставляется в момент смерти: игрок видит ровно то, что снял.
    expect(game.bossScreen).not.toBeNull();
    const shown = game.bossScreen!.progress * 100;

    // Замер выше берёт шкалу после тика, то есть уже с накинутым регеном, а
    // гейт отмечается в момент удара. Поэтому гейт обязан показать НЕ МЕНЬШЕ —
    // и ровно настолько больше, сколько босс успевает отрастить за один тик.
    const oneTickOfRegen = ((boss.regen * TICK) / boss.hp) * 100;
    expect(shown).toBeGreaterThanOrEqual(measured.progressPct);
    expect(shown - measured.progressPct).toBeLessThanOrEqual(oneTickOfRegen * 1.001);
  });
});

function makeGame(): Game {
  return new Game(
    balance.render.virtualWidth,
    780 * balance.render.worldScreensY,
    idleInput,
    () => {},
    balance.rng.defaultSeed,
  );
}
