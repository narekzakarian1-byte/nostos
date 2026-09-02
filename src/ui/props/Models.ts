import type { Face } from './Optics.ts';
import { box, lathe, layDown, mirrorX, shift, tube, vary } from './Shapes.ts';

/**
 * Формы пропов. Это не баланс, а геометрия — она живёт в коде по тому же
 * праву, что и векторные пути иконок в Glyphs.ts. Из balance.json приходят
 * камера, свет, тени и размеры в мире; отсюда — только пропорции.
 *
 * Все модели рассчитаны на общую камеру с наклоном: она сжимает высоту
 * примерно до 57%, поэтому колонна в модели заведомо длиннее «правильной» —
 * иначе на экране получается пенёк.
 */
export type PropId =
  | 'prop-column'
  | 'prop-column-broken'
  | 'prop-column-drum'
  | 'prop-ruin-gate'
  | 'prop-amphora'
  | 'prop-rock'
  | 'prop-rock-small'
  | 'prop-rubble'
  | 'prop-campfire';

const SHAFT = [
  [0.62, 0.20], [0.62, 0.26], [0.58, 0.36], [0.56, 5.15],
  [0.62, 5.55], [0.72, 5.80], [0.56, 5.95],
] as const;

const column: Face[] = [
  ...lathe(SHAFT, 10, 'marble', 0.16),
  ...box(0, 0, 5.95, 1.36, 1.36, 0.26, 'marble'), // абак
  ...box(0, 0, 0, 1.42, 1.42, 0.18, 'marble'),    // плинт
];

const columnBroken: Face[] = [
  ...lathe([[0.62, 0.20], [0.62, 0.26], [0.58, 0.36], [0.57, 2.20], [0.55, 2.34]], 10, 'marble', 0.16),
  ...box(0, 0, 0, 1.42, 1.42, 0.18, 'marble'),
];

const columnDrum: Face[] = shift(
  layDown(lathe([[0.60, 0], [0.60, 1.70]], 10, 'marble', 0.14)),
  0, 0, 0.60,
);

const ruinGate: Face[] = [
  ...shift(column, -1.95, 0, 0),
  ...shift(column, 1.95, 0, 0),
  ...box(0, 0, 6.25, 5.05, 1.45, 0.62, 'marble'), // архитрав
  ...box(0, 0, 6.87, 5.45, 1.68, 0.26, 'marble'), // карниз
];

const amphoraArm = tube(
  [[0.48, 0, 0.98], [0.72, 0, 1.10], [0.74, 0, 1.32], [0.52, 0, 1.46], [0.24, 0, 1.50]],
  0.10, 5, 'clay',
);

const amphora: Face[] = [
  ...lathe([
    [0.20, 0], [0.28, 0.08], [0.20, 0.18], [0.38, 0.40], [0.54, 0.76], [0.55, 1.02],
    [0.42, 1.28], [0.26, 1.48], [0.22, 1.62], [0.32, 1.72], [0.27, 1.78],
  ], 12, 'clay'),
  ...amphoraArm,
  ...mirrorX(amphoraArm),
];

const rock: Face[] = lathe(
  [[0.50, 0], [0.78, 0.22], [0.86, 0.54], [0.60, 0.90], [0.26, 1.06]],
  7, 'stone', 0, vary(7, 0.24, 11),
);

const rockSmall: Face[] = lathe(
  [[0.54, 0], [0.80, 0.20], [0.66, 0.52], [0.24, 0.66]],
  6, 'stone', 0, vary(6, 0.26, 29),
);

// Плитка лежит почти заподлицо. В референсе именно такие плашки набирают
// плотность картинки: их много, они не перекрывают врагов и не спорят за
// внимание с тремя иконками над ними.
const rubble: Face[] = lathe(
  [[0.52, 0], [0.56, 0.055], [0.48, 0.085]],
  6, 'rubble', 0, vary(6, 0.14, 5),
);

const campfire: Face[] = (() => {
  const faces: Face[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * 2 * Math.PI;
    faces.push(...shift(
      lathe([[0.22, 0], [0.28, 0.11], [0.17, 0.24]], 5, 'stone', 0, vary(5, 0.2, i * 7 + 1)),
      Math.cos(a) * 0.80, Math.sin(a) * 0.80, 0,
    ));
  }
  faces.push(...lathe([[0.16, 0], [0.11, 0.30]], 4, 'wood'));
  faces.push(...shift(layDown(lathe([[0.09, 0], [0.09, 0.90]], 4, 'wood')), 0, 0, 0.10));
  faces.push(...shift(lathe([[0.12, 0], [0.32, 0.20], [0.24, 0.52], [0.001, 0.92]], 6, 'ember'), 0, 0, 0.10));
  return faces;
})();

export const PROP_MODELS: Readonly<Record<PropId, readonly Face[]>> = {
  'prop-column': column,
  'prop-column-broken': columnBroken,
  'prop-column-drum': columnDrum,
  'prop-ruin-gate': ruinGate,
  'prop-amphora': amphora,
  'prop-rock': rock,
  'prop-rock-small': rockSmall,
  'prop-rubble': rubble,
  'prop-campfire': campfire,
};

export const PROP_IDS = Object.keys(PROP_MODELS) as readonly PropId[];
