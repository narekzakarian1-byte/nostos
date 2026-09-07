[← остров 9](09-strait.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 11 →](11-ogygia.md)

# ОСТРОВ 10 — ТРИНАКИЯ

> Концепция острова, слоты под картинки и промпты к ним. Общие правила — камера,
> свет, контраст, именование файлов — в [ISLANDS.md §1](../ISLANDS.md#1-общие-правила).
> Числа боя живут в `balance.json` и сюда не переносятся.
>
> **Ассетов на остров: 13.**

---

## 1. КОНЦЕПЦИЯ

**id:** `thrinacia` · **босс:** Бык Гелиоса, слабость **дробящий** ·
**биом:** выжженное золотое пастбище, солнце в зените

> Семь стад по пятьдесят голов, и трогать нельзя ни одну. Твои люди голодны.
> Ты знаешь, чем это кончится, потому что тебе уже сказали.

**Вид.** Золотая сухая солома до горизонта, земля под ней растрескалась
многоугольниками. Ни одного дерева, кроме мёртвой оливы. Тени короткие и жёсткие
— солнце стоит вертикально и не двигается. По пастбищу белоснежные коровы с
золотыми рогами: единственные светлые фигуры на светлой земле, и они держатся
только за счёт чёрной обводки и контактной тени.

Это «сухой» остров, но не второй песчаный: здесь солома, а не песок, вертикали
есть, и пусто не выглядит.

**Палитра**

| Роль | Hex |
|---|---|
| солома | `#C9A94E` |
| солома в тени | `#A2833A` |
| растрескавшаяся земля | `#B0894E` |
| линии трещин | `#6B5A32` |
| белая шкура | `#F2EEE4` |
| солнечное золото | `#E8B23C` |

**Планировка**

```
┌────────────────┬────────────────┬────────────────┐
│ ВЕРХНЕЕ        │ ★ ЖЕРТВЕННИК   │ ПАСТУШЬИ       │
│ ПАСТБИЩЕ       │  С РОГАМИ      │ ХИЖИНЫ         │
│ ▲ Фаэтуса  ◆   │  круг выжженной│ ▲ Лампетия  ◆  │
│                │  земли         │                │
├────────────────┼─══════════════─┼────────────────┤
│ ВЕРТЕЛА        │ КОЛЕЯ И СТАДА  │ ВОДОПОЙ        │
│ ▲ Обугленный   │ • • • •        │ ▲ Пёс Гелиоса  │
│                │                │ ◆              │
├────────────────┼─══════════════─┼────────────────┤
│ МЁРТВАЯ ОЛИВА  │ ◎ ГАЛЕЧНАЯ     │ ЗАГОН          │
│ • •            │   ОТМЕЛЬ       │ ▲ Первотёлок  ◆│
│                │                │ • •            │
└────────────────┴════════════════┴────────────────┘
```

Дорога — пыльная колея, выбитая копытами: две параллельные полосы голой земли,
между ними солома. Единственная дорога в игре из двух полос.

**Пять мини-боссов**

| Имя | Копии | Где |
|---|---|---|
| Бык-первотёлок | дробящий | загон |
| Пёс Гелиоса | дробящий | водопой |
| Фаэтуса, нимфа-пастушка | колющий | верхнее пастбище |
| Лампетия, её сестра | рубящий | пастушьи хижины |
| Обугленный, у вертелов | рубящий | вертела с мясом |

**Объекты**

| Файл | Размер | Что это |
|---|---|---|
| `ground/thrinacia.png` | тайл 512 | сухая солома на растрескавшейся земле |
| `road/thrinacia.png` | тайл 128 | двухполосная колея копыт |
| `borders/thrinacia.png` | 512×256 | сухая каменная межа с черепами быков на кольях |
| `props/horned-altar.png` | в 90 | жертвенник, обложенный бычьими рогами |
| `props/spit-roast.png` | в 80 | вертел с мясом над углями |
| `props/herd-hut.png` | в 100 | пастушья хижина из жердей и шкур |
| `props/bull-skull-pole.png` | в 110 | бычий череп на шесте |
| `props/dead-olive.png` | в 150 | мёртвая олива, ствол расщеплён |
| `props/cracked-ground.png` | ш 130, плоский | пятно растрескавшейся земли |

**Враги — пастухи Гелиоса и его стада**

- **Обычный (36).** Пастух в белом хитоне до колен, лицо закрыто круглой золотой
  маской-диском без черт, в руках — посох. Кожа не видна вовсе: белое и золото.
  Единственная семья врагов в игре, построенная на светлом силуэте, — она держится
  чёрной обводкой и жёсткой контактной тенью, без них её не видно.
- **Элита (48).** Тот же, но маска-диск с лучами, плащ из белой шкуры, на поясе
  бронзовый серп.
- **Мини-босс (68).** Нимфа-пастушка: высокая фигура в белом с золотым поясом,
  диск за головой как нимб, за ней бредёт корова.

**Босс — Бык Гелиоса** (слабость дробящий)

Белоснежный бык размером с дом. Золотые рога, между ними — солнечный диск.
Глаза как угли. Копыта бронзовые, на спине выжжен солнечный знак. Он опустил
голову и роет землю: поза до броска, единственный босс, который выглядит как
разгон. Слабость к дробящему: рог и кость ломают, а не режут.

**Арена.** Круг выжженной дочерна земли вокруг жертвенника с рогами; по краю
стоят коровы и смотрят, не двигаясь. Ни одна из них не убежит за весь бой.

**Трофей на корабль:** золотой рог на форштевень.

---

## 2. АССЕТЫ — СЛОТЫ ПОД КАРТИНКИ

**Куда грузить сгенерированную картинку:** в `islands/uploads/thrinacia/<категория>/`,
с тем же именем файла, что написано в заголовке слота (например
`islands/uploads/thrinacia/props/horned-altar.png`). Категория — часть пути сразу
после `art/` в заголовке слота: `ground`, `road`, `borders`, `props` или
`entities`.

Когда файлы острова лежат в `uploads/thrinacia/`, один раз прогнать:

```
python3 tools/import-island-art.py thrinacia
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

#### [ ] `public/art/ground/thrinacia.png` — сухая солома на растрескавшейся земле · тайл 512

![](../public/art/ground/thrinacia.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
Sun-scorched golden pasture seen from above: flat dry straw-gold grass as a calm
base, large soft patches of lighter and darker straw, very sparse tiny details
only: a few thin polygonal cracks where bare earth shows through, two or three
tiny bleached bone flecks, one small patch of bare dust. No green, no plants, no
rocks.
PALETTE: straw #C9A94E dominant, straw shadow #A2833A, bare earth #B0894E, crack
lines #6B5A32, rare bone fleck #F2EEE4.
```

_Заметки:_

#### [ ] `public/art/road/thrinacia.png` — двухполосная колея копыт · тайл 128

![](../public/art/road/thrinacia.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
A two-track cattle road: two parallel bands of bare dusty earth beaten smooth by
hooves with dry straw grass left standing between them, scattered hoof prints and
a few dry dung pats, tiles seamlessly along the long axis, 128x128.
PALETTE: dust #B0894E / #8A6A38, straw #C9A94E, hoof shadow #6B5A32.
```

_Заметки:_

#### [ ] `public/art/borders/thrinacia.png` — сухая каменная межа с черепами быков на кольях · 512×256

![](../public/art/borders/thrinacia.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
Horizontal repeating border strip: a low dry-stone field boundary of pale sun
bleached stones with dry straw grass growing through it, and two weathered wooden
poles carrying bull skulls rising above it. Isolated strip on flat #00FF00, no
ground beneath, tileable left-to-right, ~55-degree top-down, one hard light from
the right, no shadow drawn, 512x256.
PALETTE: stone #C9C3AE / #A2833A, straw #C9A94E, skull #F2EEE4, pole #9C7B4A.
```

_Заметки:_

### 2.2 Пропы

#### [ ] `public/art/props/horned-altar.png` — жертвенник, обложенный бычьими рогами · в 90

![](../public/art/props/horned-altar.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A stone sacrificial altar faced with real bull horns pressed into the masonry, a
scorched hollow on its top surface with grey ash, dark stains running down one
side, a bronze bowl on the ground beside it.
PALETTE: stone #C9C3AE / #A2833A / #6B5A32, horn #F2EEE4, ash #8A8578, bronze
#B87333.
```

_Заметки:_

#### [ ] `public/art/props/spit-roast.png` — вертел с мясом над углями · в 80

![](../public/art/props/spit-roast.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A roasting spit: two forked wooden uprights holding a long bronze skewer with a
side of meat on it over a bed of embers, fat dripping and flaring, a stack of
firewood beside it.
PALETTE: wood #9C7B4A / #68482E, bronze #B87333, meat #8A4A38, embers #E87C2E /
#FABA50.
```

_Заметки:_

#### [ ] `public/art/props/herd-hut.png` — пастушья хижина из жердей и шкур · в 100

![](../public/art/props/herd-hut.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A herdsman's hut: a simple lean-to of poles roofed with stretched cow hides, a
water jar and a coiled rope by the entrance, a milking stool tipped over.
PALETTE: poles #9C7B4A, hide roof #F2EEE4 with brown patches #8A6A38, clay jar
#C6743E, rope #C9C3AE.
```

_Заметки:_

#### [ ] `public/art/props/bull-skull-pole.png` — бычий череп на шесте · в 110

![](../public/art/props/bull-skull-pole.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A tall weathered pole planted in dry earth with a large horned bull skull mounted
on top facing forward, faded ribbons tied under the skull, the pole leaning
slightly. Taller than a man, very thin.
PALETTE: skull #F2EEE4 / #C9C3AE, horn #E8B23C, pole #9C7B4A, ribbon #A2833A.
```

_Заметки:_

#### [ ] `public/art/props/dead-olive.png` — мёртвая олива, ствол расщеплён · в 150

![](../public/art/props/dead-olive.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A dead olive tree: a thick hollow split trunk with no leaves, twisted bare
branches, the bark peeled away in strips showing pale wood, roots gripping cracked
earth. Tall and gnarled.
PALETTE: pale dead wood #C9C3AE / #A2833A, deep hollow #4A3B2C, cracked earth
#B0894E.
```

_Заметки:_

#### [ ] `public/art/props/cracked-ground.png` — пятно растрескавшейся земли · ш 130, плоский

![](../public/art/props/cracked-ground.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A patch of sun-baked cracked earth seen from directly above, lying completely FLAT
on the ground: polygonal plates of dried mud separated by dark cracks, edges
curling up slightly, a little loose dust. No height, no objects.
PALETTE: earth #B0894E / #8A6A38, cracks #6B5A32, dust #C9A94E.
```

_Заметки:_

### 2.3 Враги и босс

#### [ ] `public/art/entities/thrinacia-normal.png` — обычный враг

![](../public/art/entities/thrinacia-normal.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A herdsman of Helios: a figure in a knee-length white tunic, face completely
hidden behind a round featureless golden sun-disc mask, a long staff in hand, bare
feet, no skin visible anywhere. Bright figure — it must rely on a strong closed
black outline to stay readable against pale ground.
PALETTE: white tunic #F2EEE4, gold mask #E8B23C
#080D14, straw ochre trim #A2833A.
```

_Заметки:_

#### [ ] `public/art/entities/thrinacia-elite.png` — элита

![](../public/art/entities/thrinacia-elite.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Same Helios herdsman family, one rank up: the sun-disc mask now has radiating
rays, a white hide cloak over the shoulders, a bronze sickle at the belt, larger
and broader.
PALETTE: as above plus bronze #B87333.
```

_Заметки:_

#### [ ] `public/art/entities/thrinacia-miniboss.png` — мини-босс

![](../public/art/entities/thrinacia-miniboss.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Same family, a nymph herdswoman: a tall figure in a long white robe with a golden
belt, a large golden disc standing behind her head like a halo, a white cow
following at her shoulder. Twice the size of the base figure.
PALETTE: as above plus cow hide #F2EEE4.
```

_Заметки:_

#### [ ] `public/art/entities/boss-thrinacia.png` — БОСС

![](../public/art/entities/boss-thrinacia.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Boss character: the Bull of Helios. A snow-white bull the size of a house, head
lowered and one hoof scraping the ground in the instant before a charge. Golden
horns with a small sun disc mounted between them, bronze hooves, eyes like burning
coals, a sun symbol branded into the shoulder. Massive neck and shoulders, steam
from the nostrils.
PALETTE: white hide #F2EEE4, gold horn and disc #E8B23C, bronze hoof #B87333,
ember eyes #C4342B.
```

_Заметки:_

---

## 3. РЕФЕРЕНСЫ

Сюда — всё, от чего отталкиваемся: скриншоты игр, фотографии мест, керамика,
наброски. Файлы класть в `islands/ref/thrinacia/`, вставлять строкой
`![подпись](ref/thrinacia/имя.png)`.

<!-- ![](ref/thrinacia/имя.png) -->

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

[← остров 9](09-strait.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 11 →](11-ogygia.md)
