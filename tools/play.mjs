// Прогулка по живой игре со съёмкой кадров: `npm run play -- <сценарий>`.
//
// Сценарии — tools/scenarios.mjs. Здесь только обвязка: собрать дев-ветку,
// поднять статику, открыть окно телефона, разложить кадры по каталогу.
//
// Сборка нужна отдельная, потому что в обычной дев-панели нет (main.ts режет
// её по import.meta.env.DEV), а без панели не добраться ни до босса, ни до
// сброса респауна.
import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import balance from '../balance.json' with { type: 'json' };
import { open, freePort, sleep } from './cdp.mjs';
import { SCENARIOS } from './scenarios.mjs';

const BUILD_DIR = '.devsmoke';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const positional = args.filter((a) => !a.startsWith('--'));
const name = positional[0] ?? 'tour';
const seedArg = valueOf('--seed');
const outDir = valueOf('--out') ?? 'shots';

function valueOf(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

const scenario = SCENARIOS[name];
if (!scenario) {
  console.error(`Нет сценария «${name}». Есть: ${Object.keys(SCENARIOS).join(', ')}`);
  process.exit(1);
}

// Сид по умолчанию новый на каждый прогон: сохранение узлов привязано к сиду,
// и на старом прогоне босс окажется уже убитым с прошлого раза.
const seed = seedArg ?? String(Date.now() % 1000000);

if (!flags.has('--no-build') || !existsSync(BUILD_DIR)) {
  console.log('собираю дев-сборку…');
  execFileSync('node', ['tests/build-dev.mjs'], { stdio: 'inherit' });
}

const port = await freePort();
const server = spawn('npx', [
  'vite', 'preview', '--outDir', BUILD_DIR,
  '--port', String(port), '--strictPort', '--logLevel', 'error',
], { stdio: 'ignore' });

const url = `http://localhost:${port}/?dev=1&seed=${seed}`;
await waitForServer(url);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

let index = 0;
let session;
try {
  session = await open(url, {
    virtualWidth: balance.render.virtualWidth,
    joystickBottomMargin: balance.joystick.bottomMargin,
    joystickMaxDrag: balance.joystick.maxDragRadius,
  });

  const shot = async (label) => {
    const file = join(outDir, `${String(++index).padStart(2, '0')}-${label}.png`);
    writeFileSync(file, await session.capture());
    console.log(`  ${file}`);
  };

  console.log(`сценарий «${name}», сид ${seed}`);
  await scenario(session, shot);
  console.log(`готово: ${index} кадров в ${outDir}/`);
} finally {
  await session?.close();
  server.kill();
}

async function waitForServer(address) {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch(address, { method: 'HEAD' });
      if (response.ok) return;
    } catch {
      // Vite ещё поднимается.
    }
    await sleep(250);
  }
  throw new Error('NOSTOS: статика не поднялась');
}
