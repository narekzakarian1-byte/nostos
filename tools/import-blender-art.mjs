// Раскладка отрендеренного арта в игру: `node tools/import-blender-art.mjs [id ...]`.
//
// Без аргументов переносит ВСЁ, что лежит в art/metrics. Так и задумано: арт
// острова собирается пачкой в полсотни файлов, и переносить их по одному —
// это гарантированно забыть половину.
//
// Что делает тул, а что человек. Тул пишет только ПРОИЗВОДНЫЕ числа: якорь,
// габарит и след считаются из модели и подгонке не подлежат (ART_RUNBOOK.md
// §7). Всё, что является решением, — размер объекта в мире, его набор в зоне,
// имя в манифесте — остаётся за человеком.
//
// Раньше тул только печатал строки, а вписывались они руками. При двух
// ассетах это работало; при пятидесяти пропах, пятнадцати оружиях и двадцати
// четырёх костях фигур ручной перенос производных чисел — это способ
// незаметно разойтись с рендером.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const only = process.argv.slice(2);
const metricsDir = 'art/metrics';
const balance = JSON.parse(readFileSync('balance.json', 'utf-8'));
const hash = opticsHash(balance.props);

const metrics = readdirSync(metricsDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(metricsDir, f), 'utf-8')))
  .filter((m) => only.length === 0 || only.includes(m.id))
  .sort((a, b) => a.id.localeCompare(b.id));

const stale = metrics.filter((m) => m.balanceHash !== hash);
if (stale.length) {
  console.error(`оптика разошлась у ${stale.length} ассетов, например ${stale[0].id}:`);
  console.error(`  в ассете ${stale[0].balanceHash}, в balance.json ${hash}`);
  console.error('перерендерить: node tools/blender.mjs <asset>');
  process.exit(1);
}

const DEST = {
  prop: 'public/art/props',
  part: 'public/art/weapons',
  figure: 'public/art/figures',
  tile: 'public/art/ground',
};

let bytes = 0;
const sprites = [];
for (const meta of metrics) {
  const kind = meta.kind ?? 'prop';
  const dir = DEST[kind];
  mkdirSync(dir, { recursive: true });
  const names = kind === 'figure' ? meta.bones.map((b) => `${meta.id}-${b.id}`) : [meta.id];
  for (const name of names) {
    for (const suffix of ['', '-shadow']) {
      const from = join('art/out', `${name}${suffix}.png`);
      if (!existsSync(from)) continue;
      const to = join(dir, `${name}${suffix}.png`);
      copyFileSync(from, to);
      bytes += statSync(to).size;
      const px = pixelsOf(meta, name);
      sprites.push({
        id: `${name}${suffix}`,
        src: to.replace('public/', ''),
        width: px.width,
        height: px.height,
      });
    }
  }
}

// props.rendered и props.footprints — чистая производная от модели. Пишутся
// сюда целиком: держать их руками значит держать копию того, что уже посчитано.
const solid = new Set(balance.props.solid ?? []);
const rendered = {};
const footprints = {};
for (const meta of metrics) {
  if ((meta.kind ?? 'prop') !== 'prop') continue;
  const base = meta.size.value;
  rendered[meta.id] = {
    anchorX: round(meta.anchor.x, 5),
    anchorY: round(meta.anchor.y, 5),
    boxW: round(meta.box.width / base, 4),
    boxH: round(meta.box.height / base, 4),
  };
  // След пишется только тому, кто объявлен непроходимым (balance.props.solid).
  // Из модели этого не вывести: галька и телега одинаково стоят на земле, а
  // цеплять игрока должна только телега.
  if (solid.has(meta.id)) footprints[meta.id] = { rx: meta.footprint.rx, ry: meta.footprint.ry };
}
writeBlock('rendered', rendered);
writeBlock('footprints', footprints);

writeFileSync('art/sprites.generated.json', `${JSON.stringify(sprites, null, 2)}\n`);

const figures = metrics.filter((m) => m.kind === 'figure');
console.log(`перенесено ${sprites.length} файлов, ${(bytes / 1024 / 1024).toFixed(2)} МБ`);
console.log(`props.rendered: ${Object.keys(rendered).length}, footprints: ${Object.keys(footprints).length}`);
console.log(`фигур: ${figures.length}, таблица спрайтов: art/sprites.generated.json`);

function pixelsOf(meta, name) {
  if (meta.kind === 'figure') {
    const bone = meta.bones.find((b) => `${meta.id}-${b.id}` === name);
    return bone.pixels;
  }
  return meta.pixels;
}

/** Замена одного блока внутри props, с сохранением отступов и соседей. */
function writeBlock(key, value) {
  const text = readFileSync('balance.json', 'utf-8');
  const head = `  "${key}": {`;
  const start = text.indexOf(head);
  if (start < 0) throw new Error(`нет блока props.${key} в balance.json`);
  const end = text.indexOf('\n  },\n', start) + '\n  },\n'.length;
  const body = Object.entries(value)
    .map(([id, v]) => `   "${id}": ${JSON.stringify(v).replace(/,/g, ', ').replace(/:/g, ': ')}`)
    .join(',\n');
  writeFileSync('balance.json', `${text.slice(0, start)}${head}\n${body}\n  },\n${text.slice(end)}`);
}

function round(n, digits) {
  return Number(n.toFixed(digits));
}

/** Тот же набор и порядок значений, что в art/blender/lib/export.py. */
function opticsHash(props) {
  const fields = [
    `tilt=${props.cameraTiltDeg}`,
    `light=${props.lightX},${props.lightY},${props.lightZ}`,
    `shadow=${props.shadowColor},${props.shadowAlpha}`,
  ];
  for (const name of Object.keys(props.materials).sort()) {
    const tones = props.materials[name];
    if (Array.isArray(tones)) fields.push(`${name}=${tones.join(',')}`);
  }
  return createHash('sha1').update(fields.join('|')).digest('hex').slice(0, 12);
}
