[← остров 4](04-aeolia.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 6 →](06-aiaia.md)

# ОСТРОВ 5 — ТЕЛЕПИЛ

> Концепция острова, слоты под картинки и промпты к ним. Общие правила — камера,
> свет, контраст, именование файлов — в [ISLANDS.md §1](../ISLANDS.md#1-общие-правила).
> Числа боя живут в `balance.json` и сюда не переносятся.
>
> **Ассетов на остров: 13.**

---

## 1. КОНЦЕПЦИЯ

**id:** `telepylos` · **босс:** Антифат, царь лестригонов, слабость **дробящий** ·
**биом:** снег, северный фьорд, чёрный базальт

> Здесь ты потерял одиннадцать кораблей из двенадцати. Гавань удобная, вход
> узкий, и с обрыва в тебя летят камни размером с быка.

**Вид.** Белое поле снега, из которого торчат чёрные скалы, — самый жёсткий
контраст всей игры. Вода в гавани чёрная и неподвижная. По берегу — вмёрзшие
носы кораблей, кострища из плавника, китовые рёбра, выгнутые аркой выше игрока.
Кровь на снегу здесь работает сильнее, чем где-либо: `#C4342B` на `#E9EEF3`
единственный раз за игру не спорит ни с чем.

У Гомера в стране лестригонов «пути ночи и дня сходятся» — это север с белыми
ночами, отсюда и снег, и низкое солнце: тени длинные и все в одну сторону.

**Палитра**

| Роль | Hex |
|---|---|
| снег | `#E9EEF3` |
| тень на снегу | `#A8BCD0` |
| глубокая тень | `#7E94AC` |
| чёрный камень | `#262B33` |
| китовая кость | `#DED5C0` |
| кровь | `#C4342B` |

**Планировка**

```
┌────────────────┬────────────────┬────────────────┐
│ ДЛИННЫЙ ДОМ    │ ★ ЗАМЁРЗШАЯ    │ ОБРЫВ НАД      │
│ сруб, дым      │  ГАВАНЬ        │ ГАВАНЬЮ        │
│ ▲ Агрий  ◆     │  вмёрзшие носы │ груды камней   │
│                │  кораблей      │ ▲ Ламос  ◆     │
├────────────────┼─══════════════─┼────────────────┤
│ ЛЕДЯНЫЕ        │ КИТОВЫЕ РЁБРА  │ РОДНИК         │
│ НАДОЛБЫ        │ арки над       │ незамерзающий  │
│ ▲ Борас        │ настилом       │ ▲ Дочь Антифата│
│                │ • • • •        │ ◆              │
├────────────────┼─══════════════─┼────────────────┤
│ РАЗБИТЫЕ       │ ◎ ГАЛЕЧНАЯ КОСА│ ПРИЧАЛ         │
│ КОРАБЛИ        │   узкий вход   │ гарпуны, сети  │
│ • •            │   фьорда       │ ▲ Скайд  ◆     │
└────────────────┴════════════════┴────────────────┘
```

Дорога — настил из брёвен, брошенный поверх снега, местами проваленный. Он
тёмный на белом, поэтому виден дальше любой другой дороги в игре.

**Пять мини-боссов**

| Имя | Копии | Где |
|---|---|---|
| Ламос Камнемёт | дробящий | обрыв над гаванью |
| Борас Ледоруб | дробящий | ледяные надолбы |
| Скайд Гарпунщик | колющий | причал |
| Дочь Антифата | колющий | родник |
| Агрий Мясник | рубящий | длинный дом |

Дочь у источника — канон: именно она вывела разведчиков Одиссея к отцу. Она
единственный узел острова, который не выглядит опасным, и это должно быть
неприятным сюрпризом ровно один раз.

**Объекты**

| Файл | Размер | Что это |
|---|---|---|
| `ground/telepylos.png` | тайл 512 | утоптанный снег с проталинами чёрного камня |
| `road/telepylos.png` | тайл 128 | настил из брёвен по снегу |
| `borders/telepylos.png` | 512×256 | чёрные скалы фьорда со снежными шапками |
| `props/whale-rib-arch.png` | в 150 | арка из двух китовых рёбер, проход под ней |
| `props/longhouse.png` | в 160 | сруб лестригонов, дым из кровли |
| `props/driftwood-fire.png` | ш 60 | кострище из плавника, чёрные головни |
| `props/harpoon-stack.png` | в 85 | связка гарпунов, воткнутых в снег |
| `props/ship-prow-ice.png` | в 120 | нос корабля, вмёрзший в лёд, борт проломлен |
| `props/ice-block.png` | в 45 | ледяной надолб, полупрозрачный |

**Враги — лестригоны, великаны-людоеды**

- **Обычный (36 → визуально крупнее прочих островов).** Единственный остров,
  где обычный враг выше игрока по замыслу: массивная фигура в шкуре моржа мехом
  наружу, костяной нагрудник из рёбер, лицо закрыто капюшоном из звериной
  головы. В руке — цельный камень.
- **Элита (48).** Плечи и предплечья в костяных пластинах, на поясе крючья, на
  капюшоне — череп медведя, кровь на груди не смыта.
- **Мини-босс (68).** Плащ из белой шкуры до земли, костяной венец, за спиной
  волокушa с тушей.

**Босс — Антифат** (слабость дробящий)

Царь: самый широкий силуэт игры до самого финала. Венец из китовых позвонков,
плащ из шкуры белого медведя, лицо не видно вовсе — только тень под венцом.
В руках каменная глыба на цепи. Слабость к дробящему: против камня и кости
работает камень.

**Арена.** Замёрзшая гавань: круг чёрного льда, по краю вмёрзшие носы кораблей
Одиссеевой флотилии, торчащие вверх, на снегу вокруг — красное.

**Трофей на корабль:** гарпун лестригонов вдоль борта.

---

## 2. АССЕТЫ — СЛОТЫ ПОД КАРТИНКИ

**Куда грузить сгенерированную картинку:** в `islands/uploads/telepylos/<категория>/`,
с тем же именем файла, что написано в заголовке слота (например
`islands/uploads/telepylos/props/whale-rib-arch.png`). Категория — часть пути сразу
после `art/` в заголовке слота: `ground`, `road`, `borders`, `props` или
`entities`.

Когда файлы острова лежат в `uploads/telepylos/`, один раз прогнать:

```
python3 tools/import-island-art.py telepylos
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

#### [ ] `public/art/ground/telepylos.png` — утоптанный снег с проталинами чёрного камня · тайл 512

![](../public/art/ground/telepylos.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
Trodden northern snow field seen from above: flat bright snow as a calm base with
large soft blue-grey shadow patches, very sparse tiny details only: two or three
small patches where black basalt shows through the snow, a few thin ice cracks, a
couple of tiny frozen pebbles. No footprints, no plants, no drifts.
PALETTE: snow #E9EEF3 dominant, snow shadow #A8BCD0, deep shadow #7E94AC, black
rock #262B33, rare bone fleck #DED5C0.
```

_Заметки:_

#### [ ] `public/art/road/telepylos.png` — настил из брёвен по снегу · тайл 128

![](../public/art/road/telepylos.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
A corduroy road of split logs laid across snow: dark weathered timber laid
crosswise, gaps packed with snow and ice, one log split, tiles seamlessly along
the long axis, 128x128.
PALETTE: timber #4A3A2C / #68482E, snow in gaps #E9EEF3, ice #A8BCD0.
```

_Заметки:_

#### [ ] `public/art/borders/telepylos.png` — чёрные скалы фьорда со снежными шапками · 512×256

![](../public/art/borders/telepylos.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
Horizontal repeating border strip: a ridge of jagged black basalt cliffs with
thick snow caps on their tops and blue ice in the crevices, a few icicles hanging
from the overhangs. Isolated strip on flat #00FF00, no ground beneath, tileable
left-to-right, ~55-degree top-down, one hard light from the right, no shadow
drawn, 512x256.
PALETTE: black rock #262B33 / #3E434C, snow #E9EEF3, ice shadow #A8BCD0.
```

_Заметки:_

### 2.2 Пропы

#### [ ] `public/art/props/whale-rib-arch.png` — арка из двух китовых рёбер, проход под ней · в 150

![](../public/art/props/whale-rib-arch.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
Two colossal whale ribs planted in the ground and meeting at the top to form an
arch a man can walk under, bone weathered and cracked, small bone charms and
frozen cords tied along them.
PALETTE: bone #DED5C0 / #B8AE96 / #8A8070, cord #4A3A2C, frost #E9EEF3.
```

_Заметки:_

#### [ ] `public/art/props/longhouse.png` — сруб лестригонов, дым из кровли · в 160

![](../public/art/props/longhouse.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
A giant's longhouse: a low massive log building with a turf-and-snow roof, a
dark doorway high enough for a giant, whale jawbones framing the entrance, smoke
rising from a roof hole. Very wide, monumental.
PALETTE: dark timber #4A3A2C / #68482E, turf #3E5A46, snow #E9EEF3, bone #DED5C0,
fire glow #D9762B in the doorway.
```

_Заметки:_

#### [ ] `public/art/props/driftwood-fire.png` — кострище из плавника, чёрные головни · ш 60

![](../public/art/props/driftwood-fire.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
A campfire of bleached driftwood on snow: crossed silver-grey driftwood logs, a
low orange flame, blackened charred ends, a ring of wet black stones, melted snow
around it.
PALETTE: driftwood #B8AE96, char #262B33, fire #FABA50 / #E87C2E, wet stone
#3E434C.
```

_Заметки:_

#### [ ] `public/art/props/harpoon-stack.png` — связка гарпунов, воткнутых в снег · в 85

![](../public/art/props/harpoon-stack.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
A bundle of long bone-tipped harpoons stuck upright into snow, leaning against
each other, coiled rope frozen around their shafts, one harpoon broken.
PALETTE: shaft #68482E, bone tip #DED5C0, rope #B8AE96, snow #E9EEF3.
```

_Заметки:_

#### [ ] `public/art/props/ship-prow-ice.png` — нос корабля, вмёрзший в лёд, борт проломлен · в 120

![](../public/art/props/ship-prow-ice.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
The prow of a wrecked Greek galley frozen upright in ice: curved stem post with a
painted eye on the bow, hull planks stove in, rope and torn sail hanging stiff
with frost, ice gripping the waterline.
PALETTE: hull timber #68482E / #442E1E, painted eye #E8DCC8 with #C4342B, ice
#A8BCD0, snow #E9EEF3.
```

_Заметки:_

#### [ ] `public/art/props/ice-block.png` — ледяной надолб, полупрозрачный · в 45

![](../public/art/props/ice-block.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
A rough block of blue-white ice pushed up out of the ground, translucent with
cracks and trapped bubbles inside, sharp broken top edge, waist-high to a man.
PALETTE: ice #CFE0EA / #A8BCD0 / #7E94AC, bright edge highlight #E9EEF3.
```

_Заметки:_

### 2.3 Враги и босс

#### [ ] `public/art/entities/telepylos-normal.png` — обычный враг

![](../public/art/entities/telepylos-normal.png)

<sub>перед промптом — ПРЕАМБУЛА CHAR из §5</sub>

```
A Laestrygonian giant: massive and heavy, wearing a walrus hide fur outward, a
breastplate of lashed rib bones, face hidden inside a hood made from an animal's
head, bare thick arms. Deliberately larger and bulkier than any other island's
base enemy.
PALETTE: near-black body #080D14, fur #8A8070, bone #DED5C0, blood stain #C4342B,
frost highlight #CFE0EA.
```

_Заметки:_

#### [ ] `public/art/entities/telepylos-elite.png` — элита

![](../public/art/entities/telepylos-elite.png)

<sub>перед промптом — ПРЕАМБУЛА CHAR из §5</sub>

```
Same Laestrygonian family, one rank up: bone plates strapped over shoulders and
forearms, iron meat hooks on the belt, a bear skull on the hood, unwashed blood
across the chest, wider stance.
PALETTE: as above plus warm trim #D9762B on the belt fittings.
```

_Заметки:_

#### [ ] `public/art/entities/telepylos-miniboss.png` — мини-босс

![](../public/art/entities/telepylos-miniboss.png)

<sub>перед промптом — ПРЕАМБУЛА CHAR из §5</sub>

```
Same family, a chieftain of the hunt: a floor-length white bear pelt cloak, a
crown of bone shards, a drag-sledge with a carcass roped behind him, twice the
bulk of the base giant.
PALETTE: as above plus white pelt #E9EEF3.
```

_Заметки:_

#### [ ] `public/art/entities/boss-telepylos.png` — БОСС

![](../public/art/entities/boss-telepylos.png)

<sub>перед промптом — ПРЕАМБУЛА CHAR из §5</sub>

```
Boss character: Antiphates, king of the Laestrygonians. The broadest silhouette
in the game: a giant in a floor-length white bear-pelt cloak, a crown of whale
vertebrae, his face entirely lost in shadow under the crown — no features at all.
He swings a boulder chained to one fist. Blood frozen on the pelt. Feet planted
on ice.
PALETTE: near-black #080D14, white pelt #E9EEF3, bone crown #DED5C0, blood
#C4342B, cold shadow #7E94AC. Max 6 colors.
```

_Заметки:_

---

## 3. РЕФЕРЕНСЫ

Сюда — всё, от чего отталкиваемся: скриншоты игр, фотографии мест, керамика,
наброски. Файлы класть в `islands/ref/telepylos/`, вставлять строкой
`![подпись](ref/telepylos/имя.png)`.

<!-- ![](ref/telepylos/имя.png) -->

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

[← остров 4](04-aeolia.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 6 →](06-aiaia.md)
