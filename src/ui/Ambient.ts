import { getBalance } from '../core/Balance.ts';
import type { Game } from '../core/Game.ts';
import type { Camera } from './Camera.ts';
import { rgba } from './props/Optics.ts';

/**
 * Воздух острова: тепло от огня, угли над кострами, пыльца и чайки над водой.
 *
 * Ничего из этого не механика, и ничего нельзя тронуть пальцем. Нужно оно
 * ровно за одним: мир без движения читается декорацией, сколько ни улучшай
 * отдельные объекты. GDD §10 требует слой мелких откликов с первой фазы, и
 * это его часть — только не от событий боя, а от самого места.
 *
 * КАЖДАЯ частица — чистая функция игрового времени и своего номера. Ни одного
 * накопителя, ни одного массива состояния. Отсюда три следствия сразу:
 * прогон по сиду остаётся воспроизводимым (CLAUDE.md §2), hitstop замораживает
 * воздух вместе с миром, потому что elapsed стоит, и памяти это не стоит
 * ничего — можно нарисовать сотню частиц, не заведя ни одного объекта.
 */

/** Псевдослучайное [0,1) от целого. Тот же приём, что в core/Rng, но без состояния. */
function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Пила [0,1) с индивидуальной фазой: одна частица не должна ходить в ногу с соседкой. */
function cycle(elapsed: number, seconds: number, index: number): number {
  return ((elapsed / seconds) + hash(index)) % 1;
}

export function drawAmbient(ctx: CanvasRenderingContext2D, game: Game, camera: Camera): void {
  drawFires(ctx, game, camera);
  drawMotes(ctx, game, camera);
}

/** Огни рисуются ПОД фигурами — свет лежит на земле, а не поверх людей. */
export function drawFireGlow(ctx: CanvasRenderingContext2D, game: Game, camera: Camera): void {
  const { ambient, palette } = getBalance();
  const t = game.elapsed;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const prop of firesOnScreen(game, camera, ambient.glowRadius)) {
    const pulse = 1 + ambient.glowPulseAmount
      * Math.sin(t * ambient.glowPulseHz * Math.PI * 2 + prop.x * 0.05);
    const radius = ambient.glowRadius * prop.scale * pulse;
    const grad = ctx.createRadialGradient(prop.x, prop.y, 0, prop.x, prop.y, radius);
    grad.addColorStop(0, rgba(palette.accentWarm, ambient.glowAlpha));
    grad.addColorStop(1, rgba(palette.accentWarm, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(prop.x, prop.y, radius, radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Угли над огнём. Поверх фигур: искра, спрятанная за плечом, не читается. */
function drawFires(ctx: CanvasRenderingContext2D, game: Game, camera: Camera): void {
  const { ambient, palette } = getBalance();
  const t = game.elapsed;
  ctx.save();
  ctx.fillStyle = palette.accentWarm;
  let index = 0;
  for (const prop of firesOnScreen(game, camera, ambient.glowRadius)) {
    for (let i = 0; i < ambient.emberCount; i++) {
      index++;
      const phase = cycle(t, ambient.emberSeconds, index);
      // Уголёк гаснет к верхней точке подъёма: исчезающий на полпути читается
      // как пропавший кадр, а догорающий — как уголёк.
      ctx.globalAlpha = (1 - phase) * (1 - phase);
      const sway = Math.sin(phase * 6.2 + index) * ambient.emberSpread * phase;
      const size = ambient.emberSize * (1 - phase * 0.5);
      ctx.fillRect(
        prop.x + sway + (hash(index) - 0.5) * ambient.emberSpread,
        prop.y - phase * ambient.emberRise * prop.scale,
        size, size,
      );
    }
  }
  ctx.restore();
}

/** Пыльца в воздухе. Сеется по видимой области, а не по миру: за экраном её незачем. */
function drawMotes(ctx: CanvasRenderingContext2D, game: Game, camera: Camera): void {
  const { ambient, palette } = getBalance();
  const t = game.elapsed;
  ctx.save();
  ctx.fillStyle = palette.accentLight;
  for (let i = 0; i < ambient.moteCount; i++) {
    const phase = cycle(t, ambient.moteSeconds, i);
    // Прозрачность гаснет к обоим концам пути: частица не должна возникать и
    // пропадать рывком в одной и той же точке экрана.
    ctx.globalAlpha = ambient.moteAlpha * Math.sin(phase * Math.PI);
    const x = camera.x + hash(i * 3 + 1) * camera.viewWidth
      + Math.sin(t * 0.3 + i) * ambient.moteDriftUnits * 0.4;
    const y = camera.y + hash(i * 3 + 2) * camera.viewHeight
      - phase * ambient.moteDriftUnits;
    ctx.fillRect(x, y, ambient.moteSize, ambient.moteSize);
  }
  ctx.restore();
}

/**
 * Чайки над водой у нижнего края мира. Рисуются последними и без тени: они
 * высоко, и тень от них на земле была бы враньём про высоту.
 */
export function drawBirds(ctx: CanvasRenderingContext2D, game: Game, camera: Camera): void {
  const { ambient, palette } = getBalance();
  const t = game.elapsed;
  ctx.save();
  ctx.strokeStyle = palette.silhouette;
  ctx.globalAlpha = ambient.birdAlpha;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < ambient.birdCount; i++) {
    const lap = (t * ambient.birdSpeed + hash(i)) % 1;
    const x = lap * (game.worldWidth + 200) - 100;
    const y = game.worldHeight - 40 - hash(i * 7) * 220;
    if (!camera.isVisible(x, y, 20, 20)) continue;
    // Взмах: крылья ходят вокруг горизонтали, каждая птица в своей фазе.
    const flap = Math.sin(t * ambient.birdFlapHz * Math.PI * 2 + i * 2) * ambient.birdSpan * 0.5;
    ctx.moveTo(x - ambient.birdSpan, y + flap);
    ctx.lineTo(x, y);
    ctx.lineTo(x + ambient.birdSpan, y + flap);
  }
  ctx.stroke();
  ctx.restore();
}

/** Костры и алтари в кадре — единственные пропы, у которых есть свой свет. */
function firesOnScreen(game: Game, camera: Camera, margin: number) {
  return game.scenery.props.filter(
    (prop) => (prop.id === 'prop-campfire' || prop.id === 'prop-altar')
      && camera.isVisible(prop.x, prop.y, margin, margin),
  );
}
