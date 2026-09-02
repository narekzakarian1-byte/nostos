// Полное описание структуры balance.json.
// Файл отражает конфиг один в один: любое поле, добавленное в JSON, добавляется и сюда.
// Форма конфига проверяется в тестах (tests/balance.test.ts) — приведение типов в Balance.ts
// компилятор проверить не может, поэтому расхождение ловится в рантайме.

export type DamageType = 'pierce' | 'slash' | 'crush';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type EnemyTier = 'normal' | 'elite' | 'miniboss' | 'boss';
export type RegenActor = 'player' | 'normal' | 'elite' | 'miniboss';
export type EnemyArchetype = 'fast' | 'armored' | 'heavy' | 'striker';
export type BalanceProfile = 'prototype' | 'production';
export type OfferTier = 'convenience' | 'power' | 'cosmetic';

export type StatKey =
  | 'maxHp' | 'regen' | 'moveSpeed'
  | 'pierceAtk' | 'slashAtk' | 'crushAtk'
  | 'pierceDef' | 'slashDef' | 'crushDef'
  | 'crit' | 'dodge' | 'critDamage';

export type Range = readonly [number, number];

export interface CombatConfig {
  readonly typeExponent: number;
  readonly damageFloor: number;
  readonly damageCeil: number;
  readonly baseAttackSpeed: number;
  readonly engageRange: number;
  readonly disengageRange: number;
}

export interface IconsConfig {
  readonly greenAt: number; readonly redAt: number;
}

export interface StatConversionConfig {
  readonly critCap: number;
  readonly kCrit: number;
  readonly dodgeCap: number;
  readonly kDodge: number;
  readonly critMultBase: number;
  readonly kCritDamage: number;
  readonly _note?: string;
}

export interface RegenEntry {
  readonly outOfCombatDelay: number; readonly rate: number;
}

export type RegenConfig = {
  readonly [K in RegenActor]: RegenEntry;
} & {
  readonly bossCombatRegen: number;
  readonly _note?: string;
};

export type BaseStats = { readonly [K in StatKey]: number };

export interface PlayerConfig {
  readonly baseStats: BaseStats;
  readonly respawnDelay: number;
  readonly deathPenalty: string;
}

export interface GrowthConfig {
  readonly gainRate: number;
  readonly diminishK: number;
  /** enemy_tier_value из BALANCE.md §8 — в самом документе не определён. */
  readonly tierValue: { readonly [K in EnemyTier]: number };
  readonly dropTable: { readonly [K in EnemyArchetype]: readonly StatKey[] };
  readonly _tierValueNote?: string;
}

export interface VipSlotConfig {
  readonly enabled: boolean;
  readonly unlockByPayment: boolean;
  readonly unlockFreeAtIsland: number;
  readonly _note?: string;
}

export interface WeaponsConfig {
  readonly model: string;
  readonly levelStep: number;
  readonly rarityMult: { readonly [K in Rarity]: number };
  readonly inheritLevelOnRarityUp: boolean;
  readonly slots: readonly DamageType[];
  readonly vipSlot: VipSlotConfig;
  /** Остров, с которого редкость становится доступной дропом. */
  readonly rarityUnlockIsland: { readonly [K in Rarity]: number };
  /** Шанс мини-босса уронить оружие следующей редкости своего типа. */
  readonly rarityDropChance: number;
  readonly _modelNote?: string;
  readonly _note?: string;
  readonly _rarityNote?: string;
  readonly _rarityDropNote?: string;
}

/**
 * Броня — зеркало оружия для защиты (BALANCE.md §7.5). Отдельный блок, а не флаг
 * внутри weapons: у неё своя валюта, свой темп уровней и свой шаг редкости, и
 * сводить их в один блок значит запретить крутить атаку и защиту по отдельности.
 *
 * VIP-слота здесь нет намеренно: он продаётся на оружие (GDD §9.1), и второй
 * платный слот на защиту превратил бы «ускоряет, но не пропускает» в «пропускает».
 */
export interface ArmorConfig {
  readonly model: string;
  readonly levelStep: number;
  readonly rarityMult: { readonly [K in Rarity]: number };
  readonly inheritLevelOnRarityUp: boolean;
  readonly slots: readonly DamageType[];
  readonly rarityUnlockIsland: { readonly [K in Rarity]: number };
  readonly rarityDropChance: number;
  readonly _modelNote?: string;
  readonly _note?: string;
}

export interface CopyProfile {
  readonly a: number; readonly b: number; readonly c: number;
}

export interface CopyDrop {
  readonly min: number; readonly max: number; readonly chance: number;
}

export interface CopiesConfig {
  readonly profiles: { readonly [K in BalanceProfile]: CopyProfile };
  readonly drops: { readonly [K in Exclude<EnemyTier, 'boss'>]: CopyDrop };
}

export interface EnemyTierConfig {
  readonly hpMult: number;
  readonly dpsMult: number;
  readonly defMult: number;
  readonly respawnSec: Range;
}

export interface EnemyDefenseConfig {
  readonly baseDef: number;
  readonly weaknessMult: number;
  readonly resistMult: number;
  readonly neutralMult: number;
  /** У босса два не-слабых типа стойкие, а не нейтральные (выведено из §5.4). */
  readonly bossResistOthers: boolean;
  readonly _note?: string;
  readonly _bossNote?: string;
}

export interface IslandDef {
  readonly n: number;
  readonly id: string;
  readonly name: string;
  readonly boss: string;
  // 'any' — только Итака: финальный босс уязвим ко всем трём типам.
  readonly bossWeakness: DamageType | 'any';
}

export interface IslandsConfig {
  readonly baseHp: number;
  readonly baseDps: number;
  readonly powerBase: number;
  readonly minibossesPerIsland: number;
  readonly normalsPerIsland: number;
  readonly elitesPerIsland: number;
  /** Какие статы даёт убитый островной босс — ключ в growth.dropTable. */
  readonly bossArchetype: EnemyArchetype;
  readonly list: readonly IslandDef[];
  readonly _bossArchetypeNote?: string;
}

export interface GateTargetsConfig {
  readonly firstAttemptProgressMin: number;
  readonly firstAttemptProgressMax: number;
  readonly minTimeToDeathSec: number;
  readonly prepTimeMinutes: { readonly early: Range; readonly mid: Range; readonly late: Range };
  readonly powerGapRatio: {
    readonly islands1to4: number; readonly islands5to9: number; readonly islands10to13: number;
  };
  /** Автопроверка 6 из SPEC.md §6: защита от возврата к аддитивной модели оружия. */
  readonly weaponDpsGain: {
    readonly fromLevel: number; readonly toLevel: number; readonly minRatio: number;
  };
}

export interface SimConfig {
  readonly travelSecondsPerNode: number;
}

export type HapticEvent = 'crit' | 'kill' | 'bossKill' | 'death';

export interface JuiceConfig {
  readonly hitstopMs: number;
  readonly hitstopCritMs: number;
  readonly screenshakeBase: number;
  readonly screenshakeCrit: number;
  readonly screenshakeDecayMs: number;
  readonly slowmoOnBossKill: { readonly scale: number; readonly durationMs: number };
  readonly soundPitchJitter: number;
  readonly damageNumberLifeMs: number;
  readonly hapticsOn: readonly HapticEvent[];
  readonly hapticsMs: { readonly [K in HapticEvent]: number };
}

/**
 * Анимация тел и удара. Числа держатся отдельно от juice: там вес удара
 * (hitstop, тряска), здесь — движение фигур. Все длительности в секундах
 * игрового времени.
 */
export interface AnimConfig {
  readonly windupSec: number;
  readonly windupLean: number;
  readonly strikeSec: number;
  readonly lungeUnits: number;
  readonly swingTiltDeg: number;
  readonly arcRadiusScale: number;
  readonly arcSpanDeg: number;
  readonly arcWidth: number;
  readonly arcAlpha: number;
  readonly hitFlashSec: number;
  readonly flashAlpha: number;
  readonly squashAmount: number;
  readonly recoilUnits: number;
  readonly recoilCritScale: number;
  readonly recoilSec: number;
  readonly deathSec: number;
  readonly deathRiseUnits: number;
  readonly deathSpinDeg: number;
  readonly deathStretch: number;
  readonly spawnSec: number;
  readonly spawnOvershoot: number;
  readonly enemyWindupSec: number;
  readonly enemyLungeUnits: number;
  readonly particlesPerHit: number;
  readonly particlesCritScale: number;
  readonly particleLifeSec: number;
  readonly particleSpeed: number;
  readonly particleSpread: number;
  readonly particleGravity: number;
  readonly particleSize: number;
  readonly particleMax: number;
  readonly rig: RigConfig;
  readonly _note?: string;
}

/** Углы костей бумажной куклы. Все — в градусах, кроме частот и долей. */
export interface RigConfig {
  readonly restArmDeg: number;
  readonly windupArmDeg: number;
  readonly strikeArmDeg: number;
  readonly offArmDeg: number;
  readonly walkLegDeg: number;
  readonly walkArmDeg: number;
  readonly walkLiftUnits: number;
  readonly cloakWalkDeg: number;
  readonly cloakWindDeg: number;
  readonly cloakWindHz: number;
  readonly backLimbShade: number;
  readonly weaponGripDeg: number;
  readonly _note?: string;
}

export interface LoopConfig {
  readonly tickHz: number; readonly maxStepsPerFrame: number; readonly _note?: string;
}

export interface RngConfig {
  readonly defaultSeed: number;
}

export interface PrototypeConfig {
  readonly islandNumber: number; readonly _note?: string;
}

export interface DevPanelConfig {
  readonly timeScales: readonly number[];
}

export interface RenderConfig {
  /** Виртуальная ширина ОДНОГО экрана — от неё считается scale. Мир шире (см. worldScreensX). */
  readonly virtualWidth: number;
  readonly playerSize: number;
  /** Запас видимости за краем экрана: плашка над врагом выше самой фигуры. */
  readonly iconOffset: number;
  readonly hudHeight: number;
  readonly damageNumberRise: number;
  readonly damageNumberFontSize: number;
  readonly damageNumberCritScale: number;
  readonly enemyMinSpacing: number; readonly enemySpawnMargin: number;
  /** Отступ точки старта от нижнего края мира, в экранах: у самого края
   *  полэкрана занимала бы пустота за границей острова. */
  readonly playerStartInsetScreens: number;
  /** Размер мира в экранах по каждой оси: узлы карты не помещаются в один телефонный экран. */
  readonly worldScreensX: number;
  readonly worldScreensY: number;
  readonly enemySizeByTier: { readonly [K in EnemyTier]: number };
  readonly upgradePanelHeight: number;
  readonly toastSeconds: number;
  readonly bossArena: BossArenaConfig;
  readonly respawnDial: RespawnDialConfig;
  readonly _note?: string;
  readonly _worldNote?: string;
  readonly _bossArenaNote?: string;
  readonly _respawnDialNote?: string;
}

/** Место островного босса: круг в верхней части острова, который видно издалека. */
export interface BossArenaConfig {
  readonly radius: number;
  /** Отступ арены от верхнего края мира, в экранах. */
  readonly insetScreens: number;
  readonly ringWidth: number;
}

/** Циферблат респауна на месте убитого узла. */
export interface RespawnDialConfig {
  readonly radius: number;
  readonly thickness: number;
  readonly pipWidth: number;
  readonly pipHeight: number;
  readonly pipGap: number;
  readonly labelOffset: number;
  readonly alpha: number;
}

export interface JoystickConfig {
  readonly baseRadius: number;
  readonly knobRadius: number;
  readonly maxDragRadius: number;
  readonly deadzoneRadius: number;
  readonly bottomMargin: number;
  readonly _note?: string;
}

export interface SaveConfig {
  readonly schemaVersion: number;
  readonly _note?: string;
  readonly _versionNote?: string;
}

export interface AudioConfig {
  readonly hitHz: number; readonly critHz: number;
  readonly killHz: number; readonly deathHz: number;
  readonly durationMs: number; readonly gain: number;
}

export interface Offer {
  readonly tier: OfferTier; readonly priceUsd: number; readonly mult?: number;
}

export interface MonetizationConfig {
  readonly firstOfferAfterMinutes: number;
  readonly powerOffersAfterDays: number;
  readonly sellCopiesDirectly: boolean;
  readonly offers: Readonly<Record<string, Offer>>;
  readonly _note?: string;
}

export interface OfflineConfig {
  readonly enabled: boolean; readonly capHours: number; readonly efficiency: number;
}

export interface Palette {
  readonly bgFar: string; readonly bgMid: string; readonly silhouette: string;
  readonly accentWarm: string; readonly accentLight: string; readonly danger: string;
  readonly iconGreen: string; readonly iconGrey: string; readonly iconRed: string;
  readonly roadDirt: string;
  readonly roadEdge: string;
  readonly roadStoneLight: string;
  readonly roadStoneDark: string;
  readonly grassTuft: string; readonly borderStone: string;
}

export interface PropSize {
  readonly fit: 'width' | 'height';
  readonly value: number;
}

export interface PropsConfig {
  readonly cameraTiltDeg: number;
  readonly lightX: number;
  readonly lightY: number;
  readonly lightZ: number;
  readonly shadeGain: number;
  readonly shadeBias: number;
  readonly shadeSteps: number;
  readonly shadowAlpha: number;
  readonly shadowColor: string;
  readonly contactAlpha: number;
  readonly contactSpread: number;
  readonly contactSquash: number;
  readonly seamWidth: number;
  readonly materials: Readonly<Record<string, readonly string[]>>;
  readonly sizes: Readonly<Record<string, PropSize>>;
  readonly _note?: string;
  readonly _lightNote?: string;
  readonly _shadeNote?: string;
  readonly _materialsNote?: string;
  readonly _sizesNote?: string;
}

export interface SceneryConfig {
  readonly propCount: number;
  readonly clusterSatellites: number;
  readonly clusterRadius: number;
  readonly clusterInner: number;
  readonly clusterSpacing: number;
  readonly minSpacingInCluster: number;
  readonly minSpacingFromEnemies: number;
  readonly borderInset: number;
  readonly borderThickness: number;
  readonly roadWidth: number;
  /** Ширина ответвления к боковому ландмарку. Уже стержня: развилка должна
   *  читаться как «свернуть», а не как «дорога раздвоилась». */
  readonly roadBranchWidth: number;
  /** Тёмный кант дороги и её кладка отдельными камнями. */
  readonly roadEdgeWidth: number;
  /** Полоса вдоль дороги, свободная от декора. */
  readonly roadClearance: number;
  /** Отбивка декора от краёв мира. */
  readonly propMargin: number;
  readonly roadStoneStep: number;
  readonly roadStonesPerStep: number;
  readonly roadStoneSize: number;
  readonly roadStoneSizeJitter: number;
  readonly roadStoneInset: number;
  readonly roadStoneSeam: number;
  /** Россыпь пучков травы поверх заливки земли. */
  readonly grassCount: number;
  readonly grassSize: number;
  readonly grassSizeJitter: number;
  readonly grassLean: number;
  readonly grassWidth: number;
  readonly _grassNote?: string;
  readonly _roadStoneNote?: string;
  readonly roadWaypoints: number;
  readonly roadJitter: number;
  readonly _note?: string;
  readonly _clusterNote?: string;
}

export interface FogConfig {
  readonly cellSize: number;
  readonly revealRadius: number;
  readonly _note?: string;
}

export interface MinimapConfig {
  readonly screenRadius: number;
  readonly margin: number;
  readonly worldRadius: number;
  readonly enemyDotRadius: number;
  readonly playerDotRadius: number;
  readonly fogAlpha: number;
  readonly _note?: string;
}

export type PatrolKind = 'circle' | 'line' | 'eight' | 'guard';
export type FarmTierKey = Exclude<EnemyTier, 'boss'>;

export interface PatrolConfig {
  /** Какие маршруты допустимы для тира. Мини-босс сторожит узел и не ходит. */
  readonly kindByTier: { readonly [K in FarmTierKey]: readonly PatrolKind[] };
  readonly radius: { readonly min: number; readonly max: number };
  readonly speedByTier: { readonly [K in FarmTierKey]: number };
  /** Круг сплющен по вертикали: сверху под наклоном ровный круг читается как эллипс. */
  readonly circleAspect: number;
  /** Приближение длины лемнискаты в радиусах — нужно, чтобы скорость была в единицах/с. */
  readonly eightPerimeterK: number;
  readonly pauseInCombat: boolean;
  readonly pathAlpha: number;
  readonly pathWidth: number;
  readonly pathDash: Range;
  readonly _note?: string;
  readonly _pauseNote?: string;
}

export interface UiColors {
  readonly outline: string; readonly panel: string; readonly panelDark: string;
  readonly panelInner: string; readonly button: string; readonly buttonDark: string;
  /** Кнопки магазина и сумки красятся по функции, как в референсе. */
  readonly buttonShop: string; readonly buttonBag: string;
  readonly text: string; readonly textDim: string;
  readonly hpEnemy: string; readonly hpPlayer: string; readonly hpBack: string;
  readonly ready: string; readonly gold: string; readonly alert: string;
  readonly chip: string;
  /** Цвет земли острова: запасная заливка мира и открытая часть карты. */
  readonly ground: string;
  readonly sheet: string; readonly veil: string;
}

export interface UiConfig {
  readonly outline: number; readonly radius: number; readonly margin: number;
  /** Отступ полосы слотов от низа экрана: под ней ещё безопасная зона телефона. */
  readonly slotBottom: number;
  readonly buttonSize: number; readonly buttonGap: number;
  readonly pillHeight: number; readonly pillPad: number;
  readonly slotSize: number; readonly slotGap: number; readonly slotChip: number;
  readonly barHeight: number;
  readonly playerBarWidth: number; readonly playerBarOffset: number;
  readonly enemyBarWidth: number; readonly enemyBarOffset: number;
  readonly chipSize: number; readonly chipGap: number; readonly chipOffset: number;
  readonly fontSmall: number; readonly fontBody: number; readonly fontTitle: number;
  readonly textOutline: number;
  readonly shadowAlpha: number; readonly shadowScale: number;
  /** Снос тени фигуры по свету, долей от её высоты. */
  readonly shadowLean: number;
  readonly _shadowLeanNote?: string;
  readonly walkBobAmp: number; readonly walkBobHz: number;
  readonly joystickArrow: number; readonly joystickAlpha: number;
  readonly sheetPad: number; readonly statTileHeight: number; readonly cardHeight: number;
  /** Экран прогресса по боссу (GDD §6.3). */
  readonly gateBarWidth: number; readonly gateBarHeight: number;
  readonly gateSheetWidth: number; readonly gateSheetHeight: number;
  readonly colors: UiColors;
  readonly rarityColors: { readonly [K in Rarity]: string };
  readonly _note?: string;
}

export interface Balance {
  readonly version: number;
  readonly activeProfile: BalanceProfile;
  readonly combat: CombatConfig;
  readonly icons: IconsConfig;
  readonly statConversion: StatConversionConfig;
  readonly regen: RegenConfig;
  readonly player: PlayerConfig;
  readonly growth: GrowthConfig;
  readonly weapons: WeaponsConfig;
  readonly armor: ArmorConfig;
  readonly copies: CopiesConfig;
  /** Осколки брони — своя валюта, той же формы, что копии оружия. */
  readonly armorShards: CopiesConfig;
  readonly enemyTiers: { readonly [K in EnemyTier]: EnemyTierConfig };
  readonly enemyDefense: EnemyDefenseConfig;
  readonly islands: IslandsConfig;
  readonly gateTargets: GateTargetsConfig;
  readonly sim: SimConfig;
  readonly juice: JuiceConfig;
  readonly anim: AnimConfig;
  readonly monetization: MonetizationConfig;
  readonly offline: OfflineConfig;
  readonly loop: LoopConfig;
  readonly rng: RngConfig;
  readonly prototype: PrototypeConfig;
  readonly devPanel: DevPanelConfig;
  readonly render: RenderConfig;
  readonly joystick: JoystickConfig;
  readonly scenery: SceneryConfig;
  readonly fog: FogConfig;
  readonly minimap: MinimapConfig;
  readonly patrol: PatrolConfig;
  readonly ui: UiConfig;
  readonly save: SaveConfig;
  readonly audio: AudioConfig;
  readonly props: PropsConfig;
  readonly palette: Palette;
  readonly _comment?: string;
}
