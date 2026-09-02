/**
 * Форматирование чисел и времени в стиле референса: «384K», «2.22M», «3h 6m».
 *
 * Полное число на плашке шириной в сорок единиц не помещается и превращается в
 * кашу, а точность в бою не нужна: игроку важен порядок величины, а не
 * последняя цифра HP.
 */
const UNITS: readonly { readonly at: number; readonly suffix: string }[] = [
  { at: 1e9, suffix: 'B' },
  { at: 1e6, suffix: 'M' },
  { at: 1e3, suffix: 'K' },
];

export function short(value: number): string {
  const abs = Math.abs(value);
  for (const unit of UNITS) {
    if (abs >= unit.at) return trim(value / unit.at) + unit.suffix;
  }
  return abs >= 10 ? String(Math.round(value)) : trim(value);
}

/** Три значащих цифры: «2.22M», «22.4K», «384K» — ровно как в референсе. */
function trim(value: number): string {
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  const fixed = value.toFixed(digits);
  // Нули срезаются только в дробной части: «20.0» без этой проверки
  // превращалось в «2».
  if (!fixed.includes('.')) return fixed;
  return fixed.replace(/0+$/, '').replace(/\.$/, '');
}

/** «3h 6m», «4m 0s», «12s». Ноль и отрицательное время — прочерк. */
export function duration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';
  const total = Math.ceil(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${rest}s`;
  return `${rest}s`;
}

/** Проценты для панели характеристик: «16.8%». */
export function percent(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}
