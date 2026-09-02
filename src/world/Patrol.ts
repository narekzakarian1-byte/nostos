import { getBalance } from '../core/Balance.ts';
import type { PatrolKind } from '../core/BalanceTypes.ts';
import type { Rng } from '../core/Rng.ts';
import type { FarmTier } from './Enemy.ts';

/**
 * Замкнутый маршрут врага вокруг своей точки.
 *
 * Враги не преследуют игрока и не бродят случайно: каждый ходит по одной и той
 * же фигуре круг за кругом. Повторяемость здесь и есть смысл — маршрут видно
 * заранее, поэтому «подойти к этому узлу, но не задеть соседний» становится
 * расчётом, а не реакцией. Случайное блуждание давало бы ту же картинку и
 * отнимало бы это решение.
 *
 * Только математика: ни канваса, ни времени кадра (CLAUDE.md — слои разделены).
 */
export interface PatrolPath {
  readonly kind: PatrolKind;
  /** Якорь — точка, вокруг которой построена фигура. */
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
  /** Единиц мира в секунду вдоль маршрута. */
  readonly speed: number;
  /** Поворот фигуры: без него все маршруты острова смотрят одинаково. */
  readonly angle: number;
  /** Длина замкнутого пути — из неё скорость переводится в долю прогресса. */
  readonly length: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Маршрут по тиру. `maxRadius` не даёт фигуре вылезти за край острова:
 * враг, наполовину ушедший за границу, читается как ошибка спавна.
 */
export function makePatrol(
  rng: Rng,
  tier: FarmTier,
  x: number,
  y: number,
  maxRadius: number,
): PatrolPath {
  const { patrol } = getBalance();
  const kinds = patrol.kindByTier[tier];
  const kind = kinds[rng.int(0, kinds.length - 1)] ?? 'guard';
  const radius = Math.max(0, Math.min(rng.range(patrol.radius.min, patrol.radius.max), maxRadius));
  const speed = kind === 'guard' ? 0 : patrol.speedByTier[tier];
  const angle = rng.range(0, Math.PI * 2);
  return { kind, cx: x, cy: y, radius, speed, angle, length: pathLength(kind, radius) };
}

/** Стартовая фаза. Отдельно от makePatrol: путь неизменен, фаза — состояние врага. */
export function randomPhase(rng: Rng): number {
  return rng.next();
}

/** Прогресс всегда в [0, 1): маршрут замкнут, поэтому просто заворачиваем. */
export function advance(path: PatrolPath, progress: number, dt: number): number {
  if (path.length <= 0 || path.speed <= 0) return progress;
  const next = progress + (path.speed * dt) / path.length;
  return next - Math.floor(next);
}

export function patrolPoint(path: PatrolPath, progress: number): Point {
  const local = localPoint(path.kind, path.radius, progress - Math.floor(progress));
  const cos = Math.cos(path.angle);
  const sin = Math.sin(path.angle);
  return {
    x: path.cx + local.x * cos - local.y * sin,
    y: path.cy + local.x * sin + local.y * cos,
  };
}

/** Точки для отрисовки маршрута под ногами. Замкнутая ломаная. */
export function patrolOutline(path: PatrolPath, steps: number): Point[] {
  if (path.kind === 'guard' || path.radius <= 0) return [];
  const points: Point[] = [];
  for (let i = 0; i < steps; i++) points.push(patrolPoint(path, i / steps));
  return points;
}

/**
 * Шаг маршрутов за тик. Сцепленный с игроком враг замирает: иначе он уходит
 * из радиуса сам, и решение «дожать или отойти» принимает за игрока таймер
 * траектории, а не игрок.
 */
export function stepPatrols<T extends EnemyOnPath>(
  enemies: readonly T[],
  engaged: (enemy: T) => boolean,
  dt: number,
): void {
  const { pauseInCombat } = getBalance().patrol;
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    if (pauseInCombat && engaged(enemy)) continue;
    enemy.tickPatrol(dt);
  }
}

/** Всё, что нужно от врага для шага по маршруту. Структурный тип: Patrol не
 *  должен зависеть от класса Enemy, иначе модули ссылаются друг на друга. */
export interface EnemyOnPath {
  readonly alive: boolean;
  tickPatrol(dt: number): void;
}

function pathLength(kind: PatrolKind, radius: number): number {
  const { circleAspect, eightPerimeterK } = getBalance().patrol;
  if (kind === 'circle') return Math.PI * radius * (1 + circleAspect);
  if (kind === 'line') return radius * 4;
  if (kind === 'eight') return radius * eightPerimeterK;
  return 0;
}

function localPoint(kind: PatrolKind, radius: number, p: number): Point {
  const { circleAspect } = getBalance().patrol;
  const turn = Math.PI * 2 * p;

  if (kind === 'circle') {
    return { x: Math.cos(turn) * radius, y: Math.sin(turn) * radius * circleAspect };
  }
  if (kind === 'line') {
    // Треугольная волна: ровное движение туда и обратно, без рывка на развороте.
    return { x: (1 - Math.abs(p * 4 - 2)) * radius, y: 0 };
  }
  if (kind === 'eight') {
    return { x: Math.sin(turn) * radius, y: (Math.sin(turn * 2) * radius * circleAspect) / 2 };
  }
  return { x: 0, y: 0 };
}
