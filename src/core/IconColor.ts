import { getBalance } from './Balance.ts';
import { attackRatio } from './Combat.ts';
import type { IconStep } from './BalanceTypes.ts';

/**
 * Ступень опасности по отношению атака/защита: рву — уверенно — поровну —
 * вязну — тяжело — безнадёжно.
 *
 * Лежит в core, а не в ui, потому что этой шкалой красятся не только три иконки
 * над врагом, но и всплеск искр на контакте (juice/Impact.ts) и дуга удара
 * (ui/SlashArc.ts). Две копии правила рано или поздно разъедутся, а расхождение
 * иконки с реальным уроном ломает единственный механизм принятия решений в игре
 * (CLAUDE.md §6).
 *
 * Отношение считается той же attackRatio, что кормит формулу урона.
 *
 * Ступеней шесть, а не три, и шаг между ними неравномерный: возле паритета он
 * вчетверо мельче, чем на краях. Три равномерные ступени оставляли всю зону
 * решения — от «чуть не хватает» до «уже хватает» — одним серым цветом, то есть
 * ровно там, где игрок выбирает, шкала молчала. Разбор референса показывает тот
 * же приём с обратной стороны: у них между 0.95 и 1.0 стоит отдельный цвет
 * (BUTCHER.md §4).
 */
export function iconStep(atk: number, def: number): IconStep {
  const { scale } = getBalance().icons;
  const ratio = attackRatio(atk, def);
  for (const step of scale) {
    if (ratio >= step.at) return step;
  }
  // Недостижимо при корректном конфиге: последняя ступень имеет at = 0, а
  // attackRatio неотрицательна. Проверку формы держит tests/balance.test.ts.
  return scale[scale.length - 1]!;
}

export function iconColor(atk: number, def: number): string {
  const { palette } = getBalance();
  return palette[iconStep(atk, def).color];
}
