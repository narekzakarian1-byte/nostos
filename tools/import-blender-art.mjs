// Раскладка отрендеренного ассета в игру: `node tools/import-blender-art.mjs <id>`.
//
// Кладёт тело и тень в public/art/props и печатает строки, которые надо
// вписать в AssetManifest.ts и balance.json. Вписываются они руками намеренно:
// оба файла — исходники с комментариями, и автоправка их испортит.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const id = process.argv[2];
if (!id) {
  console.error('нужен id ассета: node tools/import-blender-art.mjs prop-ruin-gate');
  process.exit(1);
}

const meta = JSON.parse(readFileSync(join('art/metrics', `${id}.json`), 'utf-8'));
const balance = JSON.parse(readFileSync('balance.json', 'utf-8'));

// Оптика при рендере и оптика в игре обязаны совпадать. Иначе ассет тихо
// разъедется со всеми остальными — ровно та болезнь, от которой мы лечимся.
const hash = opticsHash(balance.props);
if (hash !== meta.balanceHash) {
  console.error(`оптика разошлась: в ассете ${meta.balanceHash}, в balance.json ${hash}`);
  console.error('перерендерить: node tools/blender.mjs <asset>');
  process.exit(1);
}

mkdirSync('public/art/props', { recursive: true });
const files = [];
for (const suffix of ['', '-shadow']) {
  const from = join('art/out', `${id}${suffix}.png`);
  if (!existsSync(from)) continue;
  const to = join('public/art/props', `${id}${suffix}.png`);
  copyFileSync(from, to);
  files.push([to, statSync(to).size]);
}
if (files.length === 0) {
  console.error(`нет рендера art/out/${id}.png — сначала node tools/blender.mjs`);
  process.exit(1);
}

const base = meta.size.value;
console.log('перенесено:');
for (const [path, size] of files) console.log(`  ${path}  ${(size / 1024).toFixed(0)} КБ`);

console.log('\nв src/ui/AssetManifest.ts:');
console.log(`  '${id}': { src: 'art/props/${id}.png', width: ${meta.pixels.width}, height: ${meta.pixels.height} },`);
console.log(`  '${id}-shadow': { src: 'art/props/${id}-shadow.png', width: ${meta.pixels.width}, height: ${meta.pixels.height} },`);

console.log('\nв balance.json → props.rendered:');
console.log(`  "${id}": { "anchorX": ${meta.anchor.x}, "anchorY": ${meta.anchor.y}, `
  + `"boxW": ${(meta.box.width / base).toFixed(4)}, "boxH": ${(meta.box.height / base).toFixed(4)} },`);

console.log('\nв balance.json → props.sizes и props.footprints:');
console.log(`  "${id}": { "fit": "${meta.size.fit}", "value": ${base} },`);
console.log(`  "${id}": { "rx": ${meta.footprint.rx}, "ry": ${meta.footprint.ry} },`);
console.log(`\nграней ${meta.tris}, плотность ${meta.pxPerUnit} px на единицу мира, сид ${meta.seed}`);

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
