// Запуск фабрики ассетов: `node tools/blender.mjs <ассет> [--seed N] [--px 6]`.
//
// Обёртка нужна ровно за тем, чтобы путь к Blender и порядок аргументов жили в
// одном месте: `--background --python … --` легко переставить местами, и тогда
// Blender молча открывает окно вместо рендера.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const BLENDER = '/Applications/Blender.app/Contents/MacOS/Blender';
const args = process.argv.slice(2);
const asset = args[0];

if (!asset) {
  console.error('нужно имя ассета: node tools/blender.mjs ruin_gate [--seed 1174]');
  process.exit(1);
}
if (!existsSync(BLENDER)) {
  console.error(`Blender не найден: ${BLENDER}`);
  process.exit(1);
}

const preview = args.includes('--preview');
const passthrough = args.filter((a) => a !== '--preview');

const build = spawnSync(
  BLENDER,
  ['--background', '--python', 'art/blender/build.py', '--', ...passthrough],
  { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf-8' },
);
report(build);
if (build.status !== 0) process.exit(build.status ?? 1);

if (preview) {
  const id = (build.stdout.match(/NOSTOS-ASSET (\S+)/) ?? [])[1];
  const shot = spawnSync(
    BLENDER,
    ['--background', '--python', 'art/blender/preview.py', '--', id],
    { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf-8' },
  );
  report(shot);
}

/** Blender сыплет в stdout сотни строк про сэмплы — оставляем только своё. */
function report({ stdout = '', stderr = '' }) {
  for (const line of stdout.split('\n')) {
    if (/^(NOSTOS|\s{2}\S)/.test(line) && !/^Fra:/.test(line)) console.log(line);
  }
  const errors = stderr.split('\n').filter((l) => /Error|Traceback|File "/.test(l));
  if (errors.length) console.error(errors.join('\n'));
}
