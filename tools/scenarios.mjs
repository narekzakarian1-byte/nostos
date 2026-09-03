// Сценарии прогулки. Каждый получает сессию (tools/cdp.mjs) и функцию кадра.
//
// Разделены не по прихоти: «остров целиком» и «бой с боссом» проверяют разное
// и снимаются по-разному. Обход нужен, чтобы увидеть раскладку и зоны; бой —
// чтобы увидеть анимацию, а для неё камера обязана стоять на месте, иначе в
// кадр попадает только ходьба.
import balance from '../balance.json' with { type: 'json' };
import { sleep } from './cdp.mjs';

/** Один кадр точки высадки. */
async function start(session, shot) {
  await shot('start');
}

/**
 * Остров снизу вверх. Игрок высаживается внизу, босс наверху (GDD §6),
 * поэтому проход вверх — это и есть чтение острова по его главной оси.
 */
async function tour(session, shot) {
  await shot('landing');
  for (let leg = 1; leg <= 6; leg++) {
    await session.hold(0, -1, 2600);
    await shot(`road-${leg}`);
  }
  await fullMap(session, shot);
}

/** Полная карта поверх игры: открывается тапом по миникарте (ui/Taps.ts). */
async function fullMap(session, shot) {
  const minimap = minimapCenter();
  // Сначала тап по пустому полю: экран прогресса по боссу съедает первый тап
  // целиком (ui/Taps.ts), и карта после смерти от босса молча не открывалась —
  // в кадр попадала игра. По полю тап безвреден: джойстик без увода даёт ноль.
  await session.tap(balance.render.virtualWidth / 2, EMPTY_FIELD_Y);
  await session.tap(minimap.x, minimap.y);
  await shot('map');
  // Карту гасит любой тап — снимаем её и возвращаемся в игру.
  await session.tap(minimap.x, minimap.y);
}

/**
 * Бой с боссом. Телепорт ставит игрока внутрь радиуса сцепки, поэтому бой
 * начинается сам и джойстик не нужен: босс стоит на месте, камера замирает,
 * и в кадре остаётся чистая анимация удара.
 *
 * HP×100 обязателен: без него игрок умирает раньше, чем наберётся серия.
 */
async function boss(session, shot) {
  await session.dev('dev');
  await session.dev('HP ×100');
  await session.dev('поднять босса');
  await session.dev('к боссу');
  await sleep(600);
  // Период удара — секунда, кадры идут чаще: замах и проводка попадают в разные.
  for (let frame = 1; frame <= 10; frame++) {
    await shot(`swing-${frame}`);
    await sleep(140);
  }
}

/** Один кадр полной карты, без прогулки. */
async function map(session, shot) {
  await fullMap(session, shot);
}

/** Точка пустого поля: ниже миникарты и HUD, выше кольца джойстика. */
const EMPTY_FIELD_Y = 200;

/** Центр миникарты в виртуальных единицах экрана. Формула повторяет
 *  ui/Minimap.ts center(): числа берутся из конфига, а не вбиваются сюда. */
function minimapCenter() {
  const { minimap, render } = balance;
  return {
    x: render.virtualWidth - minimap.margin - minimap.screenRadius,
    y: minimap.margin + minimap.screenRadius,
  };
}

/**
 * Походка. Серия кадров, снятых, пока джойстик прижат: только так видно, с
 * какой частотой переставляются ноги. Шаг у Одиссея ≈ 2.8 в секунду, кадры
 * идут чаще — в разные кадры попадают разные фазы одного шага.
 */
async function walk(session, shot) {
  await session.hold(0, -1, 0, async () => {
    for (let frame = 1; frame <= 10; frame++) {
      await shot(`walk-${frame}`);
      await sleep(110);
    }
  });
  await shot('walk-stop');
}

export const SCENARIOS = { start, tour, boss, map, walk };
