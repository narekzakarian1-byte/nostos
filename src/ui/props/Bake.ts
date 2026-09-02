import { getBalance } from '../../core/Balance.ts';
import { optics } from './Optics.ts';
import { PROP_MODELS, type PropId } from './Models.ts';
import { bodyBox, drawSolid, fullBox } from './Solid.ts';

/**
 * Запекание пропов. Камера и свет неподвижны, поэтому картинка пропа не
 * меняется от кадра к кадру — считать её каждый раз незачем: семь десятков
 * объектов по полторы сотни граней это десять тысяч полигонов в кадре, и на
 * телефоне шестидесяти кадров уже не будет.
 *
 * Проп рисуется в отдельный холст один раз на нужный размер, дальше на экран
 * идёт готовая картинка — ровно та же стоимость кадра, что была со спрайтами.
 */
export interface PropMetrics {
  /** Размер в единицах мира, вместе с тенью. По нему отсекается невидимое. */
  readonly width: number;
  readonly height: number;
  /** Смещение от левого верхнего угла картинки до точки касания земли. */
  readonly originX: number;
  readonly originY: number;
  /** Множитель из единиц модели в единицы мира. */
  readonly scale: number;
}

/** Потолок стороны холста: страховка от аварийного выделения памяти на пропе. */
const MAX_BAKE_PX = 1024;

const metricsCache = new Map<PropId, PropMetrics>();
const bakeCache = new Map<string, HTMLCanvasElement>();

/**
 * Габариты пропа в мире. Чистая арифметика без канваса — поэтому доступна и в
 * тестах, где нет DOM.
 *
 * Точка касания земли здесь не подгоняется руками, как раньше подбирался
 * anchor у спрайта: она равна началу координат модели по построению, и
 * промахнуться ею нельзя.
 */
export function propMetrics(id: PropId): PropMetrics {
  const cached = metricsCache.get(id);
  if (cached) return cached;

  const p = getBalance().props;
  const faces = PROP_MODELS[id];
  const body = bodyBox(faces);
  const full = fullBox(faces);
  const size = p.sizes[id];
  const scale = size.fit === 'width'
    ? size.value / (body.maxX - body.minX)
    : size.value / (body.maxY - body.minY);

  // Контактное затемнение рисуется вокруг начала координат и у низких пропов
  // выходит за габарит тела — без учёта оно обрезалось бы краем холста.
  const foot = (body.maxX - body.minX) * p.contactSpread;
  const footY = foot * optics().groundSquash * p.contactSquash;
  const minX = Math.min(full.minX, -foot);
  const maxX = Math.max(full.maxX, foot);
  const minY = Math.min(full.minY, -footY);
  const maxY = Math.max(full.maxY, footY);

  const result: PropMetrics = {
    width: (maxX - minX) * scale,
    height: (maxY - minY) * scale,
    originX: -minX * scale,
    originY: -minY * scale,
    scale,
  };
  metricsCache.set(id, result);
  return result;
}

/**
 * Готовый холст пропа под конкретную плотность пикселей. Ключ округляется до
 * четверти пикселя на единицу: без округления каждое изменение размера окна
 * плодило бы новый холст на каждый проп.
 */
function baked(id: PropId, pxPerUnit: number): HTMLCanvasElement | undefined {
  const key = `${id}|${Math.round(pxPerUnit * 4)}`;
  const hit = bakeCache.get(key);
  if (hit) return hit;

  const m = propMetrics(id);
  const width = Math.ceil(m.width * pxPerUnit);
  const height = Math.ceil(m.height * pxPerUnit);
  if (width <= 0 || height <= 0 || width > MAX_BAKE_PX || height > MAX_BAKE_PX) return undefined;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;

  const modelToPx = m.scale * pxPerUnit;
  ctx.setTransform(modelToPx, 0, 0, modelToPx, m.originX * pxPerUnit, m.originY * pxPerUnit);
  drawSolid(ctx, PROP_MODELS[id], modelToPx);

  bakeCache.set(key, canvas);
  return canvas;
}

/**
 * Проп на экран. x, y — точка КАСАНИЯ земли, как и раньше у спрайта; всё
 * остальное берётся из метрик, поэтому подгонять якорь под каждую модель не
 * нужно.
 */
export function drawPropSolid(ctx: CanvasRenderingContext2D, id: PropId, x: number, y: number): void {
  const pxPerUnit = ctx.getTransform().a || 1;
  const canvas = baked(id, pxPerUnit);
  if (!canvas) return;
  const m = propMetrics(id);
  ctx.drawImage(canvas, x - m.originX, y - m.originY, m.width, m.height);
}
