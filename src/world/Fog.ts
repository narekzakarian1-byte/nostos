import { getBalance } from '../core/Balance.ts';

/**
 * Туман войны: мир разбит на сетку клеток фиксированного размера, клетка
 * открывается, когда игрок оказался в revealRadius от её центра. Только
 * данные, без канваса — рисует ui/Minimap.ts. Не сохраняется между сессиями:
 * CLAUDE.md запрещает localStorage до Фазы 3.
 */
export class Fog {
  readonly cols: number;
  readonly rows: number;
  readonly cellSize: number;
  private readonly visited: Uint8Array;

  constructor(worldWidth: number, worldHeight: number) {
    const { cellSize } = getBalance().fog;
    this.cellSize = cellSize;
    this.cols = Math.ceil(worldWidth / cellSize);
    this.rows = Math.ceil(worldHeight / cellSize);
    this.visited = new Uint8Array(this.cols * this.rows);
  }

  /** Открывает все клетки в revealRadius от (x, y) в мировых координатах. */
  reveal(x: number, y: number): void {
    const { revealRadius } = getBalance().fog;
    const minCol = Math.max(0, Math.floor((x - revealRadius) / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((x + revealRadius) / this.cellSize));
    const minRow = Math.max(0, Math.floor((y - revealRadius) / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((y + revealRadius) / this.cellSize));

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const cx = col * this.cellSize + this.cellSize / 2;
        const cy = row * this.cellSize + this.cellSize / 2;
        if (Math.hypot(cx - x, cy - y) <= revealRadius) {
          this.visited[row * this.cols + col] = 1;
        }
      }
    }
  }

  isVisitedCell(col: number, row: number): boolean {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
    return this.visited[row * this.cols + col] === 1;
  }

  isVisitedAt(x: number, y: number): boolean {
    return this.isVisitedCell(Math.floor(x / this.cellSize), Math.floor(y / this.cellSize));
  }
}
