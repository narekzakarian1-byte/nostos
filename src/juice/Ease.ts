/**
 * Кривые сглаживания. Чистые функции без единого числа из баланса: аргумент
 * всегда доля в [0, 1], а амплитуды и длительности приходят снаружи.
 *
 * Отдельным файлом, потому что ими пользуются и логика (BodyAnim), и рендер
 * (Figures), а тащить логику через ui/ нельзя.
 */

export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/** Резкий старт, мягкий конец. Отдача, вылет, любое затухание. */
export function easeOutCubic(t: number): number {
  const p = 1 - clamp01(t);
  return 1 - p * p * p;
}

/** Мягкий старт, резкий конец. Замах: сила копится к контакту. */
export function easeInQuad(t: number): number {
  const p = clamp01(t);
  return p * p;
}

/**
 * Выход с перелётом: значение проскакивает единицу и возвращается. Величина
 * перелёта — параметр, а не константа внутри: она живёт в balance.json
 * (anim.spawnOvershoot).
 */
export function easeOutBack(t: number, overshoot: number): number {
  const p = clamp01(t) - 1;
  return 1 + (overshoot + 1) * p * p * p + overshoot * p * p;
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
