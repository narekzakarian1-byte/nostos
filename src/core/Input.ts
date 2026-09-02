import { getBalance } from './Balance.ts';

/**
 * Единственный ввод в игре — движение. Кнопки атаки нет и не будет:
 * это несущая конструкция всей боевой системы (GDD §4.1).
 *
 * Фиксированный джойстик: кольцо всегда на экране в одной точке (её задаёт
 * anchor — main.ts пересчитывает её при ресайзе), тач в любом месте игрового
 * поля тянет ручку относительно этого центра. Pointer Events закрывают
 * палец и мышь одним кодом.
 */
export class Input {
  private activeId: number | null = null;
  private currentX = 0;
  private currentY = 0;
  private held = false;

  /** Вызывается на первом касании — там поднимается WebAudio. */
  onFirstGesture: (() => void) | null = null;
  private gestureFired = false;

  private readonly canvas: HTMLCanvasElement;
  /** Перевод координат события в виртуальные экранные единицы (без камеры). */
  private readonly toScreen: (clientX: number, clientY: number) => { x: number; y: number };
  /**
   * Тап по интерфейсу (панель апгрейда, миникарта). Вернёт true — касание
   * считается нажатием на UI и джойстик не активируется: иначе апгрейд
   * оружия или открытие карты дёргали бы персонажа.
   */
  private readonly onUiTap: (screenX: number, screenY: number) => boolean;
  /** Центр кольца джойстика в виртуальных экранных единицах. Зависит от текущей высоты вида. */
  private readonly anchor: () => { x: number; y: number };

  constructor(
    canvas: HTMLCanvasElement,
    toScreen: (clientX: number, clientY: number) => { x: number; y: number },
    onUiTap: (screenX: number, screenY: number) => boolean,
    anchor: () => { x: number; y: number },
  ) {
    this.canvas = canvas;
    this.toScreen = toScreen;
    this.onUiTap = onUiTap;
    this.anchor = anchor;
    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerup', this.onUp);
    canvas.addEventListener('pointercancel', this.onUp);
  }

  get isHeld(): boolean {
    return this.held;
  }

  get anchorX(): number {
    return this.anchor().x;
  }

  get anchorY(): number {
    return this.anchor().y;
  }

  /** Направление × сила стика, обе координаты в [-1, 1]. (0, 0), если стик не тронут. */
  get dirX(): number {
    return this.vector().x;
  }

  get dirY(): number {
    return this.vector().y;
  }

  /** Смещение ручки от центра кольца в виртуальных единицах — для отрисовки. */
  get knobOffsetX(): number {
    return this.vector().x * getBalance().joystick.maxDragRadius;
  }

  get knobOffsetY(): number {
    return this.vector().y * getBalance().joystick.maxDragRadius;
  }

  private vector(): { x: number; y: number } {
    if (!this.held) return { x: 0, y: 0 };
    const { joystick } = getBalance();
    const a = this.anchor();
    const dx = this.currentX - a.x;
    const dy = this.currentY - a.y;
    const len = Math.hypot(dx, dy);
    if (len < joystick.deadzoneRadius) return { x: 0, y: 0 };
    const clampedLen = Math.min(len, joystick.maxDragRadius);
    const norm = clampedLen / joystick.maxDragRadius;
    return { x: (dx / len) * norm, y: (dy / len) * norm };
  }

  private readonly onDown = (event: PointerEvent): void => {
    if (this.activeId !== null) return;

    if (!this.gestureFired) {
      this.gestureFired = true;
      this.onFirstGesture?.();
    }

    const point = this.toScreen(event.clientX, event.clientY);
    if (this.onUiTap(point.x, point.y)) {
      event.preventDefault();
      return;
    }

    this.activeId = event.pointerId;
    this.held = true;
    this.canvas.setPointerCapture(event.pointerId);
    this.currentX = point.x;
    this.currentY = point.y;
    event.preventDefault();
  };

  private readonly onMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.activeId) return;
    const point = this.toScreen(event.clientX, event.clientY);
    this.currentX = point.x;
    this.currentY = point.y;
    event.preventDefault();
  };

  private readonly onUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.activeId) return;
    this.activeId = null;
    this.held = false;
  };
}
