[← остров 11](11-ogygia.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 13 →](13-ithaca.md)

# ОСТРОВ 12 — СХЕРИЯ

> Концепция острова, слоты под картинки и промпты к ним. Общие правила — камера,
> свет, контраст, именование файлов — в [ISLANDS.md §1](../ISLANDS.md#1-общие-правила).
> Числа боя живут в `balance.json` и сюда не переносятся.
>
> **Ассетов на остров: 13.**

---

## 1. КОНЦЕПЦИЯ

**id:** `scheria` · **босс:** Страж феаков, слабость **дробящий** ·
**биом:** возделанный сад и мраморный порт

> Первый живой город за всю дорогу. Всё чисто, богато, гостеприимно — и тебя
> всё равно сначала проверят на прочность.

**Вид.** Единственный остров, где есть цивилизация в рабочем состоянии. Внизу —
порт: длинные корабли с синими носами лежат на катках и сохнут. Выше — сад
Алкиноя: четыре ровных ряда деревьев (груша, гранат, яблоня, смоква) и
виноградник с прессом, всё плодоносит одновременно, потому что здесь никогда не
кончается урожай (канон Од. VII). Наверху — мраморная стена и ворота города, за
ними двор с золотыми юношами-светильниками.

Здесь кульминация дорожного ассета: настоящая городская улица с бордюром и
водостоком, а не тропа. Дорога впервые выглядит построенной.

**Палитра**

| Роль | Hex |
|---|---|
| садовая трава | `#4C8A46` |
| мрамор | `#DCD8CC` |
| мрамор в тени | `#B3B0A5` |
| синь феаков | `#2B5F8C` |
| бронза | `#B87333` |
| плод | `#D9762B` |

**Планировка**

```
┌────────────────┬────────────────┬────────────────┐
│ САД В ЧЕТЫРЕ   │ ★ ДВОР         │ ДВА ИСТОЧНИКА  │
│ РЯДА           │  АЛКИНОЯ       │ фонтаны        │
│ ▲ Смотритель ◆ │  золотые юноши │ ▲ Лаодамант  ◆ │
├────────────────┼─══════════════─┼────────────────┤
│ ПАЛЕСТРА       │ ГОРОДСКАЯ      │ ВОРОТА ГОРОДА  │
│ стадион, диски │ УЛИЦА          │ ▲ Копейщик     │
│ ▲ Эвриал  ◆    │ • • • •        │ ◆              │
├────────────────┼─══════════════─┼────────────────┤
│ КОРАБЛИ НА     │ ◎ ПРИЧАЛ       │ ПРЕСС И АМБАРЫ │
│ КАТКАХ         │                │ ▲ Понтоной  ◆  │
│ • •            │                │ • •            │
└────────────────┴════════════════┴────────────────┘
```

**Пять мини-боссов** — атлеты и стража, а не монстры. Освежает после десяти
островов чудовищ и делает финал ближе: на Итаке драться придётся с людьми.

| Имя | Копии | Где |
|---|---|---|
| Эвриал Дискобол | дробящий | палестра |
| Лаодамант, сын царя | дробящий | у источников |
| Копейщик стражи | колющий | ворота города |
| Смотритель садов | колющий | сад |
| Понтоной Глашатай | рубящий | пресс и амбары |

Эвриал — канон: именно он оскорбил Одиссея на играх, и тот в ответ метнул диск
дальше всех. Диск как оружие дробящего типа — прямое следствие.

**Объекты**

| Файл | Размер | Что это |
|---|---|---|
| `ground/scheria.png` | тайл 512 | подстриженная садовая трава с опавшим плодом |
| `road/scheria.png` | тайл 128 | городская мостовая с бордюром |
| `borders/scheria.png` | 512×256 | мраморная городская стена с зубцами |
| `props/city-gate.png` | в 220 | городские ворота, створки открыты |
| `props/ship-rollers.png` | ш 240 | длинный корабль с синим носом на катках |
| `props/fruit-tree-row.png` | в 160 | плодовое дерево, ветви подвязаны |
| `props/fountain-basin.png` | в 60 | фонтан-чаша с проточной водой |
| `props/golden-youth-lamp.png` | в 130 | золотой юноша со светильником в руке |
| `props/grape-press.png` | ш 90 | виноградный пресс с чанами |

**Враги — феаки: стража и атлеты**

- **Обычный (36).** Атлет: короткий синий плащ через плечо, обнажённый торс,
  повязка на голове, в руках ничего — оружием служит то, что под рукой (весло,
  диск, шест). Первые враги, которые выглядят как люди на празднике, а не как
  войско.
- **Элита (48).** Стражник: лёгкая бронза, синий плащ до колен, круглый щит с
  корабельным носом на нём.
- **Мини-босс (68).** Чемпион: венок, бронзовые наручи, плащ с золотой каймой,
  на плече весло — у феаков весло почётнее копья.

**Босс — Страж феаков** (слабость дробящий)

Бронзовый колосс, стоявший в порту и оживший: пустой доспех в три человеческих
роста, внутри которого виден огонь — он просвечивает сквозь швы. В руках весло
размером с мачту вместо палицы. Лицо — гладкая бронзовая маска без черт, как у
корабельных носов феаков. Слабость к дробящему: бронзу мнут, а не режут.

**Арена.** Двор Алкиноя: круг мраморных плит, по краю золотые юноши со
светильниками, за ними — вход в дом с бронзовым порогом.

**Трофей на корабль:** бронзовая ладонь колосса на борт.

---

## 2. АССЕТЫ — СЛОТЫ ПОД КАРТИНКИ

**Куда грузить сгенерированную картинку:** в `islands/uploads/scheria/<категория>/`,
с тем же именем файла, что написано в заголовке слота (например
`islands/uploads/scheria/props/city-gate.png`). Категория — часть пути сразу
после `art/` в заголовке слота: `ground`, `road`, `borders`, `props` или
`entities`.

Когда файлы острова лежат в `uploads/scheria/`, один раз прогнать:

```
python3 tools/import-island-art.py scheria
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

#### [ ] `public/art/ground/scheria.png` — подстриженная садовая трава с опавшим плодом · тайл 512

![](../public/art/ground/scheria.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
Cultivated orchard ground seen from above: flat well-kept mown green grass as a
calm base, large soft patches of shade, very sparse tiny details only: a few small
fallen fruits, two or three tiny pale gravel patches, one thin irrigation
channel. Tidy and cared for, no weeds, no bare earth.
PALETTE: orchard grass #4C8A46 dominant, shade #35633A, light green #63A055,
fallen fruit #D9762B, pale gravel #DCD8CC.
```

_Заметки:_

#### [ ] `public/art/road/scheria.png` — городская мостовая с бордюром · тайл 128

![](../public/art/road/scheria.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
A proper paved city street: fitted rectangular stone slabs laid in a regular
pattern with tight mortar joints, a raised kerb stone along one edge and a shallow
drainage channel along the other, worn smooth in the middle, tiles seamlessly
along the long axis, 128x128.
PALETTE: paving #DCD8CC / #B3B0A5, kerb #C9C3AE, joints #6E6A63, damp channel
#8B97B4.
```

_Заметки:_

#### [ ] `public/art/borders/scheria.png` — мраморная городская стена с зубцами · 512×256

![](../public/art/borders/scheria.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
Horizontal repeating border strip: a dressed marble city wall with square
crenellations along the top, fitted ashlar blocks, a painted blue band running
below the battlements, a bronze ring fitting at intervals. Isolated strip on flat
#00FF00, no ground beneath, tileable left-to-right, ~55-degree top-down, one hard
light from the right, no shadow drawn, 512x256.
PALETTE: marble #DCD8CC / #B3B0A5 / #8B97B4, blue band #2B5F8C, bronze #B87333.
```

_Заметки:_

### 2.2 Пропы

#### [ ] `public/art/props/city-gate.png` — городские ворота, створки открыты · в 220

![](../public/art/props/city-gate.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
A monumental city gate: two square marble towers flanking a wide opening, heavy
bronze-bound timber doors standing open, a carved ship prow relief above the
lintel, a hanging bronze lamp. Very tall, a person walks under it.
PALETTE: marble #DCD8CC / #B3B0A5 / #616D8A, timber #68482E, bronze #B87333, blue
relief paint #2B5F8C.
```

_Заметки:_

#### [ ] `public/art/props/ship-rollers.png` — длинный корабль с синим носом на катках · ш 240

![](../public/art/props/ship-rollers.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
A long Phaeacian galley hauled up on wooden rollers to dry: sleek dark hull with a
BLUE painted prow and a painted eye, oars stacked inside, mast unstepped and lying
along the deck, ropes coiled on the sand. Much longer than tall.
PALETTE: hull #4A3B2C / #68482E, blue prow #2B5F8C, painted eye #DCD8CC with
#C4342B, rope #C9C3AE, bronze fittings #B87333.
```

_Заметки:_

#### [ ] `public/art/props/fruit-tree-row.png` — плодовое дерево, ветви подвязаны · в 160

![](../public/art/props/fruit-tree-row.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
A cultivated fruit tree from an orchard row: a neatly pruned trunk, a rounded
canopy heavy with ripe pears and pomegranates at the same time, two branches
propped up with forked poles, a low stone ring around the base.
PALETTE: canopy #4C8A46 / #35633A, fruit #D9762B and #C4342B, bark #68482E, stone
ring #C9C3AE.
```

_Заметки:_

#### [ ] `public/art/props/fountain-basin.png` — фонтан-чаша с проточной водой · в 60

![](../public/art/props/fountain-basin.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
A public fountain: a round marble basin on a low pedestal with a bronze lion-head
spout pouring a clear stream into it, water brimming over one edge, a clay jug
standing on the rim.
PALETTE: marble #DCD8CC / #B3B0A5, bronze spout #B87333, water #6FBFA8, clay
#C6743E.
```

_Заметки:_

#### [ ] `public/art/props/golden-youth-lamp.png` — золотой юноша со светильником в руке · в 130

![](../public/art/props/golden-youth-lamp.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
A golden statue of a youth standing on a plinth, holding a burning torch high in
one hand to light a hall — a lamp stand in human form, polished gold, stylized
archaic pose with one foot forward.
PALETTE: gold #E8B23C / #B87333 / #8A5526, flame #FABA50 / #E87C2E, marble plinth
#DCD8CC.
```

_Заметки:_

#### [ ] `public/art/props/grape-press.png` — виноградный пресс с чанами · ш 90

![](../public/art/props/grape-press.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
A grape press: a stone treading floor with a spout draining into a large clay
vat, a wooden screw beam above it, baskets of dark grapes stacked beside, spilled
juice staining the stone.
PALETTE: stone #DCD8CC / #B3B0A5, timber #68482E, clay vat #C6743E, grapes
#5B3A5E, juice stain #5B2A3A.
```

_Заметки:_

### 2.3 Враги и босс

#### [ ] `public/art/entities/scheria-normal.png` — обычный враг

![](../public/art/entities/scheria-normal.png)

<sub>перед промптом — ПРЕАМБУЛА CHAR из §5</sub>

```
A Phaeacian athlete: bare-chested, a short blue cloak pinned over one shoulder, a
headband, a belt, sandals — a man at a festival rather than a soldier. Athletic
build, confident stance, hands empty.
PALETTE: near-black body #080D14, Phaeacian blue #2B5F8C, cream skin highlight
#E8DCC8, bronze pin #B87333, white headband #DCD8CC.
```

_Заметки:_

#### [ ] `public/art/entities/scheria-elite.png` — элита

![](../public/art/entities/scheria-elite.png)

<sub>перед промптом — ПРЕАМБУЛА CHAR из §5</sub>

```
Same Phaeacian family, one rank up: a city guard in light bronze cuirass and
greaves, a knee-length blue cloak, a round shield on the back with a ship's prow
device painted on it, heavier build.
PALETTE: as above plus bronze #B87333 and shield device #DCD8CC.
```

_Заметки:_

#### [ ] `public/art/entities/scheria-miniboss.png` — мини-босс

![](../public/art/entities/scheria-miniboss.png)

<sub>перед промптом — ПРЕАМБУЛА CHAR из §5</sub>

```
Same family, a champion of the games: an olive wreath, bronze forearm guards, a
cloak with a gold border, a long ship's oar carried across one shoulder like a
badge of rank. Twice the size of the base athlete.
PALETTE: as above plus gold border #E8B23C and oar timber #9C7B4A.
```

_Заметки:_

#### [ ] `public/art/entities/boss-scheria.png` — БОСС

![](../public/art/entities/boss-scheria.png)

<sub>перед промптом — ПРЕАМБУЛА CHAR из §5</sub>

```
Boss character: the Warden of the Phaeacians. A bronze colossus three men tall
that once stood in the harbour and has now stepped down: an empty suit of archaic
bronze plate with FIRE visible glowing through the seams between the plates. Its
face is a smooth featureless bronze mask shaped like a ship's prow. It carries a
ship's oar the size of a mast as a club. Heavy stance, one arm drawn back.
PALETTE: bronze #B87333 / #8A5526 / #E8B23C highlight, inner fire #E87C2E, blue
inlay #2B5F8C, near-black outline #080D14. Max 6 colors.
```

_Заметки:_

---

## 3. РЕФЕРЕНСЫ

Сюда — всё, от чего отталкиваемся: скриншоты игр, фотографии мест, керамика,
наброски. Файлы класть в `islands/ref/scheria/`, вставлять строкой
`![подпись](ref/scheria/имя.png)`.

<!-- ![](ref/scheria/имя.png) -->

---

## 4. ЗАМЕТКИ И РЕШЕНИЯ

Что поменяли против концепции и почему; что не сработало у генератора, чтобы не
наступить второй раз.

| Дата | Что решили | Почему |
|---|---|---|
|  |  |  |

---

## 5. ПРЕАМБУЛЫ

Копия из [ISLANDS.md §1.4](../ISLANDS.md#14-три-преамбулы-промптов) — источник
истины там, здесь для того, чтобы собирать промпт не выходя из файла.

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

```
=== ПРЕАМБУЛА PROP (объект мира, 1024×1024) ===
Top-down mobile game prop, single isolated object.
CAMERA: fixed 55-degree top-down three-quarter view, as in a mobile action RPG.
The viewer looks DOWN at the object from above and slightly in front; top faces
are clearly visible. Orthographic projection, no lens perspective, no vanishing
point, no wide-angle distortion, no eye-level view.
LIGHT: exactly one hard light source from the RIGHT and slightly toward the
viewer. Lit faces point right and down-screen, shaded faces point left and
up-screen. Consistent across every surface.
NO SHADOW: do not draw any shadow on the ground. No drop shadow, no contact
shadow, no cast shadow, no dark ellipse, no blur under the object. Nothing
beneath it at all. Shading ON the object itself is fine.
BACKGROUND: completely flat uniform pure chroma green #00FF00, edge to edge. No
gradient, no texture, no ground, no grass, no horizon, no scenery. Absolutely no
green of any kind anywhere on the object itself.
OUTLINE: a clean, closed, continuous near-black outline #080D14, 6-8 px thick,
tracing the entire outer silhouette where it meets the background, including
inner openings. No fuzzy edges, no glow, no feathering.
STYLE: flat stylized vector illustration, bold clean shapes, hard-edged flat
color fills, 3-4 tones per material (light / mid / dark). No gradients, no
airbrush, no photorealism, no 3D render, no ambient occlusion, no specular
highlights, no noise texture.
FRAMING: object centered horizontally, filling ~90% of the frame. Its base sits
exactly on the bottom edge of the image, no empty margin below the base.
Square image 1024x1024. No text, no watermark, no logo, no UI, no border frame.
ЗАДАНИЕ: <строка объекта> · PALETTE: <палитра острова>
```

```
=== ПРЕАМБУЛА CHAR (фигура, 512×512) ===
Top-down mobile game character sprite, single figure, centered.
CAMERA / LIGHT / NO SHADOW / BACKGROUND / OUTLINE / STYLE: identical to the PROP
preamble above (55-degree top-down three-quarter, one hard light from the right
and slightly toward the viewer, no shadow drawn, flat #00FF00 background, closed
#080D14 outline, flat vector fills).
POSE: standing, weight forward, aggressive readable stance, seen from above and
slightly in front — head, shoulders and both feet clearly visible.
FRAMING: the figure fills ~85% of a SQUARE frame, feet touching the bottom edge,
centered horizontally.
HANDS EMPTY: no weapon in the hands — the weapon is a separate overlay drawn by
the engine. Sheathed weapons, quivers and shields on the back are fine.
COLOR LIMIT: no more than 6 colors total. The silhouette must stay recognizable
when filled with solid black.
512x512.
ЗАДАНИЕ: <строка объекта> · PALETTE: <палитра острова>
```

---

[← остров 11](11-ogygia.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 13 →](13-ithaca.md)
