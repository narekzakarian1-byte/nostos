// Очередь генерации арта в Draw Things: `node tools/generate.mjs <набор>`.
//
// Локальный API на 127.0.0.1:7860 держит строго последовательную очередь, и
// одна картинка идёт минуты. Поэтому скрипт запускается фоном и пишет
// результат по одному файлу — прервать его можно в любой момент, готовое
// останется.
//
// Преамбулы — из ISLANDS.md §1.4, один в один: камера 55°, свет справа, тени
// нет, хромакейный фон, замкнутая обводка #080D14. Их соблюдение и есть
// причина, по которой сгенерированный проп встаёт рядом с уже готовыми и не
// разъезжается с ними по свету.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { JOBS } from './art-jobs.mjs';

const API = 'http://127.0.0.1:7860';
const OUT = 'islands/uploads/ismaros';

const PROP_PREAMBLE = `Top-down mobile game prop, single isolated object.
CAMERA: fixed 55-degree top-down three-quarter view, as in a mobile action RPG. The viewer looks DOWN at the object from above and slightly in front; top faces are clearly visible. Orthographic projection, no lens perspective, no vanishing point, no wide-angle distortion, no eye-level view.
LIGHT: exactly one hard light source from the RIGHT and slightly toward the viewer. Lit faces point right and down-screen, shaded faces point left and up-screen. Consistent across every surface.
NO SHADOW: do not draw any shadow on the ground. No drop shadow, no contact shadow, no cast shadow, no dark ellipse, no blur under the object. Nothing beneath it at all. Shading ON the object itself is fine.
NO GROUND UNDER IT: the object must not stand on sand, soil, pebbles, gravel, grass, a stone slab, a dirt patch or any other ground. There is no ground in this image at all. Nothing whatsoever below or around the object except the flat green background — its base meets the green directly.
BACKGROUND: completely flat uniform pure chroma green #00FF00, edge to edge. No gradient, no texture, no ground, no grass, no horizon, no scenery. Absolutely no green of any kind anywhere on the object itself.
OUTLINE: a clean, closed, continuous near-black outline #080D14, 6-8 px thick, tracing the entire outer silhouette where it meets the background, including inner openings. No fuzzy edges, no glow, no feathering.
STYLE: flat stylized vector illustration, bold clean shapes, hard-edged flat color fills, 3-4 tones per material (light / mid / dark). No gradients, no airbrush, no photorealism, no 3D render, no ambient occlusion, no specular highlights, no noise texture.
FRAMING: object centered horizontally, filling ~90% of the frame. Its base sits exactly on the bottom edge of the image, no empty margin below the base. No text, no watermark, no logo, no UI, no border frame.
NEGATIVE: ground patch, sand, soil, dirt, pebbles, gravel, grass, base plate, pedestal, drop shadow, cast shadow, scenery, horizon, photorealism, 3d render, text, watermark.`;

const CHAR_PREAMBLE = `Top-down mobile game character sprite, single figure, centered.
CAMERA: fixed 55-degree top-down three-quarter view. The viewer looks DOWN at the figure from above and slightly in front. Orthographic projection, no lens perspective, no eye-level view.
LIGHT: exactly one hard light source from the RIGHT and slightly toward the viewer.
NO SHADOW: no drop shadow, no contact shadow, no dark ellipse under the figure. Nothing beneath it at all.
BACKGROUND: completely flat uniform pure chroma green #00FF00, edge to edge. No gradient, no texture, no ground, no scenery. Absolutely no green anywhere on the figure itself.
OUTLINE: a clean, closed, continuous near-black outline #080D14, 6-8 px thick around the entire silhouette.
STYLE: flat stylized vector illustration, bold clean shapes, hard-edged flat fills, no more than 6 colors total. The silhouette must stay recognizable when filled with solid black.
No text, no watermark, no logo, no UI, no border frame.
NEGATIVE: ground patch, sand, soil, dirt, pebbles, gravel, grass, base plate, pedestal, drop shadow, cast shadow, scenery, horizon, photorealism, 3d render, text, watermark.`;

const PREAMBLES = { prop: PROP_PREAMBLE, char: CHAR_PREAMBLE };

const setName = process.argv[2] ?? 'all';
const jobs = setName === 'all' ? JOBS : JOBS.filter((j) => j.set === setName);
if (jobs.length === 0) {
  console.error(`нет заданий в наборе «${setName}»`);
  process.exit(1);
}

console.log(`заданий: ${jobs.length}`);
for (const job of jobs) {
  const dir = join(OUT, job.category);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${job.name}.png`);
  if (existsSync(file)) {
    console.log(`уже есть, пропускаю: ${file}`);
    continue;
  }

  const prompt = `${PREAMBLES[job.preamble]}\nTASK: ${job.prompt}`;
  const started = Date.now();
  console.log(`генерирую ${job.name} (${job.width}×${job.height})…`);

  try {
    const response = await fetch(`${API}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        // Flux 2 Klein — дистиллированная модель: cfg_scale строго 1,
        // иначе картинка выгорает.
        cfg_scale: 1,
        steps: job.steps ?? 8,
        width: job.width,
        height: job.height,
        seed: job.seed ?? 1,
        batch_size: 1,
      }),
    });
    if (!response.ok) {
      console.log(`  ✗ ${response.status}: ${(await response.text()).slice(0, 200)}`);
      continue;
    }
    const data = await response.json();
    const image = data.images?.[0];
    if (!image) {
      console.log('  ✗ ответ без картинки');
      continue;
    }
    writeFileSync(file, Buffer.from(image, 'base64'));
    console.log(`  ✓ ${file} за ${Math.round((Date.now() - started) / 1000)} с`);
  } catch (error) {
    console.log(`  ✗ ${error.message}`);
  }
}
console.log('очередь пройдена');
