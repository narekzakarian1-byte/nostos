import { getBalance } from '../core/Balance.ts';
import { bestType } from '../core/Combat.ts';
import type { DamageType } from '../core/BalanceTypes.ts';
import type { Game } from '../core/Game.ts';
import { swingPhase, swingPush } from '../juice/BodyAnim.ts';
import { rigPose, stroke, walkPhase } from '../juice/RigPose.ts';
import type { WeaponPartId } from './rig/RigParts.ts';
import { degToRad } from '../juice/Ease.ts';
import type { Enemy } from '../world/Enemy.ts';
import { currentIslandId } from '../world/Island.ts';
import { enemySpriteChain } from './IslandArt.ts';
import { drawBody } from './Body.ts';
import { short } from './Format.ts';
import type { SpriteId } from './AssetManifest.ts';
import { sprites } from './Sprites.ts';
import { bar, ui } from './UiKit.ts';

/**
 * Фигуры на земле: игрок, враги, кольца ранга и цели. Отдельно от Renderer.ts,
 * который отвечает за порядок слоёв, от Body.ts, который знает про трансформы
 * одной фигуры, и от EnemyBadge.ts, который рисует плашки над головой.
 */
export function drawEnemyBody(ctx: CanvasRenderingContext2D, enemy: Enemy, game: Game): void {
  const { palette } = getBalance();
  const push = enemyPush(enemy, game);

  drawRankRing(ctx, enemy);
  drawBody(ctx, {
    x: enemy.x, y: enemy.y, size: enemy.size,
    facing: enemy.facing,
    sprite: enemySprite(enemy),
    fallback: palette.silhouette,
    anim: enemy.anim,
    pushX: push.x, pushY: push.y,
    tilt: push.tilt,
    bob: 0,
  });
}

export function drawPlayer(ctx: CanvasRenderingContext2D, game: Game): void {
  const { render, palette } = getBalance();
  const u = ui();
  const player = game.player;
  const push = playerPush(game);

  // Покачивание считается от пройденного пути, а не от времени: на месте
  // игрок стоит ровно, а на любой скорости шаг остаётся шагом. Ноги куклы идут
  // от этой же фазы — иначе шаг разойдётся с покачиванием и фигура «поплывёт».
  const moving = game.input.isHeld;
  const walk = walkPhase(player.walked);
  const bob = moving ? Math.sin(walk) * u.walkBobAmp : 0;
  const type = strikingType(game);

  drawBody(ctx, {
    x: player.x, y: player.y, size: render.playerSize,
    facing: Math.cos(player.facingAngle) < 0 ? -1 : 1,
    sprite: 'player',
    fallback: palette.accentLight,
    anim: player.anim,
    pushX: push.x, pushY: push.y,
    tilt: push.tilt,
    bob,
    rig: {
      pose: rigPose({
        swing: swingPhase(player.attackCooldown, stroke(type).windupSec),
        type,
        walk,
        moving,
        elapsed: game.elapsed,
      }),
      weapon: WEAPON_ART[type],
    },
  });
}

export function drawPlayerBar(ctx: CanvasRenderingContext2D, game: Game): void {
  const { render } = getBalance();
  const u = ui();
  const player = game.player;
  const width = u.playerBarWidth;
  const top = player.y - render.playerSize / 2 - u.playerBarOffset - u.barHeight;
  bar(
    ctx,
    player.x - width / 2, top, width, u.barHeight,
    player.hpFraction,
    u.colors.hpPlayer,
    short(Math.max(0, player.hp)),
  );
}

/**
 * Кольцо под текущей целью. Бьют игрока все, кто в радиусе, а отвечает он
 * только ближайшему (Engagement) — без метки непонятно, чьё HP убывает.
 */
export function drawTargetRing(ctx: CanvasRenderingContext2D, target: Enemy): void {
  const u = ui();
  ctx.save();
  ctx.lineWidth = u.outline * 1.5;
  ctx.strokeStyle = u.colors.alert;
  ctx.beginPath();
  ctx.ellipse(
    target.x, target.y + target.size / 2,
    target.size * 0.6, target.size * 0.24, 0, 0, Math.PI * 2,
  );
  ctx.stroke();
  ctx.restore();
}

interface Push {
  readonly x: number;
  readonly y: number;
  readonly tilt: number;
}

const STILL: Push = { x: 0, y: 0, tilt: 0 };

/**
 * Выпад игрока к цели. Фаза берётся из счётчика удара, своих часов нет.
 * Длина выпада — из профиля типа: копьё выстреливает корпусом вдвое дальше
 * меча, палица почти стоит на месте и отыгрывает вес наклоном.
 */
function playerPush(game: Game): Push {
  const target = game.target;
  if (!target || !game.player.alive) return STILL;
  const hand = stroke(strikingType(game));
  const phase = swingPhase(game.player.attackCooldown, hand.windupSec);
  const distance = swingPush(phase, hand.windupLean, hand.lungeUnits);
  return toward(
    target.x - game.player.x, target.y - game.player.y,
    distance, hand.lungeUnits, hand.tiltDeg,
  );
}

/** Замах врага. Только у сцепленных: у прочих счётчик удара стоит на месте. */
function enemyPush(enemy: Enemy, game: Game): Push {
  if (!enemy.alive || !game.isEngaged(enemy)) return STILL;
  const { anim } = getBalance();
  const phase = swingPhase(enemy.attackCooldown, anim.enemyWindupSec);
  const distance = swingPush(phase, anim.windupLean, anim.enemyLungeUnits);
  return toward(
    game.player.x - enemy.x, game.player.y - enemy.y,
    distance, anim.enemyLungeUnits, anim.swingTiltDeg,
  );
}

/**
 * Смещение вдоль направления удара и наклон корпуса от него же. Наклон связан
 * с выпадом одной величиной: фигура отклоняется назад на замахе и валится
 * вперёд на проводке сама, без второй кривой, которая могла бы разойтись.
 */
function toward(
  dx: number, dy: number,
  distance: number,
  lunge: number,
  tiltDeg: number,
): Push {
  const length = Math.hypot(dx, dy) || 1;
  const lean = lunge > 0 ? distance / lunge : 0;
  return {
    x: (dx / length) * distance,
    y: (dy / length) * distance,
    tilt: degToRad(tiltDeg) * lean * Math.sign(dx || 1),
  };
}

/**
 * Кольцо под ногами элиты и мини-босса. К ним ходят адресно, и ранг должен
 * читаться раньше плашки над головой: кольцо видно даже когда враг перекрыт
 * соседом. Оно же держит ранг, когда спрайта тира ещё нет и фигура взята
 * запасная (см. ENEMY_SPRITES_BY_TIER).
 */
function drawRankRing(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
  if (enemy.tier === 'normal' || !enemy.alive) return;
  const u = ui();
  ctx.save();
  ctx.lineWidth = u.outline;
  ctx.strokeStyle = enemy.tier === 'miniboss' ? u.colors.gold : u.colors.chip;
  ctx.beginPath();
  ctx.ellipse(enemy.x, enemy.y + enemy.size / 2, enemy.size / 2, enemy.size / 5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Первый загруженный спрайт из цепочки для тира: сначала фигура своего острова,
 * за ней общие запасные (ui/IslandArt.ts).
 */
function enemySprite(enemy: Enemy): SpriteId | undefined {
  for (const id of enemySpriteChain(currentIslandId(), enemy.tier)) {
    if (sprites.get(id)) return id;
  }
  return undefined;
}

/**
 * Что у Одиссея в руке. Не произвольная картинка, а то оружие, которым он
 * сейчас реально бьёт: тот же bestType, что красит дугу удара и три иконки над
 * врагом. Значит по фигуре видно выбор игры ещё до того, как посчитан урон.
 */
const WEAPON_ART: Record<DamageType, WeaponPartId> = {
  slash: 'sword',
  pierce: 'spear',
  // Своей булавы пока нет, дробящий берёт меч: узнаваемый силуэт в руке лучше
  // пустого кулака. Появится арт — правится здесь одной строкой. Жест при
  // этом уже свой: замах из-за головы читается как палица и с мечом в руке.
  crush: 'sword',
};

/**
 * Чем игрок бьёт прямо сейчас — тот тип, который пробивает эту защиту лучше
 * всех. Залп идёт всеми тремя оружиями сразу (Combat.hitDamage), поэтому
 * «надетого» оружия в игре нет; показывается решающее. Тот же bestType красит
 * дугу удара и стоит за тремя иконками над врагом, так что жест фигуры,
 * цвет следа и иконки говорят одно и то же.
 */
export function strikingType(game: Game): DamageType {
  const target = game.target;
  // Без цели выбирать не против кого — рука держит рубящее по умолчанию.
  if (!target) return 'slash';
  const player = game.player;
  return bestType(player.stats, player.weapons, target.def);
}
