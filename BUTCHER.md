# BUTCHER HERO — разбор референса

Что вытащено из живого билда `Butcher hero: hook'n'chew RPG` (MULTICAST GAMES) и
что из этого мы берём. Рабочий справочник, к которому возвращаемся при спорах о
боёвке, балансе и ощущении.

Референс назван в `GDD.md` §1. Здесь — фактура под него: не впечатления, а числа
из конфигов.

---

## 0. Где лежат данные

```
~/Desktop/butcher-ref/          вне репозитория, 36 МБ, 2998 файлов
├── Scripts/                    1645 .cs — имена классов, полей, перечислений
├── Configs/                    174 ScriptableObject со значениями
├── remote-config.json          живые A/B-тесты с сервера
├── monoscripts.txt             карта 3444 классов по сборкам
└── config_index.json           .asset → класс → размер
```

**Тела методов пустые.** Cpp2IL восстанавливает сигнатуры, поля и все данные, но
не логику. Формулы выводятся из чисел. Для дизайна этого достаточно.

### Как воспроизвести

Игра поставлена из App Store на Apple Silicon и лежит распакованной:
`/Applications/Butcher hero: hook'n'chew RPG.app/Wrapper/ButcherherohooknchewRPG.app`

1. Настоящий код — не в исполняемом файле (там 88 КБ заглушки), а в
   `Frameworks/UnityFramework.framework/UnityFramework` (103 МБ).
2. Скопировать бандл, подменив исполняемый файл на `UnityFramework`, и уложить в
   `Payload/Name.app/` — иначе AssetRipper видит «Mixed structure» и не ищет il2cpp.
3. `AssetRipper 2.0` (`--headless --port N`), `POST /LoadFolder` с `path=`,
   затем `POST /Export/UnityProject`. Есть `/openapi.json`.
4. Сейв читается напрямую: `~/Library/Containers/com.multicastgames.butcher/Data/
   Documents/game_data.bin` — незашифрованный MessagePack, 26 подсистем.

---

## 1. Технический профиль

| | |
|---|---|
| Движок | Unity 6000.4.12f1, il2cpp, metadata v39 |
| Билд | 19 авг 2026, 232 МБ, 101 858 методов |
| Архитектура | ECS **Scellecs.Morpeh** + реактивная модель **UniMob** |
| Асинхронность | UniTask |
| Камера | Cinemachine |
| UI-анимации | BrunoMikoski.AnimationSequencer (обёртка DOTween) |
| Сейвы | MessagePack |
| Тактильная отдача | Lofelt Nice Vibrations |
| Контент | Addressables |
| Аналитика | AppMetrica + Firebase, **65 классов событий** |
| Реклама | AppLovin MAX, BigoADS, Unity Offerwall |
| Своих классов | 1186 (`Assembly-CSharp`) |

Содержимое: 28 615 GameObject, 7462 MonoBehaviour, **1137 систем частиц**,
133 анимклипа, 31 AnimatorController, 707 спрайтов, 140 аудиоклипов.

Постобработка почти выключена: `ChromaticAberration intensity 0.056`,
`ColorGrading active: 0`. Дороговизна картинки берётся не из фильтров.

---

## 2. Словарь игры

```
StatType (36)      MovementSpeed Health HealthRegen Damage AttackRange AttackCooldown
                   {Stab,Cut,Magic,Buckshot}{Damage,Defence}{Flat,Percent}
                   LifestealFlat/Percent Evasion CritChance CritDamagePercent
                   SuperCritChance SuperCritDamagePercent UniversalDefence*
                   GlobalAttack GlobalDefence BlockChance BlockAmount
                   VisualScaleMultiplier

WeaponType (5)     Stabbing Cutting Magic Buckshot Universal
Rarity (7)         Common Uncommon Rare Epic Legendary Divine Mythical
ItemSlotType (3)   Weapon Helmet Shield

AbilityTrigger (23) OnEquip OnKill OnHit OnMove OnCrit OnTargetChange Passive
                    OnPostHit OnSuperCrit OnDevour OnEvasion OnPostCrit
                    OnGetHitLowHealth OnBlock OnRageLevelUp OnEvasionProc
                    OnShockConsume OnLethalDamageIgnore OnCooldownReset
                    OnPreHit OnOneshot OnLightningHit OnMarkApplied
```

Каждому типу урона зеркально соответствует тип защиты — во flat- и
percent-вариантах. Наши три типа против их четырёх; наша схема — подмножество их,
без процентных дублей (сознательно, `GDD.md` §11).

Внутреннее имя системы поедания — **Devour** (`menuName = "Devour/MetaStatsConfig"`).

---

## 3. Главное: стрелка направлена в другую сторону

Мы пишем числа в `balance.json` и симулятором проверяем, что получилось.
**Они пишут в конфиг желаемые ощущения, а числа генерирует симулятор.**

```
MobFightTime       = 15f    целевая длительность боя с обычным врагом, секунд
BossMobFightTime   = 25f    то же для босса
OutOfCombatTimeout = 5f
MobAggroRange      = 10f    MobAttackRange   = 3.3f
MobAggroDuration   = 8f     MobMovementSpeed = 3.5f
MobDifficulty      = 1f     ShockedDuration  = 10f
PiercingWeaponHitChance = 0.1f
```

Пятнадцать секунд — не результат подбора статов, а **задание** для подбора.

### ForecastApi

`Codebase.Simulation.Forecast.ForecastApi.BuildAsync(minutesAhead, stepMinutes, …)`
прогоняет симуляцию будущего игрока **в рантайме** и автобалансирует врагов.
Вход (`ForecastAutoBalanceInput`):

```
ForecastLocationNumber      EnemyAttackType
EnemyStatsGrowthPerMinute   ResistStabbing / ResistCutting / ResistBuckshot
DamageRampDelaySeconds      DamageRampPercentPerSecond
BossFightTimeSecondsMin/Max BossDifficultyMin/Max
RewardMinutesMin/Max        RewardMinutes
EventBossCount / EventBossGamma / EventBossMinutes / EventLastBossMinute
BossSnapshotTimingStep      RandomBossResists
```

Выход (`ForecastAutoBalancedEnemy`): `Kind, FightTimeSeconds, Difficulty, Health, Damage`.

Результаты **запекаются** в конфиг — `SpawnerBakeInfos` хранит у каждого спавнера
`Health`, `Damage`, `PrevHealth`, `PrevDamage` и `OptimumTime`.

`DamageRampDelaySeconds` + `DamageRampPercentPerSecond` — отдельная находка: урон
врага **нарастает по ходу боя**. Это и есть их механизм «дожать или отойти»,
альтернативный нашему регену: чем дольше стоишь, тем больнее.

### SimulationConfig — параметры прогона

```
TimeStep 300          SnapshotInterval 300     SimulationSpeed 9
UseFastTick 1         FastTickStartChunkOffset 4
TimeChunkDurationMinutes 30    SpawnerChargesChunkMinutes 1440
LifeCycleInMinutes [10, 230]   AdsIntervalMinutes 6
MaxSimultaneousAttackers 4
IsSmartPath 1         IsDynamicResourcePriority 1    IsCapOptimumTime 1
AutoBalanceItems 1    AutoBalanceAmulet 0
```

`MaxSimultaneousAttackers = 4` — **защита читаемости**, вписанная как константа.
Сколько бы врагов ни собралось, атакуют одновременно максимум четверо.
При автобое единственное, что есть у игрока, — способность понять экран.

---

## 4. Шкала опасности

`SimulationConfig.DifficultyThresholds` — отношение силы врага к игроку → цвет:

| порог | цвет | |
|---|---|---|
| 0.05 | `#33FF33` | безопасно |
| 0.30 | `#FFFF33` | заметно |
| 0.95 | `#FF9933` | на грани |
| 1.00 | `#FF3333` | паритет |
| 4.00 | `#571300` | смертельно |
| 10.0 | `#000000` | безнадёжно |

Шесть ступеней, а не три. Пороги **сгущаются вокруг единицы**: между 0.95 и 1.00
отдельный цвет. Всё выше четырёх схлопнуто — там точность не нужна.

**Правило:** разрешение шкалы тратится там, где принимается решение.

У нас (`balance.json.icons`) сейчас две границы, `greenAt 1.5` / `redAt 0.7`, то
есть три состояния с равномерным и грубым шагом ровно в зоне решения.

---

## 5. Оружие: удар живёт внутри анимации

`ItemConfig`, пример — `cut legendary`, ключ `chainsaw`:

```
Key chainsaw   Rarity 4 (Legendary)   SlotType 0 (Weapon)   DamageType 1 (Cutting)
DamageStatTypeFlat 8 (CutDamageFlat)  DamageStatTypePercent 9
FlatDamage 30000        AttackCooldown 0.9
AnimationCastPoint 0.75     момент удара, доля анимации
AnimationBackPoint 0.4      момент возврата
HitFrameAt60Fps             производный кадр попадания
SimulationDpsWeaponMultiplier 1
StatModifiers[]   AbilityDefs[]
```

**Урон наносится не по истечении кулдауна, а в точке анимации.** При этом
анимационные события Unity не используются: во всех 133 клипах встречаются ровно
две функции, `WalkEnabled` и `WeaponAppear`. Момент попадания вычисляется из числа
в конфиге. Решение data-driven и переносится на Canvas 2D без потерь.

Крюк разбит на три равные доли:

```
WindupDurationRatio 1/3    TravelDurationRatio 1/3    ReturnDurationRatio 1/3
HitCooldownRatio    1/3    HitElapsedRatio     2/3
```

### Способности оружия

`AbilityDef`: `Key, Trigger, Conditions[], Effects[], ConditionMode, UnlockLevel,
Value, Chance, StackLimit, AffectsValue/Chance/Stacks, LevelScaling[]`.

`LevelScaling` идёт **ступенями на значимых уровнях**, не линейно:

```
уровень   2     3     5     8     11    14    15
значение  0.28  0.31  0.34  0.38  0.42  0.46  0.50     (база 0.25)
```

52 класса эффектов. Показательные имена:

```
DamageForMissingHealthEffect      DamageForEmptySlotsEffect
BonusStatPerHitsTakenEffect       GrantRandomStatPerDistanceEffect
BonusDamagePerConsumedShockOnTargetEffect   TriggerHighestDamageWeaponEffect
StatStackEffect / WeaponStatStackEffect     HealFromDamageEffect
EmpowerHitAgainstStaticEffect     BuffNextThornsDamageEffect
```

Общий принцип: эффект привязан к **состоянию игрока или боя**, а не к плоскому
проценту. «Урон за недостающее здоровье», «стат за пройденное расстояние»,
«бонус за пустые слоты» — каждый превращает ситуацию в решение.

---

## 6. Экономика оружия и брони

```
MaxEvolutionLevel 15        CopyValueTargetShare 0.5
MinCopyValueGrowthMultiplier 1
MinEvolutionValueFromShardsMultiplier 2
MinArmorEvolutionValueFromPreviousEvolutionMultiplier 1.3

CutDamageBaseByRarity            [0, 0, 0, 0, 0, 0, 0]
CutDamageGrowthPerLevelByRarity  [12, 50, 140, 500, 2400, 2400, 2400]
ArmorBaseByRarity                [600, 4500, 27000, 310000, 2500000, 0, 0]
ArmorGrowthPerLevelByRarity      [100, 200, 350, 500, 2000, 5000, 5000]
```

Базовый урон по редкости — нули: **вся сила из роста за уровень**. Шаг между
редкостями от ×3 до ×11. Подтверждает наше правило «оружие множит стат, а не
прибавляется» — при аддитивной модели такие разрывы невозможны.

Эволюционные тайминги по 15 ступеней на каждую редкость; чем реже предмет, тем
позже его ступени: `Common` стартует с 17, `Legendary` — с 63.5.

---

## 7. Спавнер = узел прогрессии с таймером

`EnemySpawnerConfig`:

```
Key Prefab SpawnArea SpawnAreaRotation Count Stats WeaponType ArmorConfig
Cooldown  BigCooldown  ChargesBeforeBigRespawn  SyncBigRespawnToUtc  ShowCooldown
AggroRange AggroDuration IsStatic DisableAfterFirstClear LocationNumber
StatRewards[] ItemReward SlotReward PortalGemReward SoulReward
CurrencyReward CurrencyRewardAmount Gates[]
```

Не «место, где водятся мобы», а источник конкретной награды с зарядами на фарм,
коротким откатом между ними и длинным откатом после их траты.
`SyncBigRespawnToUtc` привязывает большой респавн к календарным суткам.

Ворота (`Gates`) висят прямо на спавнере: награда открывает следующий кусок мира.
**Прогрессия и карта — один объект.**

Живые значения зарядов (`long_items_cooldown`, вариант C):

```
chargesUncommon 6   chargesRare 4   chargesEpic 3   chargesDefault 1
defaultCooldownSeconds 86400   itemRewardSyncToUtc true
```

---

## 8. Кривая прогрессии

`IslandTargetDays` — целевое время выхода на каждый из **99** островов, в днях:

```
остров   1     2     3    5    10    20    50     99
дней     0.5   1.8   4    10   44    280   2191   8311
```

Первый остров за полдня, десятый за полтора месяца, пятидесятый за шесть лет,
последний за двадцать два года. Кривая не рассчитана на прохождение — она
рассчитана **никогда не кончаться**, оставаясь быстрой в первый день.

Наш маршрут Одиссея конечен по замыслу (13 островов), поэтому форму не берём —
но берём принцип первого дня: остров 1 проходится за полдня.

---

## 9. Ощущение

Собрано не из одного эффекта поверх кадра, а из множества мелких откликов,
привязанных к событиям. Каждый по отдельности почти не виден.

```
ECCameraShake / ECCameraShakeCaller / ECCameraShakeProjectile
    поля: shakeDuration, shakeAmount, decreaseFactor — разные вызовы под события
HapticSystem + HapticRequest (Lofelt HapticPatterns.PresetType) — пресет на событие
CameraSettings: Distance, AngleOfAttack, Inertia, Yaw, HeightSmoothTime
CameraZoomZoneTrigger      камера меняет дистанцию по зонам карты
QuestMobCameraSystem       отдельное поведение камеры на квестовых врагах
1137 систем частиц
AnimationSequencer         у каждого шага явные duration, delay, ease, flowType
```

Преобладающие длительности UI-шагов: 0.2, 0.25, 0.5, 1.0 с. Кривые — две-три
одинаковые на всю игру, а не разные в каждом месте.

---

## 10. Монетизация и удержание (живые A/B)

Активные варианты на момент снятия:

```
enemy_hp_damage_mult_v2 = G
    damageMultiplier default 3, но по локациям: 1→1.8  2→2.0  3→2.2  4→2.4  5→2.6
    rewardedValueMultiplier 0.5
    ↳ сложность нарастает плавно первые пять локаций, дальше втрое
no_ads = CD              adCooldown 150 c, maxAdsPerDay 30
anti_afk = A             выключен (варианты: timeout 60 c и 2 c)
long_items_cooldown = C  заряды 6/4/3/1 по редкости, откат сутки, синк с UTC
vip_location_rewards = B bigCooldown 86400, syncBigRespawnToUtc, statReward ×0.5
iap_dynamic_balance = A  выключен; вариант B множит баланс по сумме покупок:
                         $100→×1.2  $500→×1.5  $1000→×1.8
stat_spawner_cooldown_multiplier_v2 = H
rewarded_delay_from_start = B
AdsIntervalMinutes 6     LifeCycleInMinutes [10, 230]
```

`iap_dynamic_balance` стоит запомнить как приём: баланс подстраивается под сумму,
которую игрок уже потратил. У нас это противоречит `GDD.md` §9.2 («платёж
ускоряет, но не пропускает») — не берём, но знать полезно.

65 классов аналитических событий — фактически карта того, какие решения игрока
разработчик считает значимыми. Не разобрано, лежит в `Scripts/Codebase/Analytics/Events`.

---

## 11. Что берём, что нет

| | что | статус |
|---|---|---|
| ✅ | Целевые длительности боя вместо ручных статов врага | берём |
| ✅ | Точка удара внутри анимации (`castPoint`) | берём |
| ✅ | Нелинейные пороги иконок, сгущённые у паритета | берём |
| ✅ | Лимит одновременных атакующих | берём |
| ✅ | Спавнер как узел: заряды, два уровня отката, награда → ворота | берём |
| ✅ | Способности от состояния боя, а не плоские проценты | берём |
| ✅ | `LevelScaling` ступенями на значимых уровнях | берём |
| ◐ | Нарастание урона врага по ходу боя | у нас эту роль играет реген; сравнить |
| ◐ | Слой мелких откликов | частично есть, расширяем |
| ◐ | 3D-сцена, 1137 систем частиц | 3D в рантайме — не наш инструмент. 3D как ИСТОЧНИК ассетов — наш: модели строятся скриптом в Blender и рендерятся в PNG под камеру игры (`GDD.md` §3, `ART_PIPELINE.md`) |
| ✗ | Кривая на 99 островов / 22 года | наш маршрут конечен |
| ✗ | Баланс, подстраиваемый под сумму покупок | против `GDD.md` §9.2 |
| ✗ | Обнуление уровня при росте редкости | против `GDD.md` §5.2 — их главная ошибка |

---

## 12. Не разобрано, доступно

- `SimulationData` (679 КБ) — запечённые прогоны
- 65 классов аналитических событий
- Конфиги: амулет, кристаллы, башня боссов, боевой пропуск, квесты, VIP, магазин
- `AmuletUpgradeConfig` (61 КБ), `LevelPassConfig` (71 КБ), `BossTowerConfig` (33 КБ)
- 388 текстур, 140 аудиоклипов, 482 префаба
- Запуск игры под управлением (скриншоты окна + синтез кликов) — даст отклик на
  ввод и посекундный сценарий первых минут, чего в данных нет

---

## 13. Рамка

Разбор сделан для понимания принципов: как связаны конфиг и ощущение, куда
направлена стрелка между балансом и симулятором, где тратится разрешение шкалы.

**Ассеты, код и числовые таблицы Butcher Hero в NOSTOS не переносятся.** У нас
свой мир, свой баланс и свой `balance.json`. Совпадение структур (типы урона,
редкости, копии) зафиксировано в `GDD.md` как осознанное заимствование жанровых
решений, а не как копирование.
