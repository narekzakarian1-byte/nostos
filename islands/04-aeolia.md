[← остров 3](03-cyclops.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 5 →](05-telepylos.md)

# ОСТРОВ 4 — ОСТРОВ ЭОЛА

> Концепция острова, слоты под картинки и промпты к ним. Общие правила — камера,
> свет, контраст, именование файлов — в [ISLANDS.md §1](../ISLANDS.md#1-общие-правила).
> Числа боя живут в `balance.json` и сюда не переносятся.
>
> **Ассетов на остров: 12.**

---

## 1. КОНЦЕПЦИЯ

**id:** `aeolia` · **босс:** Хранитель ветров, слабость **колющий** ·
**биом:** голая скала над облаками, медь, иней

> Остров, который висит. Кругом только ветер, и он держит тебя за плечи.

**Вид.** Ни травы, ни дерева — отполированный ветром камень, исчерченный
параллельными бороздами. По краю карты идёт **медная стена**, отполированная до
блеска: у Гомера остров обнесён «нерушимой медной стеной», и это лучшая граница
во всей игре — она объясняет, почему нельзя выйти, самим своим видом. За стеной
белый провал облаков. Везде шесты с лентами: ветер — главный визуальный мотив,
и он должен читаться в статике, по наклону лент и борозд, одинаковому на всей
карте. В тени и на северной стороне — иней.

**Палитра**

| Роль | Hex |
|---|---|
| камень | `#6E7A8C` |
| камень на свету | `#93A0B0` |
| камень в тени | `#4A5568` |
| медь | `#B87333` |
| патина | `#4E8C7A` |
| иней | `#CFE0EA` |
| провал облаков | `#0F1B2E` |

**Планировка**

```
┌────────────────┬────────────────┬────────────────┐
│ СЕВЕРНАЯ       │ ★ РОЗА ВЕТРОВ  │ ВОСТОЧНАЯ      │
│ ЖАРОВНЯ        │  круглая       │ ЖАРОВНЯ        │
│ ▲ Борей  ◆     │  площадка,     │ ▲ Эвр          │
│ иней на камне  │  четыре огня   │ • •            │
├────────────────┼─══════════════─┼────────────────┤
│ ВЕТРЯНЫЕ АРФЫ  │ ГАЛЕРЕЯ ПЛИТ   │ ЮЖНАЯ ЖАРОВНЯ  │
│ струны меж     │ высеченные     │ ▲ Нот  ◆       │
│ столбов        │ розы ветров    │                │
│ ▲ Зефир        │ • • • •        │ ◆              │
├────────────────┼─══════════════─┼────────────────┤
│ ОБРЫВ В ОБЛАКА │ ◎ БРОНЗОВЫЙ    │ ХРАНИЛИЩЕ      │
│ флюгера        │   ВЫСТУП       │ МЕХОВ          │
│ • •            │   причал       │ ▲ Гиппот  ◆    │
└────────────────┴════════════════┴────────────────┘
```

Дорога — бронзовые плиты, положенные прямо на камень. Единственная дорога в игре,
которая блестит: она отражает свет и работает указателем даже в тумане.

**Пять мини-боссов** — четыре ветра по четырём жаровням плюс ключарь

| Имя | Копии | Где |
|---|---|---|
| Борей, северный | колющий | северная жаровня |
| Зефир, западный | колющий | ветряные арфы |
| Ключарь Гиппот | колющий | хранилище мехов |
| Эвр, восточный | рубящий | восточная жаровня |
| Нот, южный | дробящий | южная жаровня |

**Объекты**

| Файл | Размер | Что это |
|---|---|---|
| `ground/aeolia.png` | тайл 512 | камень с параллельными ветровыми бороздами и инеем |
| `road/aeolia.png` | тайл 128 | бронзовые плиты с заклёпками |
| `borders/aeolia.png` | 512×256 | **медная стена**, полированная, с заклёпками |
| `props/wind-vane.png` | в 110 | шест с лентами, все ленты в одну сторону |
| `props/wind-harp.png` | в 90 | два столба с натянутыми струнами |
| `props/brazier-stone.png` | в 55 | каменная чаша-жаровня с огнём |
| `props/windrose-slab.png` | ш 90, плоский | плита с высеченной розой ветров |
| `props/wind-sack.png` | в 50 | кожаный мех, раздутый, перевязан серебряной нитью |

**Враги — анемои, слуги ветров**

- **Обычный (36).** Тела нет — есть длинные складки ткани, свёрнутые в фигуру,
  и бронзовая маска-щёлка вместо лица. Ленты сорваны в одну сторону, ноги не
  касаются земли: висит на ладонь над камнем. Единственные враги в игре, у
  которых нет контакта с землёй, и контактная тень им рисуется меньше и мягче.
- **Элита (48).** Плечи забраны бронзовыми пластинами, маска с четырьмя
  прорезями, лент вдвое больше и они длиннее фигуры.
- **Мини-босс (68).** Ветер с именем: маска целиком закрывает голову и вытянута
  в трубу, вокруг фигуры спираль из лент, в руках — обрывок цепи от меха.

**Босс — Хранитель ветров** (слабость колющий)

Фигура втрое выше человека, собранная из тех же лент, но плотная, как канат.
Голова — бронзовая маска с четырьмя лицами по сторонам света, каждое кричит.
В руках развязанный мех, из которого спиралью выходит буря; спираль обвивает
фигуру и уходит за раму. Слабость к колющему: спираль ветра рубить бесполезно,
её можно только проткнуть насквозь.

**Арена.** Круглая площадка с высеченной розой ветров во весь диаметр, по краям
четыре каменные жаровни с разным цветом огня, за краем — обрыв в белое.

**Трофей на корабль:** мех Эола на мачте (GDD §8).

---

## 2. АССЕТЫ — СЛОТЫ ПОД КАРТИНКИ

**Куда грузить сгенерированную картинку:** в `islands/uploads/aeolia/<категория>/`,
с тем же именем файла, что написано в заголовке слота (например
`islands/uploads/aeolia/props/wind-vane.png`). Категория — часть пути сразу
после `art/` в заголовке слота: `ground`, `road`, `borders`, `props` или
`entities`.

Когда файлы острова лежат в `uploads/aeolia/`, один раз прогнать:

```
python3 tools/import-island-art.py aeolia
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

#### [ ] `public/art/ground/aeolia.png` — камень с параллельными ветровыми бороздами и инеем · тайл 512

![](../public/art/ground/aeolia.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
Bare wind-scoured mountain rock plateau seen from above: flat cool grey-blue
stone as a calm base, long parallel wind-carved grooves all running in the SAME
direction, very sparse tiny details only: a few pale frost patches in the
grooves, a couple of thin cracks, one small copper-green stain. No plants, no
loose rocks, no snow cover.
PALETTE: stone #6E7A8C dominant, light stone #93A0B0, shadow #4A5568, frost
#CFE0EA, rare patina #4E8C7A.
```

_Заметки:_

#### [ ] `public/art/road/aeolia.png` — бронзовые плиты с заклёпками · тайл 128

![](../public/art/road/aeolia.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
A path of polished bronze plates laid on stone: rectangular metal slabs with
rivet heads along their edges, warm bronze catching the light, thin dark seams
between plates, slight green patina in the seams, tiles seamlessly along the long
axis, 128x128.
PALETTE: bronze #B87333 / #8A5526, patina #4E8C7A, dark seam #080D14.
```

_Заметки:_

#### [ ] `public/art/borders/aeolia.png` — **медная стена**, полированная, с заклёпками · 512×256

![](../public/art/borders/aeolia.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
Horizontal repeating border strip: a wall of polished copper plates riveted to a
stone footing, the metal reflecting a hard highlight along its top edge, streaks
of green patina running down, small stone buttresses at intervals. Isolated strip
on flat #00FF00, no ground beneath, tileable left-to-right, ~55-degree top-down,
one hard light from the right, no shadow drawn, 512x256.
PALETTE: copper #B87333 / #8A5526 / #E0A05A highlight, patina #4E8C7A, stone
#6E7A8C.
```

_Заметки:_

### 2.2 Пропы

#### [ ] `public/art/props/wind-vane.png` — шест с лентами, все ленты в одну сторону · в 110

![](../public/art/props/wind-vane.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
A tall thin weathered pole planted in rock, with a bronze weather-vane arrow on
top and long cloth ribbons tied below it, ALL ribbons streaming rigidly in one
direction as if in a permanent gale. Taller than a man.
PALETTE: pole #6E7A8C, bronze #B87333, ribbons #CFE0EA and #E8DCC8.
```

_Заметки:_

#### [ ] `public/art/props/wind-harp.png` — два столба с натянутыми струнами · в 90

![](../public/art/props/wind-harp.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
A wind harp: two stone posts with a dozen taut bronze strings stretched between
them, a few strings snapped and curling, a small bronze bell hanging at one end.
Slightly taller than a man, wider than tall.
PALETTE: stone #6E7A8C / #4A5568, strings and bell #B87333, frost #CFE0EA.
```

_Заметки:_

#### [ ] `public/art/props/brazier-stone.png` — каменная чаша-жаровня с огнём · в 55

![](../public/art/props/brazier-stone.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
A carved stone bowl on a short pedestal holding a small bright fire, the rim
carved with a wave pattern, ash spilling over one side. Waist-high to a man.
PALETTE: stone #6E7A8C / #93A0B0 / #4A5568, fire #FABA50 / #E87C2E, ash #7A756B.
```

_Заметки:_

#### [ ] `public/art/props/windrose-slab.png` — плита с высеченной розой ветров · ш 90, плоский

![](../public/art/props/windrose-slab.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
A flat stone slab set into the ground, carved with a deep eight-pointed compass
rose, its grooves filled with frost, edges chipped. Lies completely FLAT on the
ground, no height, seen from directly above.
PALETTE: stone #6E7A8C / #93A0B0, carved groove shadow #4A5568, frost #CFE0EA.
```

_Заметки:_

#### [ ] `public/art/props/wind-sack.png` — кожаный мех, раздутый, перевязан серебряной нитью · в 50

![](../public/art/props/wind-sack.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
A bulging leather bag the size of a barrel, tied shut at the neck with a silver
cord, straining as if something alive is inside, resting on the ground.
PALETTE: leather #9C7B4A / #68482E, silver cord #CFE0EA, bronze fitting #B87333.
```

_Заметки:_

### 2.3 Враги и босс

#### [ ] `public/art/entities/aeolia-normal.png` — обычный враг

![](../public/art/entities/aeolia-normal.png)

<sub>перед промптом — ПРЕАМБУЛА CHAR из §5</sub>

```
A wind spirit servant: no visible body, only long layered cloth folds twisted
into a human shape, a narrow slit bronze mask instead of a face, ribbons all
streaming rigidly in one direction, and the feet NOT touching the ground —
hovering a hand's width above it. Weightless, sharp, hostile.
PALETTE: near-black folds #080D14, pale cloth #CFE0EA, bronze mask #B87333, cream
highlight #E8DCC8.
```

_Заметки:_

#### [ ] `public/art/entities/aeolia-elite.png` — элита

![](../public/art/entities/aeolia-elite.png)

<sub>перед промптом — ПРЕАМБУЛА CHAR из §5</sub>

```
Same wind-spirit family, one rank up: bronze plates over the shoulders, a mask
with four slits, twice as many ribbons and longer than the body itself, still
hovering.
PALETTE: as above plus patina #4E8C7A.
```

_Заметки:_

#### [ ] `public/art/entities/aeolia-miniboss.png` — мини-босс

![](../public/art/entities/aeolia-miniboss.png)

<sub>перед промптом — ПРЕАМБУЛА CHAR из §5</sub>

```
Same family, a named wind: the bronze mask covers the whole head and is drawn out
into a trumpet shape, a spiral of ribbons coils around the whole figure, a length
of broken chain hangs from one hand, twice the size of the base spirit.
PALETTE: as above.
```

_Заметки:_

#### [ ] `public/art/entities/boss-aeolia.png` — БОСС

![](../public/art/entities/boss-aeolia.png)

<sub>перед промптом — ПРЕАМБУЛА CHAR из §5</sub>

```
Boss character: the Warden of Winds. A figure three times a man's height, built
from the same cloth folds but dense and twisted like rope. Its head is a bronze
mask with FOUR faces, one to each side, every mouth open and screaming. In its
arms an untied leather bag from which a spiral of storm pours out, coiling around
the whole body and running off the edge of the frame. Feet not touching the
ground.
PALETTE: near-black #080D14, pale storm cloth #CFE0EA, bronze #B87333, patina
#4E8C7A, cream #E8DCC8. Max 6 colors.
```

_Заметки:_

---

## 3. РЕФЕРЕНСЫ

Сюда — всё, от чего отталкиваемся: скриншоты игр, фотографии мест, керамика,
наброски. Файлы класть в `islands/ref/aeolia/`, вставлять строкой
`![подпись](ref/aeolia/имя.png)`.

<!-- ![](ref/aeolia/имя.png) -->

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

[← остров 3](03-cyclops.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 5 →](05-telepylos.md)
