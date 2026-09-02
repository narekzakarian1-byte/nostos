import { getBalance } from './core/Balance.ts';
import { Game } from './core/Game.ts';
import { GameLoop } from './core/GameLoop.ts';
import { Input } from './core/Input.ts';
import { Renderer } from './ui/Renderer.ts';
import { sprites } from './ui/Sprites.ts';
import { handleTap } from './ui/Taps.ts';

// Технические константы рендера — единственное исключение из правила
// «все числа из balance.json» (CLAUDE.md §1).
// DPR ограничен двойкой: на телефонах он доходит до 3-4, а это в 9-16 раз больше
// пикселей на кадр. Для заливки цветом безразлично, для цифр урона и тряски — уже нет.
const MAX_PIXEL_RATIO = 2;

const canvasEl = document.querySelector<HTMLCanvasElement>('#game');
if (!canvasEl) throw new Error('NOSTOS: canvas #game не найден в index.html');

const context = canvasEl.getContext('2d');
if (!context) throw new Error('NOSTOS: браузер не отдал 2d-контекст');

const canvas: HTMLCanvasElement = canvasEl;
const ctx: CanvasRenderingContext2D = context;

const balance = getBalance();
const params = new URLSearchParams(window.location.search);

// Фон body тем же цветом: под безопасными зонами iPhone не должно проглядывать белое.
document.body.style.background = balance.palette.bgMid;

// Виртуальная ширина ОДНОГО экрана — от неё считается scale. Сам мир шире
// и выше экрана в worldScreensX/Y раз (см. balance.json.render._worldNote).
const screenWidth = balance.render.virtualWidth;
const worldWidth = screenWidth * balance.render.worldScreensX;
/** Высота видимой области в виртуальных единицах. Меняется вместе с окном. */
let viewHeight = screenWidth * 2;
let scale = 1;

// Объявлены до resize(): она трогает game, а обращение к let-переменной
// до её объявления бросает ReferenceError и роняет весь модуль на старте.
let game: Game | undefined;
let devPanel: { update(): void } | undefined;
let renderer: Renderer | undefined;

function resize(): void {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;

  canvas.width = Math.round(cssWidth * ratio);
  canvas.height = Math.round(cssHeight * ratio);

  scale = cssWidth / screenWidth;
  viewHeight = cssHeight / scale;
  ctx.setTransform(ratio * scale, 0, 0, ratio * scale, 0, 0);

  // Ширина мира не зависит от размера окна — меняется только видимая область.
  if (renderer) renderer.camera.viewHeight = viewHeight;
}

resize();

const input = new Input(
  canvas,
  (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    // Виртуальные экранные координаты, без сдвига камеры — джойстик и панели
    // живут в системе координат экрана, а не мира (см. Renderer.draw).
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  },
  (screenX, screenY) => {
    if (!game) return false;
    return handleTap(game, screenX, screenY, screenWidth, viewHeight, balance.weapons.slots.length);
  },
  () => ({ x: screenWidth / 2, y: viewHeight - balance.joystick.bottomMargin }),
);

const seed = Number(params.get('seed') ?? balance.rng.defaultSeed);
renderer = new Renderer(ctx, screenWidth, viewHeight);
const worldHeight = viewHeight * balance.render.worldScreensY;
const loop: GameLoop = new GameLoop(
  (dt) => game?.tick(dt),
  () => {
    if (game && renderer) renderer.draw(game);
    devPanel?.update();
  },
);
game = new Game(
  worldWidth, worldHeight, input,
  (ms) => loop.freeze(ms),
  seed,
  (scale, ms) => loop.slowmo(scale, ms),
);

input.onFirstGesture = () => game?.sound.unlock();

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);
// visualViewport ловит появление и скрытие адресной строки мобильного браузера.
window.visualViewport?.addEventListener('resize', resize);

// Таймеры узлов переживают закрытие вкладки. Сохраняем и на уходе со страницы,
// потому что pagehide на мобильных срабатывает надёжнее, чем unload.
window.addEventListener('pagehide', () => game?.spawns.persist());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') game?.spawns.persist();
});

/**
 * Панель включается через ?dev=1 (SPEC.md §3.5). Дополнительно принимаем #dev
 * и запоминаем выбор на сессию: Safari на айфоне подставляет из истории голый
 * адрес без query-строки, и панель молча пропадала при каждой перезагрузке.
 */
function devRequested(): boolean {
  if (params.has('dev') || window.location.hash === '#dev') {
    try {
      window.sessionStorage.setItem('nostos.dev', '1');
    } catch {
      // Приватный режим — просто живём без запоминания.
    }
    return true;
  }
  try {
    return window.sessionStorage.getItem('nostos.dev') === '1';
  } catch {
    return false;
  }
}

// import.meta.env.DEV статически ложно в продакшне, поэтому Rollup выбрасывает
// и ветку, и саму панель из сборки.
if (import.meta.env.DEV && devRequested()) {
  const { DevPanel } = await import('./debug/DevPanel.ts');
  devPanel = new DevPanel(game, loop);
}

// Ждём текстуры, а не блокируем ими первый кадр: до ответа Promise.all
// экран и так был бы пуст, а с ожиданием игрок не увидит мигание
// «прямоугольники → спрайты» на старте.
await sprites.load();

loop.start();
