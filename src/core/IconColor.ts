import { getBalance } from './Balance.ts';
import { attackRatio } from './Combat.ts';

/**
 * Цвет иконки типа урона: зелёная — пробиваю, серая — вязну, красная — не беру.
 *
 * Лежит в core, а не в ui, потому что этим цветом красятся не только три иконки
 * над врагом, но и всплеск искр на контакте (Game.playerAttack). Две копии
 * правила рано или поздно разъедутся, а расхождение иконки с реальным уроном
 * ломает единственный механизм принятия решений в игре (CLAUDE.md §6).
 *
 * Отношение считается той же attackRatio, что кормит формулу урона.
 */
export function iconColor(atk: number, def: number): string {
  const { icons, palette } = getBalance();
  const ratio = attackRatio(atk, def);
  if (ratio >= icons.greenAt) return palette.iconGreen;
  if (ratio <= icons.redAt) return palette.iconRed;
  return palette.iconGrey;
}
