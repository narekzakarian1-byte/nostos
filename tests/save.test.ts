import { describe, it, expect, beforeEach } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import { clearNodes, loadNodes, saveNodes } from '../src/save/Save.ts';

// Vitest гоняет тесты в node, localStorage там нет — подставляем минимальный.
class MemoryStorage {
  private data = new Map<string, string>();
  getItem(k: string): string | null { return this.data.get(k) ?? null; }
  setItem(k: string, v: string): void { this.data.set(k, v); }
  removeItem(k: string): void { this.data.delete(k); }
  raw(k: string, v: string): void { this.data.set(k, v); }
}

const store = new MemoryStorage();
Object.defineProperty(globalThis, 'window', {
  value: { localStorage: store },
  configurable: true,
  writable: true,
});

const SEED = 1337;
const VERSION = getBalance().save.schemaVersion;

beforeEach(() => clearNodes());

describe('Save — таймеры узлов переживают перезагрузку', () => {
  it('круговой рейс сохраняет индексы и время', () => {
    saveNodes(SEED, [{ i: 2, at: 1000 }, { i: 7, at: 2000 }]);
    expect(loadNodes(SEED)).toEqual([{ i: 2, at: 1000 }, { i: 7, at: 2000 }]);
  });

  it('пустого сохранения нет — возвращается null', () => {
    expect(loadNodes(SEED)).toBeNull();
  });

  it('чужой сид игнорируется: раскладка узлов другая, индексы бессмысленны', () => {
    saveNodes(SEED, [{ i: 1, at: 1000 }]);
    expect(loadNodes(SEED + 1)).toBeNull();
  });

  it('чужая версия схемы игнорируется', () => {
    store.raw('nostos.nodes', JSON.stringify({ v: VERSION + 1, seed: SEED, nodes: [{ i: 1, at: 5 }] }));
    expect(loadNodes(SEED)).toBeNull();
  });

  it('битый JSON не роняет игру', () => {
    store.raw('nostos.nodes', '{это не json');
    expect(loadNodes(SEED)).toBeNull();
  });

  it('мусорные записи отсеиваются', () => {
    store.raw('nostos.nodes', JSON.stringify({
      v: VERSION, seed: SEED, nodes: [{ i: 1, at: 5 }, { i: 'нет' }, null],
    }));
    expect(loadNodes(SEED)).toEqual([{ i: 1, at: 5 }]);
  });

  it('сохраняются только таймеры и ничего больше — Фаза 3 ещё не наступила', () => {
    saveNodes(SEED, [{ i: 0, at: 42 }]);
    const raw = store.getItem('nostos.nodes')!;
    expect(Object.keys(JSON.parse(raw)).sort()).toEqual(['nodes', 'seed', 'v']);
  });
});
