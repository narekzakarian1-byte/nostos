[← остров 12](12-scheria.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · **последний остров**

# ОСТРОВ 13 — ИТАКА

> Концепция острова, слоты под картинки и промпты к ним. Общие правила — камера,
> свет, контраст, именование файлов — в [ISLANDS.md §1](../ISLANDS.md#1-общие-правила).
> Числа боя живут в `balance.json` и сюда не переносятся.
>
> **Ассетов на остров: 15.**

---

## 1. КОНЦЕПЦИЯ

**id:** `ithaca` · **босс:** Антиной и женихи, слабость **все три** ·
**биом:** вечерние оливковые рощи, козьи скалы, дворец

> Ты дома. Ты стоишь в собственном дворе, и тебя не пускают внутрь свои же.

**Вид.** Возврат к палитре первого острова, но на закате: та же зелень, те же
известняк и олива, только свет тёплый и тени длинные. Это и есть ностос —
кольцо должно быть видно глазом, без единого слова. Внизу гавань Форкина и
пещера нимф с двумя входами (канон Од. XIII). Выше — козьи тропы по скалам,
свинарник Эвмея с плетнём, старые оливы. Наверху — дворец: колонны, очаг,
столы, брошенные кубки. В зале вдоль пола выстроены **двенадцать секир** — то
самое состязание с луком. Это финальный объект игры, и он должен стоять так,
чтобы игрок прошёл вдоль него к боссу.

**Палитра**

| Роль | Hex |
|---|---|
| вечерняя трава | `#4E7A3C` |
| трава в тени | `#2B4F2C` |
| закатный свет | `#C08A45` |
| известняк | `#E8DCC8` |
| серебро оливы | `#8FA06B` |
| царский пурпур | `#6B3A5E` |

**Планировка**

```
┌────────────────┬────────────────┬────────────────┐
│ КЛАДОВАЯ       │ ★ ПИРШЕСТВЕННЫЙ│ ДВЕРИ ЗАЛА     │
│ ОРУЖИЯ         │  ЗАЛ           │ ▲ Агелай  ◆    │
│ ▲ Меланфий  ◆  │  двенадцать    │                │
│                │  секир, очаг   │                │
├────────────────┼─══════════════─┼────────────────┤
│ ДВОР И ОЧАГ    │ ДОРОГА К       │ СТОЛЫ ПИРА     │
│ ▲ Эвримах  ◆   │ ДВОРЦУ         │ ▲ Ктесипп  ◆   │
│                │ • • • •        │                │
├────────────────┼─══════════════─┼────────────────┤
│ СВИНАРНИК      │ ◎ ГАВАНЬ       │ ОЛИВКОВАЯ РОЩА │
│ ЭВМЕЯ          │   ФОРКИНА      │ ▲ Леокрит      │
│ • •            │   пещера нимф  │ • •            │
└────────────────┴════════════════┴────────────────┘
```

Дорога проходит три состояния по мере подъёма — единственный остров, где она
меняется: козья тропа внизу, мощёная дорога в середине, мраморный пол зала
наверху. Это финальная работа дорожного ассета, и её стоит собрать из трёх
тайлов.

**Пять мини-боссов** — женихи, все канонические имена

| Имя | Копии | Где |
|---|---|---|
| Эвримах Златоуст | рубящий | двор и очаг |
| Агелай | рубящий | двери зала |
| Меланфий-козопас | колющий | кладовая оружия |
| Леокрит | колющий | оливковая роща |
| Ктесипп | дробящий | столы пира |

Ктесипп в поэме швыряет в Одиссея коровье копыто — дробящий тип достался ему
по заслугам.

**Объекты**

| Файл | Размер | Что это |
|---|---|---|
| `ground/ithaca.png` | тайл 512 | вечерняя трава с оливковым опадом |
| `road/ithaca.png` | тайл 128 | козья тропа по щебню |
| `road/ithaca-palace.png` | тайл 128 | мраморный пол зала |
| `borders/ithaca.png` | 512×256 | скалы и стена дворца |
| `props/olive-old.png` | в 175 | старая олива, ствол витой, листва серебристая |
| `props/eumaeus-pen.png` | в 75 | плетень свинарника с воротцами |
| `props/nymph-cave.png` | в 140 | пещера нимф с двумя входами |
| `props/palace-facade.png` | в 230 | фасад дворца, ландмарк арены |
| `props/twelve-axes.png` | ш 200 | двенадцать секир, вкопанных в ряд |
| `props/feast-table.png` | ш 130 | стол с брошенным пиром, опрокинутые кубки |
| `props/bow-on-wall.png` | в 90 | лук Одиссея на стене, тетива снята |

**Враги — женихи и их слуги**

- **Обычный (36).** Не воин: пирующий в дорогом хитоне с золотой застёжкой,
  венок сполз, в одной руке кубок, в другой — меч, который он держит неправильно.
  Босой. Он не должен выглядеть опасным поодиночке — их сто восемь.
- **Элита (48).** Телохранитель жениха: щит и шлем поверх пиршественной одежды,
  плащ подобран за пояс. Смесь роскоши и войны — самый неприятный костюм игры.
- **Мини-босс (68).** Жених с именем: пурпурный плащ, золото на руках,
  дорогое оружие, которым он умеет пользоваться.

**Босс — Антиной** (слабость: все три типа)

Самый богатый из женихов: пурпурный плащ, золотые браслеты, венок. В одной
руке — кубок, который он не успел допить: у Гомера стрела попадает ему в горло
ровно в этот момент, и кубок должен быть в кадре. Вокруг него — зал, полный
остальных, но бьётся он один.

Слабость ко всем трём типам — не поблажка, а замысел: последний гейт проверяет
не догадку про тип, а всё, что игрок собрал за тринадцать островов. Три иконки
над ним впервые в игре горят зелёным одновременно, и это награда сама по себе.

**Арена.** Пиршественный зал: круг мраморного пола между колоннами, вдоль него
двенадцать секир, в глубине — очаг, у стены — лук. Столы опрокинуты.

**Трофей на корабль:** лук Одиссея — последний трофей, ставится на мачту
целиком.

---

## 2. АССЕТЫ — СЛОТЫ ПОД КАРТИНКИ

**Куда грузить сгенерированную картинку:** в `islands/uploads/ithaca/<категория>/`,
с тем же именем файла, что написано в заголовке слота (например
`islands/uploads/ithaca/props/olive-old.png`). Категория — часть пути сразу
после `art/` в заголовке слота: `ground`, `road`, `borders`, `props` или
`entities`.

Когда файлы острова лежат в `uploads/ithaca/`, один раз прогнать:

```
python3 tools/import-island-art.py ithaca
```

Он сам решит, резать ли зелёный фон (`props`/`entities`/`borders` — да, `ground`/`road`
— нет, это бесшовные тайлы без хромакея), и разложит результат по `public/art/`.
Исходники в `uploads/` не удаляются — пересобрать можно без похода в ChatGPT заново.

Под каждым слотом ниже: превью (подтянется само, как только файл окажется в
`public/art/`), готовый промпт и строка для заметок. Перед промптом вставить
преамбулу своего вида — они лежат в §5 этого же файла. Отметку `[ ]` менять на
`[x]`, когда файл прошёл четыре проверки приёмки
([ISLANDS.md §4](../ISLANDS.md#4-чек-лист-генерации)).

### 2.1 Земля, дорога, граница

#### [ ] `public/art/ground/ithaca.png` — вечерняя трава с оливковым опадом · тайл 512

![](../public/art/ground/ithaca.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
A Greek hillside meadow in warm evening light seen from above: flat green grass as
a calm base, large soft patches of long warm shadow, very sparse tiny details
only: a few small silver olive leaves fallen, a couple of tiny limestone pebbles,
one small dry thyme tuft. Warmer and more golden than a midday meadow.
PALETTE: evening grass #4E7A3C dominant, shadow #2B4F2C, warm sunlit green
#6E9448, olive silver #8FA06B, limestone #E8DCC8, warm light wash #C08A45.
```

_Заметки:_

#### [ ] `public/art/road/ithaca.png` — козья тропа по щебню · тайл 128

![](../public/art/road/ithaca.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
A goat track over stony hillside: loose pale gravel and small flat stones beaten
into a narrow path, tufts of dry grass at the edges, a few goat droppings, tiles
seamlessly along the long axis, 128x128.
PALETTE: gravel #C9C3AE / #A2833A, stone #8FA06B, dust #C08A45.
```

_Заметки:_

#### [ ] `public/art/road/ithaca-palace.png` — мраморный пол зала · тайл 128

![](../public/art/road/ithaca-palace.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
A polished marble hall floor: large fitted cream marble slabs with thin dark
joints, a repeating meander (Greek key) border band running along one edge, warm
firelight sheen across the stone, tiles seamlessly along the long axis, 128x128.
PALETTE: marble #E8DCC8 / #C9C3AE, joints #6E6A63, meander band #6B3A5E, warm
sheen #C08A45.
```

_Заметки:_

#### [ ] `public/art/borders/ithaca.png` — скалы и стена дворца · 512×256

![](../public/art/borders/ithaca.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
Horizontal repeating border strip: rough limestone cliffs with dry scrub and a few
silver olive branches at the top, and at one end the corner of a dressed palace
wall with a painted meander band. Isolated strip on flat #00FF00, no ground
beneath, tileable left-to-right, ~55-degree top-down, one hard light from the
right, no shadow drawn, 512x256.
PALETTE: limestone #E8DCC8 / #A8A08C, scrub #8FA06B, palace wall #DCD8CC, meander
#6B3A5E.
```

_Заметки:_

### 2.2 Пропы

#### [ ] `public/art/props/olive-old.png` — старая олива, ствол витой, листва серебристая · в 175

![](../public/art/props/olive-old.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A very old olive tree: a thick twisted hollow trunk that looks braided, a broad
irregular canopy of small silver-green leaves, two propped branches, a few black
olives, gnarled roots lifting the soil.
PALETTE: silver foliage #8FA06B / #6E8A4B, bark #7A6A55 / #4A3B2C, olives #2B4F2C,
cream rim light #E8DCC8.
```

_Заметки:_

#### [ ] `public/art/props/eumaeus-pen.png` — плетень свинарника с воротцами · в 75

![](../public/art/props/eumaeus-pen.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A swineherd's pen: a woven wattle fence with a rough timber gate, a stone trough
inside, churned mud, a bundle of firewood and a hanging cloak by the gatepost.
PALETTE: wattle #9C7B4A / #68482E, stone trough #C9C3AE, mud #5A4A34, cloak
#8FA06B.
```

_Заметки:_

#### [ ] `public/art/props/nymph-cave.png` — пещера нимф с двумя входами · в 140

![](../public/art/props/nymph-cave.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
The cave of the nymphs: a low rock opening in a hillside with TWO entrances, one
wide and one narrow, stone water basins outside, a stone loom shape carved in the
rock, bees around the upper opening, ferns at the mouth.
PALETTE: rock #A8A08C / #6E7A8C, dark interior #080D14, ferns #4E7A3C, honey
accent #E8B23C.
```

_Заметки:_

#### [ ] `public/art/props/palace-facade.png` — фасад дворца, ландмарк арены · в 230

![](../public/art/props/palace-facade.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
The facade of Odysseus's palace: a colonnaded porch of four fluted columns on a
raised stone step, a heavy bronze-studded double door standing ajar with warm
firelight spilling out, a painted meander band under the roof, a stone bench
against the wall. Monumental landmark, wider than tall.
PALETTE: marble #E8DCC8 / #C9C3AE / #8B97AE, door timber #68482E, bronze studs
#B87333, meander #6B3A5E, firelight #D9762B.
```

_Заметки:_

#### [ ] `public/art/props/twelve-axes.png` — двенадцать секир, вкопанных в ряд · ш 200

![](../public/art/props/twelve-axes.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Twelve iron axe heads set upright in a straight row along a hall floor, each
socketed into a wooden block and lined up so their round socket holes form one
continuous line to aim an arrow through. Long, low and perfectly aligned.
PALETTE: dark iron #3E434C / #262B33, wood blocks #68482E, bronze binding #B87333,
marble floor #E8DCC8.
```

_Заметки:_

#### [ ] `public/art/props/feast-table.png` — стол с брошенным пиром, опрокинутые кубки · ш 130

![](../public/art/props/feast-table.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
An abandoned feast: a long low wooden table with overturned bronze cups, a spilled
wine krater, picked-over meat on platters, a stool knocked on its side, wine
running off one edge.
PALETTE: table wood #68482E / #4A3B2C, bronze #B87333, wine #5B2A3A, bread and
bone #E8DCC8.
```

_Заметки:_

#### [ ] `public/art/props/bow-on-wall.png` — лук Одиссея на стене, тетива снята · в 90

![](../public/art/props/bow-on-wall.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A great horn bow hanging on two pegs on a plain wall, unstrung, the bowstring
coiled on a peg beside it, a quiver of arrows leaning below, a faint clean patch
on the wall where it has hung for years.
PALETTE: horn and wood #A2833A / #68482E, string #E8DCC8, bronze arrowheads
#B87333, wall #C9C3AE.
```

_Заметки:_

### 2.3 Враги и босс

#### [ ] `public/art/entities/ithaca-normal.png` — обычный враг

![](../public/art/entities/ithaca-normal.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A suitor at the feast: a young man in an expensive fine-woven tunic with a gold
shoulder pin, a slipped wreath on his head, barefoot, a drinking cup in one hand
and a sword held awkwardly in the other — a man who has never fought. Relaxed,
overfed, arrogant posture.
PALETTE: near-black body #080D14, fine tunic #E8DCC8, gold pin and wreath #E8B23C,
wine #5B2A3A, purple trim #6B3A5E.
```

_Заметки:_

#### [ ] `public/art/entities/ithaca-elite.png` — элита

![](../public/art/entities/ithaca-elite.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Same suitor family, one rank up: a bodyguard wearing a helmet and carrying a round
shield OVER his banquet clothes, cloak tucked into his belt, sandals on. The
mixture of luxury and war gear is the point.
PALETTE: as above plus bronze #B87333 and shield face #C9C3AE.
```

_Заметки:_

#### [ ] `public/art/entities/ithaca-miniboss.png` — мини-босс

![](../public/art/entities/ithaca-miniboss.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Same family, a named suitor: a purple cloak, heavy gold arm rings, an ornate
scabbard, and a stance that shows he actually knows how to use the blade. Twice
the size of the base suitor.
PALETTE: as above plus royal purple #6B3A5E dominant.
```

_Заметки:_

#### [ ] `public/art/entities/boss-ithaca.png` — БОСС

![](../public/art/entities/boss-ithaca.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Boss character: Antinous, first of the suitors. The richest man in the hall: a
deep purple cloak, gold arm rings and a gold wreath, an ornate sword drawn in one
hand — and in the other a raised drinking cup he has not finished, tilted toward
his mouth. Caught in the exact instant before the arrow. Confident, contemptuous,
standing his ground.
PALETTE: near-black #080D14, royal purple #6B3A5E, gold #E8B23C, cream tunic
#E8DCC8, wine #5B2A3A, bronze #B87333.
```

_Заметки:_

---

## 3. РЕФЕРЕНСЫ

Сюда — всё, от чего отталкиваемся: скриншоты игр, фотографии мест, керамика,
наброски. Файлы класть в `islands/ref/ithaca/`, вставлять строкой
`![подпись](ref/ithaca/имя.png)`.

<!-- ![](ref/ithaca/имя.png) -->

---

## 4. ЗАМЕТКИ И РЕШЕНИЯ

Что поменяли против концепции и почему; что не сработало у генератора, чтобы не
наступить второй раз.

| Дата | Что решили | Почему |
|---|---|---|
|  |  |  |

---

## 5. ПРЕАМБУЛА ТАЙЛА

Копия из [ISLANDS.md §1.4](../ISLANDS.md#14-преамбула-промпта-для-тайла-земли) —
источник истины там, здесь для того, чтобы собирать промпт не выходя из файла.

Только земля. Объекты, фигуры и оружие собираются в Blender: порядок работы —
[ART_RUNBOOK.md](../ART_RUNBOOK.md).

```
=== ПРЕАМБУЛА TILE (земля, 512×512, бесшовный) ===
Seamless tileable top-down ground texture for a stylized mobile game,
~55-degree top-down angle, flat stylized vector-like illustration, hand-painted
mobile game art, clean flat color fills with no grain and no speckle, no visible
noise, low contrast, soft even lighting from one direction, no shadows cast by
anything, calm and uncluttered. At least 70 percent of the surface must be plain
unbroken ground. Details must be small (5-20 px on a 512 px tile) and scattered
far apart. No large objects, no focal point, no path, no road, no characters, no
text. Edges must tile seamlessly and continuously. 512x512.
NEGATIVE: noise, grain, speckle, dense texture, busy pattern, high contrast,
dark outlines, photorealistic, 3d render, gradient mesh, vignette, drop shadow,
large rocks, trees, path, road, tiled seams, borders, frame, text, watermark.
ЗАДАНИЕ: <строка объекта>
```

---

[← остров 12](12-scheria.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · **последний остров**
