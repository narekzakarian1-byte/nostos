import { describe, it, expect } from 'vitest';
import { getBalance } from '../src/core/Balance.ts';
import type { StatKey } from '../src/core/BalanceTypes.ts';

// Balance.ts приводит JSON через `as unknown as Balance`, и компилятор это приведение
// проверить не может: типы могут разойтись с конфигом сколько угодно и молча врать.
// Этот файл — единственное место, где соответствие формы реально проверяется.

const balance = getBalance();

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
const TIERS = ['normal', 'elite', 'miniboss', 'boss'] as const;
const DAMAGE_TYPES = ['pierce', 'slash', 'crush'] as const;
const ARCHETYPES = ['fast', 'armored', 'heavy', 'striker'] as const;
const PALETTE_KEYS = [
  'bgFar', 'bgMid', 'silhouette', 'accentWarm', 'accentLight',
  'danger', 'iconGreenBright', 'iconGreen', 'iconGrey', 'iconAmber', 'iconRed',
  'iconRedDark', 'roadDirt', 'borderStone',
  'roadEdge', 'roadStoneLight', 'roadStoneDark', 'grassTuft',
  'seaDeep', 'sea', 'seaShallow', 'foam', 'shore', 'grassTuftDry',
] as const;

describe('balance.json — форма конфига', () => {
  it('числа боя на месте и конечны', () => {
    const { typeExponent, damageFloor, damageCeil, baseAttackSpeed } = balance.combat;
    for (const value of [typeExponent, damageFloor, damageCeil, baseAttackSpeed]) {
      expect(Number.isFinite(value)).toBe(true);
    }
    expect(damageFloor).toBeLessThan(damageCeil);
  });

  it('шкала иконок: убывает, замыкается нулём и красится существующими цветами', () => {
    const { scale } = balance.icons;
    expect(scale.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < scale.length; i++) {
      expect(scale[i]!.at).toBeLessThan(scale[i - 1]!.at);
    }
    // Без замыкающего нуля отношение ниже последней ступени осталось бы без
    // цвета, а иконка — единственный механизм принятия решений в игре.
    expect(scale[scale.length - 1]!.at).toBe(0);
    for (const step of scale) {
      expect(balance.palette[step.color]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(step.name.length).toBeGreaterThan(0);
    }
  });

  it('разрешение шкалы сгущается у паритета', () => {
    // Смысл шкалы: возле отношения 1.0 шаг мельче, чем на краях. Если правка
    // конфига это нарушит, зона решения снова схлопнется в один цвет.
    const { scale } = balance.icons;
    const near = scale.filter((s) => s.at > 0.6 && s.at < 1.6);
    expect(near.length).toBeGreaterThanOrEqual(3);
  });

  it('в rarityMult ровно пять редкостей и множители растут', () => {
    expect(Object.keys(balance.weapons.rarityMult).sort()).toEqual([...RARITIES].sort());
    const mults = RARITIES.map((r) => balance.weapons.rarityMult[r]);
    for (let i = 1; i < mults.length; i++) {
      expect(mults[i]).toBeGreaterThan(mults[i - 1]!);
    }
  });

  it('слоты оружия — три типа урона', () => {
    expect([...balance.weapons.slots].sort()).toEqual([...DAMAGE_TYPES].sort());
  });

  it('островов ровно 13, номера подряд, id уникальны, слабость валидна', () => {
    const list = balance.islands.list;
    expect(list).toHaveLength(13);
    list.forEach((island, index) => {
      expect(island.n).toBe(index + 1);
      expect([...DAMAGE_TYPES, 'any']).toContain(island.bossWeakness);
    });
    expect(new Set(list.map((i) => i.id)).size).toBe(list.length);
  });

  it('dropTable покрывает все архетипы и ссылается на существующие статы', () => {
    expect(Object.keys(balance.growth.dropTable).sort()).toEqual([...ARCHETYPES].sort());
    const statKeys = Object.keys(balance.player.baseStats) as StatKey[];
    for (const archetype of ARCHETYPES) {
      const stats = balance.growth.dropTable[archetype];
      expect(stats.length).toBeGreaterThan(0);
      for (const stat of stats) {
        expect(statKeys).toContain(stat);
      }
    }
  });

  it('реген описан для игрока и всех небоссовых тиров', () => {
    for (const actor of ['player', 'normal', 'elite', 'miniboss'] as const) {
      expect(balance.regen[actor].outOfCombatDelay).toBeGreaterThan(0);
      expect(balance.regen[actor].rate).toBeGreaterThan(0);
    }
    // Реген врага выше регена игрока — намеренно, см. GDD §4.4.
    expect(balance.regen.normal.rate).toBeGreaterThan(balance.regen.player.rate);
    expect(Number.isFinite(balance.regen.bossCombatRegen)).toBe(true);
  });

  it('enemyTiers покрывает четыре тира, respawnSec — корректный диапазон', () => {
    expect(Object.keys(balance.enemyTiers).sort()).toEqual([...TIERS].sort());
    for (const tier of TIERS) {
      const { respawnSec } = balance.enemyTiers[tier];
      expect(respawnSec).toHaveLength(2);
      expect(respawnSec[0]).toBeLessThanOrEqual(respawnSec[1]);
    }
  });

  it('activeProfile существует среди профилей копий', () => {
    expect(Object.keys(balance.copies.profiles)).toContain(balance.activeProfile);
    expect(Object.keys(balance.copies.drops).sort()).toEqual(['elite', 'miniboss', 'normal']);
  });

  it('броня — зеркало оружия по форме', () => {
    expect(Object.keys(balance.armor.rarityMult).sort()).toEqual([...RARITIES].sort());
    const mults = RARITIES.map((r) => balance.armor.rarityMult[r]);
    for (let i = 1; i < mults.length; i++) {
      expect(mults[i]).toBeGreaterThan(mults[i - 1]!);
    }
    expect([...balance.armor.slots].sort()).toEqual([...DAMAGE_TYPES].sort());
    expect(balance.armor.levelStep).toBeGreaterThan(0);
    expect(Object.keys(balance.armor.rarityUnlockIsland).sort()).toEqual([...RARITIES].sort());
  });

  it('осколки брони — своя валюта той же формы, что копии', () => {
    expect(Object.keys(balance.armorShards.profiles)).toContain(balance.activeProfile);
    expect(Object.keys(balance.armorShards.drops).sort()).toEqual(['elite', 'miniboss', 'normal']);
  });

  it('наследование уровня включено и у брони — правило одно на всё снаряжение', () => {
    expect(balance.armor.inheritLevelOnRarityUp).toBe(true);
  });

  it('палитра полная и все цвета — валидный hex', () => {
    expect(Object.keys(balance.palette).sort()).toEqual([...PALETTE_KEYS].sort());
    for (const key of PALETTE_KEYS) {
      expect(balance.palette[key]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('inheritLevelOnRarityUp включён — без него лучший дроп делает игрока слабее', () => {
    expect(balance.weapons.inheritLevelOnRarityUp).toBe(true);
  });

  it('шаг тика положительный, а потолок шагов переживает ускорение 100x', () => {
    expect(balance.loop.tickHz).toBeGreaterThan(0);
    const maxTimeScale = Math.max(...balance.devPanel.timeScales);
    // Кадру при ускорении нужно maxTimeScale тиков — потолок обязан быть выше.
    expect(balance.loop.maxStepsPerFrame).toBeGreaterThanOrEqual(maxTimeScale);
    expect(balance.devPanel.timeScales).toContain(1);
  });

  it('числа рендера и звука положительны', () => {
    for (const value of Object.values(balance.render)) {
      if (typeof value === 'number') expect(value).toBeGreaterThan(0);
    }
    for (const value of Object.values(balance.audio)) {
      expect(value).toBeGreaterThan(0);
    }
    expect(Number.isFinite(balance.rng.defaultSeed)).toBe(true);
  });

  it('анимация: все длительности и амплитуды положительны', () => {
    for (const [key, value] of Object.entries(balance.anim)) {
      if (typeof value === 'number') expect(value, key).toBeGreaterThan(0);
    }
  });

  it('замах и проводка укладываются в период удара', () => {
    // Иначе окна замаха и проводки перекрываются, и фигура на контакте
    // одновременно отклоняется назад и выпадает вперёд.
    const period = 1 / balance.combat.baseAttackSpeed;
    for (const type of ['pierce', 'slash', 'crush'] as const) {
      expect(balance.anim.strokes[type].windupSec + balance.anim.strikeSec).toBeLessThan(period);
    }
    expect(balance.anim.enemyWindupSec + balance.anim.strikeSec).toBeLessThan(period);
    // Вспышка не должна пережить сам удар: подсветка длиннее размена читается
    // как состояние врага, а не как попадание.
    expect(balance.anim.hitFlashSec).toBeLessThan(period);
  });

  it('вибрация описана для каждого события из hapticsOn', () => {
    for (const event of balance.juice.hapticsOn) {
      expect(balance.juice.hapticsMs[event]).toBeGreaterThan(0);
    }
    expect(balance.juice.screenshakeCrit).toBeGreaterThan(balance.juice.screenshakeBase);
    expect(balance.juice.hitstopCritMs).toBeGreaterThan(balance.juice.hitstopMs);
  });

  it('состав острова и размеры тиров заданы', () => {
    const { islands, render } = balance;
    for (const count of [islands.normalsPerIsland, islands.elitesPerIsland, islands.minibossesPerIsland]) {
      expect(count).toBeGreaterThan(0);
    }
    expect(render.enemySizeByTier.boss).toBeGreaterThan(render.enemySizeByTier.miniboss);
    expect(render.enemySizeByTier.miniboss).toBeGreaterThan(render.enemySizeByTier.elite);
    expect(render.enemySizeByTier.elite).toBeGreaterThan(render.enemySizeByTier.normal);
    expect(render.worldScreensX).toBeGreaterThan(1);
    expect(render.worldScreensY).toBeGreaterThan(1);
    expect(ARCHETYPES).toContain(islands.bossArchetype);
  });

  it('арена босса и циферблат респауна описаны положительными числами', () => {
    const { bossArena, respawnDial } = balance.render;
    for (const value of [bossArena.radius, bossArena.ringWidth, bossArena.insetScreens]) {
      expect(value).toBeGreaterThan(0);
    }
    // Арена не должна быть шире экрана: гейт — точка на острове, а не сам остров.
    expect(bossArena.radius * 2).toBeLessThan(balance.render.virtualWidth);
    for (const value of Object.values(respawnDial)) {
      expect(value).toBeGreaterThan(0);
    }
    // Дуга рисуется внутри диска: толще радиуса она вывернется наизнанку.
    expect(respawnDial.thickness).toBeLessThan(respawnDial.radius);
  });

  it('экран гейта помещается в экран', () => {
    const { gateSheetWidth, gateBarWidth, gateBarHeight, gateSheetHeight } = balance.ui;
    expect(gateSheetWidth).toBeLessThanOrEqual(balance.render.virtualWidth);
    expect(gateBarWidth).toBeLessThan(gateSheetWidth);
    expect(gateBarHeight).toBeGreaterThan(balance.ui.barHeight);
    expect(gateSheetHeight).toBeGreaterThan(gateBarHeight * 2);
  });

  it('джойстик описан положительными числами', () => {
    for (const value of Object.values(balance.joystick)) {
      if (typeof value === 'number') expect(value).toBeGreaterThan(0);
    }
    expect(balance.joystick.maxDragRadius).toBeGreaterThanOrEqual(balance.joystick.deadzoneRadius);
  });

  it('кольцо джойстика не стоит в мёртвой зоне панели апгрейда', () => {
    // Панель перехватывает тач по всей ширине экрана в нижних upgradePanelHeight
    // единицах — если кольцо туда заезжает, тап по нему открывает апгрейд
    // вместо движения (см. joystick._note).
    expect(balance.joystick.bottomMargin).toBeGreaterThan(
      balance.render.upgradePanelHeight + balance.joystick.baseRadius,
    );
  });

  it('ценность тира растёт вместе с силой врага', () => {
    const { tierValue } = balance.growth;
    expect(tierValue.miniboss).toBeGreaterThan(tierValue.elite);
    expect(tierValue.elite).toBeGreaterThan(tierValue.normal);
  });

  it('шанс дропа редкости — вероятность, а не что попало', () => {
    expect(balance.weapons.rarityDropChance).toBeGreaterThan(0);
    expect(balance.weapons.rarityDropChance).toBeLessThanOrEqual(1);
    expect(Number.isInteger(balance.save.schemaVersion)).toBe(true);
  });

  it('конфиг заморожен вглубь', () => {
    expect(Object.isFrozen(balance)).toBe(true);
    expect(Object.isFrozen(balance.combat)).toBe(true);
    expect(Object.isFrozen(balance.islands.list[0])).toBe(true);
    expect(() => {
      (balance.combat as { typeExponent: number }).typeExponent = 99;
    }).toThrow();
  });
});

describe('balance.json — маршруты врагов', () => {
  const KINDS = ['circle', 'line', 'eight', 'guard'];

  it('каждому тиру задан хотя бы один вид маршрута из известных', () => {
    for (const tier of ['normal', 'elite', 'miniboss'] as const) {
      const kinds = balance.patrol.kindByTier[tier];
      expect(kinds.length).toBeGreaterThan(0);
      for (const kind of kinds) expect(KINDS).toContain(kind);
    }
  });

  it('мини-босс сторожит узел: к нему ходят адресно, он не должен уходить', () => {
    expect([...balance.patrol.kindByTier.miniboss]).toEqual(['guard']);
    expect(balance.patrol.speedByTier.miniboss).toBe(0);
  });

  it('радиус маршрута меньше половины расстояния между узлами', () => {
    // Иначе круги соседей пересекаются, и «подойти к одному, не задев
    // второго» перестаёт быть решением — становится лотереей.
    expect(balance.patrol.radius.min).toBeLessThanOrEqual(balance.patrol.radius.max);
    expect(balance.patrol.radius.max * 2).toBeLessThanOrEqual(balance.render.enemyMinSpacing);
  });

  it('ходячие тиры действительно ходят, пунктир маршрута видим', () => {
    expect(balance.patrol.speedByTier.normal).toBeGreaterThan(0);
    expect(balance.patrol.speedByTier.elite).toBeGreaterThan(0);
    expect(balance.patrol.pathAlpha).toBeGreaterThan(0);
    expect(balance.patrol.pathAlpha).toBeLessThanOrEqual(1);
    expect(balance.patrol.pathDash).toHaveLength(2);
  });
});

describe('balance.json — интерфейс', () => {
  it('все метрики интерфейса положительны, кроме знаковых сносов полос', () => {
    // Снос полосы HP знаковый: отрицательный опускает её на фигуру, как в
    // референсе, где полоса игрока лежит на плечах, а не висит над головой.
    const signed = new Set(['playerBarOffset', 'enemyBarOffset']);
    for (const [key, value] of Object.entries(balance.ui)) {
      if (typeof value !== 'number') continue;
      if (signed.has(key)) expect(Number.isFinite(value), key).toBe(true);
      else expect(value, key).toBeGreaterThan(0);
    }
  });

  it('цвета интерфейса и редкостей — валидный hex', () => {
    for (const [key, value] of Object.entries(balance.ui.colors)) {
      expect(value, key).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
    expect(Object.keys(balance.ui.rarityColors).sort()).toEqual([...RARITIES].sort());
    for (const rarity of RARITIES) {
      expect(balance.ui.rarityColors[rarity]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('полоса слотов не заезжает под кольцо джойстика', () => {
    // Слоты ловят тач по себе, но визуально налезать на стик им тоже нельзя.
    const slotsHeight = balance.ui.slotBottom + balance.ui.slotSize + balance.ui.fontSmall * 2;
    expect(balance.joystick.bottomMargin).toBeGreaterThan(
      slotsHeight + balance.joystick.baseRadius,
    );
  });

  it('полоса HP не уже строки иконок: над врагом это один блок, а не два', () => {
    expect(balance.ui.enemyBarWidth).toBeGreaterThanOrEqual(balance.ui.chipSize * 3);
    // Игрок крупнее рядового врага — его нужно находить взглядом мгновенно.
    expect(balance.render.playerSize).toBeGreaterThan(balance.render.enemySizeByTier.normal);
  });
});
