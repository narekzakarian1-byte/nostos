import { getBalance } from '../core/Balance.ts';
import type { Input } from '../core/Input.ts';
import { ui } from './UiKit.ts';

/**
 * Кольцо джойстика по референсу: полупрозрачный круг с четырьмя стрелками по
 * сторонам и ручкой внутри. Кольцо стоит на экране неподвижно, за пальцем
 * едет только ручка.
 *
 * Стрелки не украшение: без них круг читается как непонятная мишень, а
 * движение — единственный ввод в игре, и промахнуться по нему нельзя.
 */
export function drawJoystick(ctx: CanvasRenderingContext2D, input: Input): void {
  const { joystick } = getBalance();
  const u = ui();
  const cx = input.anchorX;
  const cy = input.anchorY;

  ctx.save();
  ctx.globalAlpha = u.joystickAlpha;
  // Тёмная подложка под белым кольцом: на выгоревшей светлой земле белое по
  // белому пропадает, а стик — единственный орган управления в игре.
  ctx.lineWidth = u.outline * 3;
  ctx.strokeStyle = u.colors.outline;
  ctx.beginPath();
  ctx.arc(cx, cy, joystick.baseRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = u.joystickAlpha * 2.4;
  ctx.lineWidth = u.outline * 1.5;
  ctx.strokeStyle = u.colors.text;
  ctx.stroke();

  const arrow = u.joystickArrow;
  ctx.globalAlpha = u.joystickAlpha * 2.4;
  ctx.fillStyle = u.colors.text;
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i;
    ctx.save();
    ctx.translate(
      cx + Math.cos(angle) * (joystick.baseRadius - arrow * 0.7),
      cy + Math.sin(angle) * (joystick.baseRadius - arrow * 0.7),
    );
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(arrow * 0.5, 0);
    ctx.lineTo(-arrow * 0.3, arrow * 0.5);
    ctx.lineTo(-arrow * 0.3, -arrow * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Ручка ярче кольца и ещё ярче под пальцем: так видно, что стик схвачен.
  ctx.globalAlpha = input.isHeld ? u.joystickAlpha * 3 : u.joystickAlpha * 2;
  ctx.beginPath();
  ctx.arc(cx + input.knobOffsetX, cy + input.knobOffsetY, joystick.knobRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
