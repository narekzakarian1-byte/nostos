// Дымовой запуск ДЕВ-ветки: собирает копию проекта без условия import.meta.env.DEV
// и проверяет, что дев-панель реально создаётся и не падает в конструкторе.
// Обычный smoke этого не видит — в продакшн-сборке панели нет по определению.
// Запуск: npm run smoke:dev
const appended = [];
const mk = (tag) => ({
  tagName: tag, style: {}, children: [], width: 0, height: 0,
  appendChild(c) { this.children.push(c); return c; },
  append(...c) { this.children.push(...c); },
  // Пропы запекаются в отдельный холст — без getContext кадр падает на первом же.
  getContext: () => ctx,
  addEventListener() {}, set textContent(v) { this._t = v; }, get textContent() { return this._t; },
});
// measureText отдаёт объект: интерфейс меряет им ширину плашек по тексту.
const ctx = new Proxy({}, {
  get: (_, k) => {
    if (k === 'measureText') return () => ({ width: 10 });
    if (k === 'getTransform') return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
    if (k === 'createRadialGradient' || k === 'createLinearGradient') {
      return () => ({ addColorStop: () => {} });
    }
    return () => {};
  },
  set: () => true,
});
const canvas = { clientWidth: 393, clientHeight: 780, width: 0, height: 0,
  getContext: () => ctx, addEventListener: () => {}, setPointerCapture: () => {},
  getBoundingClientRect: () => ({ left: 0, top: 0 }), style: {} };
let rafCb = null;
globalThis.document = {
  querySelector: (s) => (s === '#game' ? canvas : null),
  querySelectorAll: () => [], addEventListener: () => {}, visibilityState: 'visible',
  getElementsByTagName: () => [{ rel: '', as: '', href: '', crossOrigin: '',
                                 setAttribute() {}, relList: { supports: () => true } }],
  head: { appendChild: () => {} }, baseURI: 'http://localhost/',
  createElement: mk,
  body: { style: {}, appendChild: (c) => appended.push(c), append: (...c) => appended.push(...c) },
};
globalThis.window = { devicePixelRatio: 3, addEventListener: () => {},
  location: { search: '?dev=1' }, visualViewport: { addEventListener: () => {} },
  AudioContext: undefined,
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
globalThis.requestAnimationFrame = (cb) => { rafCb = cb; return 1; };
globalThis.cancelAnimationFrame = () => {};
globalThis.performance = { now: () => 0 };
globalThis.MutationObserver = class { observe() {} };
// Загрузчик текстур создаёт Image и ждёт onload/onerror.
globalThis.Image = class {
  set src(_value) { queueMicrotask(() => this.onerror?.()); }
};

process.on('unhandledRejection', (e) => {
  console.log('❌ НЕОБРАБОТАННОЕ ОТКЛОНЕНИЕ:', e?.constructor?.name + ':', e?.message);
  process.exit(1);
});
const dir = process.argv[2];
const fs = await import('node:fs');
// Точка входа берётся из index.html, иначе можно случайно импортировать чанк панели.
const html = fs.readFileSync(`${dir}/index.html`, 'utf8');
const file = html.match(/src="[^"]*assets\/([^"]+\.js)"/)[1];
console.log('точка входа:', file);
try { await import(`${process.cwd()}/${dir}/assets/${file}`); }
catch (e) { console.log('❌ модуль упал:', e.constructor.name + ':', e.message); process.exit(1); }
// Динамический импорт панели — микрозадача, ждём её.
await new Promise((r) => setTimeout(r, 50));
console.log(`элементов добавлено в body: ${appended.length}`);
for (const el of appended) console.log(`  <${el.tagName}> "${el.textContent ?? ''}"`);
if (!appended.some((e) => e.textContent === 'dev')) { console.log('❌ кнопки dev нет'); process.exit(1); }
console.log('✓ кнопка dev создана');
