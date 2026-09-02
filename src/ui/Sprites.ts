import { SPRITES, type SpriteId } from './AssetManifest.ts';

/**
 * Загрузчик текстур. Если файла нет или он не загрузился — get()/pattern()
 * вернут undefined, и вызывающий код в Renderer.ts рисует прежний
 * прямоугольник. Так арт добавляется по одной картинке, без правок кода.
 */
class Sprites {
  private readonly images = new Map<SpriteId, HTMLImageElement>();
  private readonly patterns = new Map<SpriteId, CanvasPattern>();
  private readonly silhouettes = new Map<string, HTMLCanvasElement>();

  async load(): Promise<void> {
    const ids = Object.keys(SPRITES) as SpriteId[];
    await Promise.all(ids.map((id) => this.loadOne(id)));
  }

  private loadOne(id: SpriteId): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(id, img);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = `${import.meta.env.BASE_URL}${SPRITES[id].src}`;
    });
  }

  get(id: SpriteId): HTMLImageElement | undefined {
    return this.images.get(id);
  }

  /**
   * Одноцветный отпечаток спрайта — им рисуется вспышка попадания. Готовится
   * один раз на цвет и кэшируется: перекрашивать текстуру в каждом кадре боя
   * на телефоне слишком дорого.
   */
  silhouette(id: SpriteId, color: string): HTMLCanvasElement | undefined {
    const key = `${id}|${color}`;
    const cached = this.silhouettes.get(key);
    if (cached) return cached;

    const img = this.images.get(id);
    if (!img) return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    ctx.drawImage(img, 0, 0);
    // source-in оставляет заливку только там, где у текстуры есть непрозрачность.
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.silhouettes.set(key, canvas);
    return canvas;
  }

  /** Повторяющийся паттерн для замощения земли. Кэшируется на первый вызов. */
  pattern(ctx: CanvasRenderingContext2D, id: SpriteId): CanvasPattern | undefined {
    const cached = this.patterns.get(id);
    if (cached) return cached;
    const img = this.images.get(id);
    if (!img) return undefined;
    const made = ctx.createPattern(img, 'repeat');
    if (made) this.patterns.set(id, made);
    return made ?? undefined;
  }
}

export const sprites = new Sprites();
