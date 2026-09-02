import { getBalance } from '../core/Balance.ts';

/**
 * Камера едет за игроком по обеим осям. Мир больше экрана, потому что узлы
 * карты на один телефонный экран не помещаются, а «идти к конкретному
 * мини-боссу» должно быть буквальным действием, а не переводом взгляда.
 */
export class Camera {
  private offsetX = 0;
  private offsetY = 0;
  /** Ширина видимой области в виртуальных единицах. Постоянна — равна одному экрану. */
  readonly viewWidth: number;
  /** Высота видимой области в виртуальных единицах. Меняется вместе с окном. */
  viewHeight: number;

  constructor(viewWidth: number, viewHeight: number) {
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
  }

  get x(): number {
    return this.offsetX;
  }

  get y(): number {
    return this.offsetY;
  }

  /**
   * Держит игрока в центре ИГРОВОЙ области — между HUD сверху и панелью
   * апгрейда снизу, а не по всей высоте вида.
   *
   * Края мира намеренно не ограничивают камеру. Кламп по краю прижимал бы
   * игрока к низу экрана — под панель апгрейда и под кольцо джойстика, то
   * есть ровно туда, где его не видно. Пустоты за краем при этом не
   * возникает: земля мостится бесшовным тайлом по всей видимой области, а
   * край острова читается по рамке границы (Scenery.border).
   */
  follow(targetX: number, targetY: number): void {
    const { hudHeight, upgradePanelHeight } = getBalance().render;
    const playableH = this.viewHeight - hudHeight - upgradePanelHeight;
    this.offsetY = targetY - hudHeight - playableH / 2;
    this.offsetX = targetX - this.viewWidth / 2;
  }

  /** Виден ли объект с запасом в margin — всё остальное не рисуем. */
  isVisible(x: number, y: number, marginX: number, marginY: number): boolean {
    return (
      x + marginX >= this.offsetX &&
      x - marginX <= this.offsetX + this.viewWidth &&
      y + marginY >= this.offsetY &&
      y - marginY <= this.offsetY + this.viewHeight
    );
  }
}
