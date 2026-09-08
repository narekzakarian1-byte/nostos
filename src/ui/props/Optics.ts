/**
 * Цвета и проекция мира — одни на весь остров.
 *
 * От модуля осталась ровно та часть, которой пользуется движок: разбор цветов
 * палитры и снос тени по свету. Геометрию пропов движок больше не считает —
 * все объекты приходят готовыми PNG из фабрики (ART_RUNBOOK.md), и заливка
 * граней вместе с моделями, формами и запеканием отсюда убрана.
 *
 * Числа при этом остались общими с фабрикой: `props.lightX/Y/Z` читает и она,
 * и `UiKit.groundShadow`, и снос тени под фигурой обязан совпасть со сносом на
 * отрендеренных тенях — иначе на одной поляне окажется два солнца.
 */
export type Tone = readonly [number, number, number];

export function rgb(hex: string): Tone {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
