import type { Game } from '../core/Game.ts';
import { hudButtonAt } from './Hud.ts';
import { isMinimapTap } from './Minimap.ts';
import { statsTap } from './StatsScreen.ts';
import { slotAt } from './WeaponBar.ts';

/**
 * Единая маршрутизация тапов по интерфейсу. Вернуть true — касание съедено
 * интерфейсом и джойстик не активируется: иначе апгрейд оружия или открытие
 * карты заодно дёргали бы персонажа.
 *
 * Порядок проверок = порядок слоёв на экране, сверху вниз. Оверлеи идут
 * первыми и забирают весь экран целиком.
 */
export function handleTap(
  game: Game,
  x: number,
  y: number,
  screenWidth: number,
  viewHeight: number,
  slotCount: number,
): boolean {
  // Экран гейта закрывается любым касанием: после смерти от босса на нём
  // нечего нажимать, а держать его дольше одного взгляда незачем.
  if (game.bossScreen) {
    game.bossScreen = null;
    return true;
  }

  if (game.statsOpen) {
    const hit = statsTap(x, y, screenWidth, viewHeight);
    if (hit === 'close') game.statsOpen = false;
    else if (typeof hit === 'number') game.tryUpgrade(hit);
    // Тап мимо карточек не закрывает экран: промах по кнопке «улучшить»
    // выбрасывал бы из инвентаря на ровном месте.
    return true;
  }

  // Карта открыта — любой тап её закрывает и ни на что больше не влияет.
  if (game.mapOpen) {
    game.mapOpen = false;
    return true;
  }

  const button = hudButtonAt(x, y, screenWidth, viewHeight);
  if (button === 'settings') {
    game.toggleSound();
    return true;
  }
  if (button === 'bag') {
    game.statsOpen = true;
    return true;
  }
  if (button === 'shop') return true;

  if (isMinimapTap(x, y, screenWidth)) {
    game.mapOpen = true;
    return true;
  }

  const slot = slotAt(x, y, screenWidth, viewHeight, slotCount);
  if (slot !== null) {
    // Слот внизу экрана надевает оружие, а не улучшает его. Улучшение живёт на
    // экране характеристик: в бою по слоту тапают, чтобы переодеться под три
    // иконки над врагом, и случайно потратить на этом копии нельзя.
    game.equipSlot(slot);
    return true;
  }

  return false;
}
