import { getBalance } from '../core/Balance.ts';

/**
 * В Фазе 1 сохраняются ТОЛЬКО таймеры узлов — ни статы, ни копии, ни оружие.
 * Это осознанное ограничение: CLAUDE.md откладывает полное сохранение до Фазы 3,
 * а персистентность узлов SPEC требует уже здесь.
 *
 * Схема версионирована с самого начала: чужая версия просто игнорируется,
 * и игрок получает свежий остров вместо разъехавшегося состояния.
 */
export interface NodeSave {
  /** Индекс узла в массиве спавна. Позиции детерминированы сидом. */
  readonly i: number;
  /** Абсолютное время воскрешения, Date.now() + осталось. */
  readonly at: number;
}

export interface SaveData {
  readonly v: number;
  readonly seed: number;
  readonly nodes: readonly NodeSave[];
}

const KEY = 'nostos.nodes';

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    // Приватный режим Safari умеет бросать прямо на обращении к localStorage.
    return null;
  }
}

export function saveNodes(seed: number, nodes: readonly NodeSave[]): void {
  const store = storage();
  if (!store) return;
  const data: SaveData = { v: getBalance().save.schemaVersion, seed, nodes };
  try {
    store.setItem(KEY, JSON.stringify(data));
  } catch {
    // Переполнение или запрет записи — молча живём без сохранения.
  }
}

/** Вернёт null, если сохранения нет, версия чужая или сид другой. */
export function loadNodes(seed: number): NodeSave[] | null {
  const store = storage();
  if (!store) return null;

  const raw = store.getItem(KEY);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw) as Partial<SaveData>;
    if (data.v !== getBalance().save.schemaVersion) return null;
    // Другой сид — другая раскладка узлов, индексы больше ничего не значат.
    if (data.seed !== seed) return null;
    if (!Array.isArray(data.nodes)) return null;
    return data.nodes.filter(
      (n): n is NodeSave => typeof n?.i === 'number' && typeof n?.at === 'number',
    );
  } catch {
    return null;
  }
}

export function clearNodes(): void {
  storage()?.removeItem(KEY);
}
