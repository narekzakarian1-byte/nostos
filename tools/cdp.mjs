// Управление живой игрой из Node через Chrome DevTools Protocol.
//
// Зачем: посмотреть на игру глазами иначе нельзя — юнит-тесты не показывают,
// что остров выглядит пустым, а дорога упирается в стену. Здесь только
// транспорт и жесты; сценарии прогулки живут в tools/play.mjs.
//
// Headless-режим не годится: на macOS он не даёт окно уже ~500px, а нам нужен
// кадр в размерах телефона. Поэтому поднимается обычный Chrome с окном 520×900.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Свободный порт у системы. Своего фиксированного брать нельзя: если Chrome
 *  прошлого прогона ещё жив на том же порту, новый инстанс его не займёт, а
 *  /json/list отдаст ЕГО вкладки — кадры выйдут с чужой страницы. */
export function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

/**
 * Открывает адрес в окне телефона и возвращает сессию управления.
 * `screen` — виртуальные единицы игры: по ним жесты переводятся в пиксели.
 */
export async function open(url, screen) {
  const port = await freePort();
  const profile = mkdtempSync(join(tmpdir(), 'nostos-play-'));
  const chrome = spawn(CHROME, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--window-size=520,900',
    '--window-position=0,0',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-features=Translate,MediaRouter',
    url,
  ], { stdio: 'ignore' });

  const target = await findTab(port, url);
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = () => reject(new Error('NOSTOS: не удалось подключиться к вкладке'));
  });

  const pending = new Map();
  let nextId = 0;
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const resolve = pending.get(message.id);
    if (!resolve) return;
    pending.delete(message.id);
    resolve(message);
  };

  const send = (method, params = {}) => {
    const id = ++nextId;
    socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve) => pending.set(id, resolve));
  };

  await send('Page.enable');
  await send('Runtime.enable');

  const session = makeSession(send, screen);
  // Профиль сносится ПОСЛЕ выхода браузера: Chrome дописывает его ещё
  // несколько сотен миллисекунд после kill, и синхронный rm падает на ENOTEMPTY.
  session.close = async () => {
    socket.close();
    const exited = new Promise((resolve) => chrome.once('exit', resolve));
    chrome.kill();
    await Promise.race([exited, sleep(3000)]);
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  };
  await session.ready();
  return session;
}

/** Вкладка ищется по адресу, а не берётся первая типа `page`: у Chrome их
 *  несколько, и первой запросто окажется служебная. */
async function findTab(port, url) {
  const prefix = new URL(url).origin;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const tab = list.find((t) => t.type === 'page' && t.url.startsWith(prefix));
      if (tab) return tab;
    } catch {
      // Chrome ещё не поднял порт — это нормальные первые полсекунды.
    }
    await sleep(500);
  }
  throw new Error('NOSTOS: вкладка с игрой не нашлась за 30 секунд');
}

function makeSession(send, screen) {
  // Геометрия канваса в пикселях страницы. Пересчитывается каждым жестом:
  // окно может поехать, а промах по джойстику выглядит как «игра зависла».
  async function geometry() {
    const rect = await evaluate(`(() => {
      const el = document.querySelector('#game');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    })()`);
    if (!rect) throw new Error('NOSTOS: канвас #game не найден на странице');
    const scale = rect.width / screen.virtualWidth;
    return {
      ...rect,
      scale,
      // Кольцо джойстика стоит там же, где его рисует main.ts.
      anchorX: rect.left + rect.width / 2,
      anchorY: rect.top + rect.height - screen.joystickBottomMargin * scale,
    };
  }

  async function evaluate(expression) {
    const response = await send('Runtime.evaluate', { expression, returnByValue: true });
    const thrown = response.result?.exceptionDetails?.exception?.description;
    if (thrown) throw new Error(`NOSTOS: страница бросила исключение — ${thrown}`);
    return response.result?.result?.value;
  }

  async function pointer(type, x, y) {
    await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
  }

  /** Тап по игровому полю в виртуальных единицах экрана. */
  async function tap(x, y) {
    const g = await geometry();
    const px = g.left + x * g.scale;
    const py = g.top + y * g.scale;
    await pointer('mousePressed', px, py);
    await sleep(60);
    await pointer('mouseReleased', px, py);
    await sleep(200);
  }

  /**
   * Держать джойстик в направлении (dx, dy) заданное время. Ручка тянется
   * от неподвижного кольца, поэтому нажатие идёт в его центр, а увод —
   * за радиус: Input сам обрежет длину до максимума.
   */
  async function hold(dx, dy, ms) {
    const g = await geometry();
    const reach = screen.joystickMaxDrag * g.scale * 1.5;
    await pointer('mousePressed', g.anchorX, g.anchorY);
    await pointer('mouseMoved', g.anchorX + dx * reach, g.anchorY + dy * reach);
    await sleep(ms);
    await pointer('mouseReleased', g.anchorX + dx * reach, g.anchorY + dy * reach);
    await sleep(120);
  }

  /** Нажать кнопку дев-панели по точному тексту. Панель — обычный DOM. */
  async function dev(text) {
    const clicked = await evaluate(`(() => {
      const nodes = [...document.querySelectorAll('button, div')];
      const el = nodes.find((n) => n.textContent.trim() === ${JSON.stringify(text)});
      if (!el) return false;
      el.click();
      return true;
    })()`);
    if (!clicked) throw new Error(`NOSTOS: в дев-панели нет кнопки «${text}»`);
    await sleep(300);
    return true;
  }

  /** Кадр целиком, в PNG. */
  async function capture() {
    const response = await send('Page.captureScreenshot', { format: 'png' });
    if (!response.result) throw new Error('NOSTOS: Chrome не отдал кадр');
    return Buffer.from(response.result.data, 'base64');
  }

  /** Ждём загрузку текстур: до неё фигуры рисуются прямоугольниками. */
  async function ready() {
    for (let attempt = 0; attempt < 40; attempt++) {
      const ok = await evaluate(`!!document.querySelector('#game')`).catch(() => false);
      if (ok) break;
      await sleep(250);
    }
    await sleep(2500);
  }

  return { evaluate, tap, hold, dev, capture, geometry, ready, close: async () => {} };
}
