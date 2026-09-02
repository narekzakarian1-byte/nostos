// Собирает копию проекта, где дев-панель не вырезается, во временный каталог.
// Нужен, потому что в обычной сборке import.meta.env.DEV статически ложно
// и ветка с панелью до бандла не доезжает.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const OUT = '.devsmoke';
const SRC = '.devsmoke-src';
rmSync(OUT, { recursive: true, force: true });
rmSync(SRC, { recursive: true, force: true });
mkdirSync(SRC, { recursive: true });

// public обязателен: без него дев-сборка грузит игру без текстур, и фигуры на
// скриншотах выходят чёрными прямоугольниками-заглушками — проверять по таким
// снимкам внешний вид нельзя.
for (const entry of ['src', 'public', 'index.html', 'balance.json', 'vite.config.ts', 'tsconfig.json']) {
  cpSync(entry, `${SRC}/${entry}`, { recursive: true });
}
const main = `${SRC}/src/main.ts`;
writeFileSync(
  main,
  readFileSync(main, 'utf8').replace('import.meta.env.DEV && devRequested()', 'devRequested()'),
);

execFileSync('npx', ['vite', 'build', SRC, '--outDir', `${process.cwd()}/${OUT}`,
                     '--emptyOutDir', '--logLevel', 'error'], { stdio: 'inherit' });
rmSync(SRC, { recursive: true, force: true });
