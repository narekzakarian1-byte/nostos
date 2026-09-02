// Прирост статов с убитых врагов. BALANCE.md §8.

/**
 * Затухание: 1 / (1 + x / k). Без него фарм самых слабых врагов на десятом
 * острове оказывается выгоднее боя с сильными, и игроки находят эксплойт за сутки.
 */
export function diminish(current: number, k: number): number {
  return 1 / (1 + current / k);
}

export function statGain(
  tierValue: number,
  gainRate: number,
  current: number,
  k: number,
): number {
  return tierValue * gainRate * diminish(current, k);
}
