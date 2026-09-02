// Дымовой запуск: гоняем РЕАЛЬНЫЙ собранный бандл под заглушками DOM.
// Ловит падения на старте модуля, которых не видят ни tsc, ни vitest —
// например обращение к let-переменной до её объявления.
// Запуск: npm run smoke
const calls = { fillRect: 0, arc: 0, fillText: 0, ellipse: 0 };
// measureText отдаёт объект, а не undefined: интерфейс меряет им ширину плашек
// по тексту, и заглушка-пустышка роняла бы кадр на первой же надписи.
// getTransform и createRadialGradient отдают объекты, а не undefined: по
// первому пропы узнают плотность пикселей для запекания, по второму рисуют
// контактное затемнение. Заглушка-пустышка роняла бы кадр на первом же пропе.
const ctx = new Proxy({}, {
  get: (_, k) => {
    if (k in calls) return () => { calls[k]++; };
    if (k === 'measureText') return () => ({ width: 10 });
    if (k === 'getTransform') return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
    if (k === 'createRadialGradient' || k === 'createLinearGradient') {
      return () => ({ addColorStop: () => {} });
    }
    return () => {};
  },
  set: () => true,
});
const listeners = [];
const canvas = {
  clientWidth: 390, clientHeight: 780, width: 0, height: 0,
  getContext: () => ctx,
  addEventListener: () => {}, setPointerCapture: () => {},
  getBoundingClientRect: () => ({ left: 0, top: 0 }),
  style: {},
};
let rafCb = null;
globalThis.document = {
  querySelector: (s) => (s === '#game' ? canvas : null),
  body: { style: {}, appendChild: () => {} },
  // Пропы запекаются в отдельный холст, поэтому createElement('canvas')
  // обязан отдавать нечто с getContext, а не голую заглушку.
  createElement: (tag) => (tag === 'canvas'
    ? { width: 0, height: 0, getContext: () => ctx, style: {} }
    : { style: {}, addEventListener: () => {}, append: () => {}, appendChild: () => {},
        relList: { supports: () => true } }),
  querySelectorAll: () => [],
  addEventListener: () => {},
  visibilityState: 'visible',
  head: { appendChild: () => {} },
  baseURI: 'http://localhost/',
};
globalThis.MutationObserver = class { observe() {} };
// Загрузчик текстур создаёт Image и ждёт onload/onerror. Без заглушки модуль
// падает на старте, и дымовой запуск перестаёт что-либо проверять.
globalThis.Image = class {
  set src(_value) { queueMicrotask(() => this.onerror?.()); }
};
globalThis.window = {
  devicePixelRatio: 3,
  addEventListener: (t, f) => listeners.push([t, f]),
  location: { search: '' },
  visualViewport: { addEventListener: (t, f) => listeners.push([t, f]) },
  AudioContext: undefined,
  localStorage: (() => {
    const data = new Map();
    return {
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => data.set(k, v),
      removeItem: (k) => data.delete(k),
    };
  })(),
};
Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
globalThis.requestAnimationFrame = (cb) => { rafCb = cb; return 1; };
globalThis.cancelAnimationFrame = () => {};
globalThis.performance = { now: () => 0 };

const bundle = (await import('node:fs')).readdirSync('dist/assets').find((f) => f.endsWith('.js'));
try {
  await import(`${process.cwd()}/dist/assets/${bundle}`);
} catch (e) {
  console.log('❌ МОДУЛЬ УПАЛ НА СТАРТЕ:', e.constructor.name + ':', e.message);
  process.exit(1);
}
if (!rafCb) { console.log('❌ игровой цикл не запустился'); process.exit(1); }
rafCb(16.7);                       // один кадр
console.log(`✓ модуль стартовал, цикл идёт`);
console.log(`  за кадр: fillRect ${calls.fillRect}, arc ${calls.arc}, fillText ${calls.fillText}`);
// ellipse — тень под ногами, ровно по одной на фигуру в кадре. Считаем именно
// её: круги (arc) рисует ещё и интерфейс, и по ним «врагов видно» не проверить.
// Мир выше экрана, поэтому в кадр попадает часть узлов — но не ноль.
if (calls.fillRect < 20 || calls.ellipse < 2) { console.log('❌ врагов на кадре не видно'); process.exit(1); }
console.log(`✓ фигуры отрисованы (${calls.ellipse} теней в кадре: игрок и узлы)`);

// имитируем скрытие адресной строки Safari
canvas.clientHeight = 900;
for (const [t, f] of listeners) if (t === 'resize') f();
calls.fillRect = 0; calls.ellipse = 0;
rafCb(33.4);
console.log(`  после изменения высоты окна: fillRect ${calls.fillRect}, теней ${calls.ellipse}`);
if (calls.ellipse < 2) { console.log('❌ после ресайза враги пропали'); process.exit(1); }
console.log('✓ после ресайза враги на месте');
