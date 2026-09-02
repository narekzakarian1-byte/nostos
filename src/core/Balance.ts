import type { Balance } from './BalanceTypes.ts';
// Атрибут `with { type: 'json' }` обязателен: без него нативное исполнение TS в Node
// (npm run sim) откажется импортировать JSON. Vite и Vitest атрибут понимают.
import raw from '../../balance.json' with { type: 'json' };

/**
 * Заморозка вглубь: числа баланса не должны меняться в рантайме ни при каких условиях.
 * Молчаливая мутация конфига дала бы прогон, который невозможно воспроизвести по сиду.
 */
function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const key of Object.keys(value as object)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}

// Приведение через unknown: компилятор выводит из JSON расширенные типы (string вместо
// литеральных union'ов, number[] вместо кортежей). Соответствие формы проверяет
// tests/balance.test.ts — здесь компилятор помочь не может.
const balance: Balance = deepFreeze(raw as unknown as Balance);

/** Единственная точка доступа к числам проекта. Магических констант в коде быть не должно. */
export function getBalance(): Balance {
  return balance;
}
