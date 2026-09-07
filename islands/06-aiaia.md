[← остров 5](05-telepylos.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 7 →](07-hades.md)

# ОСТРОВ 6 — ЭЕЯ

> Концепция острова, слоты под картинки и промпты к ним. Общие правила — камера,
> свет, контраст, именование файлов — в [ISLANDS.md §1](../ISLANDS.md#1-общие-правила).
> Числа боя живут в `balance.json` и сюда не переносятся.
>
> **Ассетов на остров: 13.**

---

## 1. КОНЦЕПЦИЯ

**id:** `aiaia` · **босс:** Цирцея, слабость **рубящий** ·
**биом:** густой дубово-лавровый лес, поляны, дым очага

> Лес, который на тебя смотрит. Волки у дома не рычат — они виляют хвостом, и
> это страшнее.

**Вид.** Тёмная чаща по периметру каждой зоны и светлые поляны в середине: бой
всегда происходит на открытом, деревья работают стенами. Над всем — столб дыма
от очага Цирцеи, видный с любой точки карты, единственный ориентир. По тропе —
плитняк, заросший мхом. У дома бродят ручные волки и львы (канон Од. X), они не
нападают, и от этого хуже.

**Правило по лесу:** кроны никогда не перекрывают узел. Деревья стоят кольцом по
краю зоны, внутри — трава. Иначе три иконки над врагом уходят под листву, а это
запрещено (CLAUDE.md §6).

**Палитра**

| Роль | Hex |
|---|---|
| поляна на свету | `#4E7440` |
| трава в тени | `#33532F` |
| листовой опад | `#7A6438` |
| лавр тёмный | `#2F5137` |
| кора | `#4A3B2C` |
| дым очага | `#C8C2B4` |
| колдовской пурпур | `#7A4B8C` |

Пурпур — второй и последний «новый» цвет игры после розового лотоса. Он
появляется только там, где работает магия Цирцеи: чаша, жезл, дым.

**Планировка**

```
┌────────────────┬────────────────┬────────────────┐
│ ТКАЦКИЙ НАВЕС  │ ★ ДВОР ДОМА    │ КРЫЛЬЦО ДОМА   │
│ станок, нити   │  ЦИРЦЕИ        │ ручной лев     │
│ ▲ Ткачиха  ◆   │  дым из очага  │ ▲ Лев дома     │
│                │                │ ◆              │
├────────────────┼─══════════════─┼────────────────┤
│ СВИНОЙ ЗАГОН   │ ПОЛЯНА С КОТЛОМ│ РУЧЕЙ          │
│ ▲ Вепрь        │ плитняк во мху │ ▲ Олень-рогач  │
│ Эврилоха  ◆    │ • • • •        │ ◆              │
├────────────────┼─══════════════─┼────────────────┤
│ ОПУШКА         │ ◎ БУХТА        │ БУРЕЛОМ        │
│ ▲ Волк-вожак   │   песчаная     │ • •            │
│ • •            │                │                │
└────────────────┴════════════════┴────────────────┘
```

**Пять мини-боссов** — все они бывшие моряки, каждый обращён в свою тварь

| Имя | Копии | Где |
|---|---|---|
| Вепрь Эврилоха | рубящий | свиной загон |
| Волк-вожак | рубящий | опушка |
| Олень-рогач | колющий | ручей |
| Ткачиха-служанка | колющий | ткацкий навес |
| Лев дома | дробящий | крыльцо |

**Объекты**

| Файл | Размер | Что это |
|---|---|---|
| `ground/aiaia.png` | тайл 512 | лесная поляна: мох, опад, редкие корни |
| `road/aiaia.png` | тайл 128 | плитняк, заросший мхом |
| `borders/aiaia.png` | 512×256 | стена подлеска: сплошная тёмная масса ветвей |
| `props/oak-tall.png` | в 190 | старый дуб, крона куполом |
| `props/laurel-bush.png` | в 55 | лавровый куст |
| `props/circe-hall.png` | в 200 | каменный дом Цирцеи, дым, ландмарк арены |
| `props/loom-shelter.png` | в 100 | ткацкий станок под навесом, натянутая основа |
| `props/pig-pen.png` | в 60 | плетёный загон, корыто |
| `props/cauldron.png` | в 50 | котёл на треноге, пурпурный пар |

**Враги — зверолюди, обращённые моряки**

Лучший костюмный набор игры: человеческое тело в моряцких лохмотьях, голова
зверя. Тип удара читается прямо по голове, и это единственный остров, где
силуэт подсказывает то же, что и три иконки.

- **Обычный (36).** Матросские лохмотья, верёвочный пояс, босые ноги, голова —
  кабанья, волчья или львиная. Руки ещё человеческие, и это самая неприятная
  деталь.
- **Элита (48).** Полуобращённый: на нём ещё бронза с корабля, но плечи уже
  заросли щетиной, ноги поджаты по-звериному.
- **Мини-босс (68).** Обращён целиком: зверь, вставший на задние лапы, с
  остатками человеческой одежды на плечах.

**Босс — Цирцея** (слабость рубящий)

Не чудовище. Высокая женщина в длинном платье цвета тёмного вина, волосы —
сплошная чёрная масса до пояса, в одной руке чаша, в другой жезл. Вокруг неё
вьётся пурпурный дым, принимающий формы зверей — волка, вепря, льва. Она не
бьёт руками; её удар — вспышка пурпура, и партиклы боя на этой арене
перекрашиваются в `#7A4B8C`.

Слабость к рубящему прямо из поэмы: Гермес велит обнажить меч и броситься на
неё, и тогда чары не берут. Это тот случай, когда канон и механика совпали сами
собой, и на экране гейта это надо подчеркнуть — игрок узнаёт сюжет через свою
же таблицу урона.

**Арена.** Двор перед домом: круг утоптанной земли, очаг с котлом, вдоль стен
лежат ручные волки и львы и смотрят, не вставая.

**Трофей на корабль:** жезл Цирцеи на мачте.

---

## 2. АССЕТЫ — СЛОТЫ ПОД КАРТИНКИ

**Куда грузить сгенерированную картинку:** в `islands/uploads/aiaia/<категория>/`,
с тем же именем файла, что написано в заголовке слота (например
`islands/uploads/aiaia/props/oak-tall.png`). Категория — часть пути сразу
после `art/` в заголовке слота: `ground`, `road`, `borders`, `props` или
`entities`.

Когда файлы острова лежат в `uploads/aiaia/`, один раз прогнать:

```
python3 tools/import-island-art.py aiaia
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

#### [ ] `public/art/ground/aiaia.png` — лесная поляна: мох, опад, редкие корни · тайл 512

![](../public/art/ground/aiaia.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
Sunlit forest glade floor seen from above: flat mid-green moss and short grass as
a calm base, large soft patches of shade, very sparse tiny details only: a few
small fallen ochre leaves, one or two thin exposed roots, a couple of tiny
mushrooms. No trees, no bushes, no logs, no flowers.
PALETTE: glade green #4E7440 dominant, shade #33532F, leaf litter #7A6438, dark
laurel accent #2F5137, rare pale stone #C9C3AE.
```

_Заметки:_

#### [ ] `public/art/road/aiaia.png` — плитняк, заросший мхом · тайл 128

![](../public/art/road/aiaia.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
A path of flat irregular flagstones sunk into forest soil, moss growing thickly
in every joint, a few stones tilted or missing with bare earth showing, tiles
seamlessly along the long axis, 128x128.
PALETTE: stone #8B97B4 / #6C7899, moss #4E7440 / #33532F, soil #4A3B2C.
```

_Заметки:_

#### [ ] `public/art/borders/aiaia.png` — стена подлеска: сплошная тёмная масса ветвей · 512×256

![](../public/art/borders/aiaia.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
Horizontal repeating border strip: an impenetrable wall of dark forest
undergrowth — dense overlapping laurel and oak branches, deep black gaps between
the leaves, a few pale trunks behind, low bramble at the base. Reads as a solid
dark mass, not as individual plants. Isolated strip on flat #00FF00, no ground
beneath, tileable left-to-right, ~55-degree top-down, one hard light from the
right, no shadow drawn, 512x256.
PALETTE: laurel #2F5137 / #1E3826, lit leaf #4E7440, bark #4A3B2C.
```

_Заметки:_

### 2.2 Пропы

#### [ ] `public/art/props/oak-tall.png` — старый дуб, крона куполом · в 190

![](../public/art/props/oak-tall.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A single old oak tree seen from above and slightly in front: thick gnarled trunk,
heavy dome-shaped canopy of chunky flat leaf clusters, two lower branches
reaching sideways, exposed roots at the base. Tall — four times a man's height.
PALETTE: canopy #4E7440 / #33532F / #2F5137, bark #4A3B2C / #68482E, cream rim
light #E8DCC8 on the upper right of the canopy.
```

_Заметки:_

#### [ ] `public/art/props/laurel-bush.png` — лавровый куст · в 55

![](../public/art/props/laurel-bush.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A rounded laurel bush with dense glossy pointed leaves, chest-high to a man, a
few dark berries, one broken branch.
PALETTE: leaf #2F5137 / #4E7440, berry #1E3826, bark #4A3B2C.
```

_Заметки:_

#### [ ] `public/art/props/circe-hall.png` — каменный дом Цирцеи, дым, ландмарк арены · в 200

![](../public/art/props/circe-hall.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Circe's hall: a low wide house of dressed stone in a forest clearing, a colonnaded
porch of four short columns, a heavy dark doorway, smoke rising from a roof vent,
carved animal heads on the lintel, ivy on one wall. Monumental landmark, wider
than tall.
PALETTE: stone #B4BCC9 / #8B97AE / #616D8A, roof timber #4A3B2C, ivy #33532F,
smoke #C8C2B4, doorway darkness #080D14, faint purple glow #7A4B8C inside.
```

_Заметки:_

#### [ ] `public/art/props/loom-shelter.png` — ткацкий станок под навесом, натянутая основа · в 100

![](../public/art/props/loom-shelter.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
An upright warp-weighted loom under a simple timber shelter: vertical threads
hanging taut with clay loom weights at the bottom, a half-finished patterned cloth
on the frame, a stool beside it.
PALETTE: timber #68482E / #4A3B2C, threads #E8DCC8, cloth pattern #7A4B8C and
#C4342B, clay weights #C6743E.
```

_Заметки:_

#### [ ] `public/art/props/pig-pen.png` — плетёный загон, корыто · в 60

![](../public/art/props/pig-pen.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A wicker pig pen: a low woven fence enclosure with a gate, a wooden trough inside,
churned muddy ground, straw scattered.
PALETTE: wicker #9C7B4A / #68482E, trough wood #4A3B2C, mud #5A4A34, straw
#C9A94E.
```

_Заметки:_

#### [ ] `public/art/props/cauldron.png` — котёл на треноге, пурпурный пар · в 50

![](../public/art/props/cauldron.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A bronze cauldron on an iron tripod over embers, dark liquid inside, thick purple
vapour curling from it, a long ladle hooked on the rim.
PALETTE: bronze #B87333 / #8A5526, iron #3E434C, embers #E87C2E, vapour #7A4B8C.
```

_Заметки:_

### 2.3 Враги и босс

#### [ ] `public/art/entities/aiaia-normal.png` — обычный враг

![](../public/art/entities/aiaia-normal.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A transformed sailor: a human body in torn sailor's rags with a rope belt,
barefoot, but with the head of a BOAR — tusks, small eyes, bristled snout. The
hands are still human, which is the most unsettling detail. Hunched, aggressive.
PALETTE: near-black body #080D14, rags #C9C3AE, boar hide #4A3B2C, tusks #E8DCC8,
faint purple taint #7A4B8C at the neck.
```

_Заметки:_

#### [ ] `public/art/entities/aiaia-elite.png` — элита

![](../public/art/entities/aiaia-elite.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Same transformed-sailor family, one rank up, half-turned: still wearing bronze
armour from the ship, but shoulders already covered in coarse fur, legs bent into
animal hocks, head of a WOLF. Larger and broader.
PALETTE: as above plus bronze #D9762B and wolf grey #6C7899.
```

_Заметки:_

#### [ ] `public/art/entities/aiaia-miniboss.png` — мини-босс

![](../public/art/entities/aiaia-miniboss.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Same family, fully transformed: a great beast reared up on its hind legs — a LION
— with the remains of a sailor's cloak and a bronze pectoral still hanging from
its shoulders, mane heavy, twice the size of the base figure.
PALETTE: as above plus mane #A8843F.
```

_Заметки:_

#### [ ] `public/art/entities/boss-aiaia.png` — БОСС

![](../public/art/entities/boss-aiaia.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Boss character: Circe. Not a monster — a tall woman in a floor-length dark wine
coloured gown, her hair one solid black mass falling to the waist, a shallow cup
raised in one hand and a slender wand in the other. Purple smoke coils around her
and takes the shapes of a wolf, a boar and a lion in the air behind her. Calm,
upright, unhurried — dangerous by stillness, not by pose.
PALETTE: near-black #080D14, wine gown #5B2A3A, sorcery purple #7A4B8C, bronze
cup #B87333, cream skin highlight #E8DCC8.
```

_Заметки:_

---

## 3. РЕФЕРЕНСЫ

Сюда — всё, от чего отталкиваемся: скриншоты игр, фотографии мест, керамика,
наброски. Файлы класть в `islands/ref/aiaia/`, вставлять строкой
`![подпись](ref/aiaia/имя.png)`.

<!-- ![](ref/aiaia/имя.png) -->

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

[← остров 5](05-telepylos.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 7 →](07-hades.md)
