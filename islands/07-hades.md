[← остров 6](06-aiaia.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 8 →](08-sirens.md)

# ОСТРОВ 7 — ВРАТА АИДА

> Концепция острова, слоты под картинки и промпты к ним. Общие правила — камера,
> свет, контраст, именование файлов — в [ISLANDS.md §1](../ISLANDS.md#1-общие-правила).
> Числа боя живут в `balance.json` и сюда не переносятся.
>
> **Ассетов на остров: 13.**

---

## 1. КОНЦЕПЦИЯ

**id:** `hades` · **босс:** Тень Ахилла, слабость **колющий** ·
**биом:** пепельная равнина, асфодельный луг, мёртвые тополя

> Это не подземелье. Это берег на краю мира, где Океан упирается в скалу. Здесь
> нет ветра, нет звука и нет тени — свет ниоткуда.

**Вид.** Ровное светло-серое поле пепла, по нему бледные стебли асфодели.
Мёртвые белые тополя без листвы. Три чёрные реки, узкие, как трещины. Всё
обесцвечено, и на этом фоне единственное цветное пятно — кровь в жертвенной яме
`#C4342B`. Она видна с трёх экранов и притягивает взгляд ровно туда, куда надо.

**Исключение по контрасту (§1.2).** Земля тут светло-серая, силуэты остаются
чёрными и читаются. Но сами враги — полупрозрачные тени с заливкой 60%, поэтому
им обязательна кремовая обводка `#E8DCC8` 3–4 px по контуру. Без неё
полупрозрачная фигура на сером поле пропадает, а вместе с ней пропадают и три
иконки над ней.

**Палитра**

| Роль | Hex |
|---|---|
| пепел | `#6E6A63` |
| пепел тёмный | `#4F4C48` |
| асфодель | `#C9C3AE` |
| кора мёртвого тополя | `#8A8578` |
| чёрная река | `#14161C` |
| кровь жертвы | `#C4342B` |

**Планировка**

```
┌────────────────┬────────────────┬────────────────┐
│ РОЩА ЧЁРНЫХ    │ ★ ЖЕРТВЕННАЯ   │ СТЕЛЫ С        │
│ ТОПОЛЕЙ        │  ЯМА           │ ИМЕНАМИ        │
│ ▲ Агамемнон  ◆ │  кровь, круг   │ ▲ Минос        │
│                │  чёрных врат   │ ◆              │
├────────────────┼─══════════════─┼────────────────┤
│ БЕРЕГ АХЕРОНА  │ АСФОДЕЛЬНЫЙ    │ СКАЛА          │
│ ▲ Геракл       │ ЛУГ            │ ЭЛЬПЕНОРА      │
│ ◆              │ • • • •        │ ▲ Эльпенор  ◆  │
├────────────────┼─══════════════─┼────────────────┤
│ ЛОДКА ХАРОНА   │ ◎ ПЕПЕЛЬНАЯ    │ МОЛЧАНИЕ АЯКСА │
│ • •            │   ОТМЕЛЬ       │ ▲ Аякс         │
│                │   Океан        │ • •            │
└────────────────┴════════════════┴────────────────┘
```

Тропа — битый камень вдоль чёрной реки, местами уходящий прямо в воду и
выходящий обратно. Единственная дорога в игре, которая прерывается.

**Пять мини-боссов** — все они павшие, которых Одиссей встречает у ямы (Од. XI)

| Имя | Копии | Где |
|---|---|---|
| Тень Эльпенора | колющий | скала, с которой он упал |
| Тень Геракла | колющий | берег Ахерона, с луком |
| Тень Агамемнона | рубящий | роща чёрных тополей |
| Тень Аякса | дробящий | молчит и не смотрит на тебя |
| Тень Миноса-судии | дробящий | у стел с именами |

Тиресий на острове есть, но врагом не является: сидящая фигура у самой ямы,
статичный ландмарк. Он единственный, кто не нападает, и он не должен иметь ни
полосы здоровья, ни трёх иконок.

**Объекты**

| Файл | Размер | Что это |
|---|---|---|
| `ground/hades.png` | тайл 512 | пепел с бледной асфоделью |
| `road/hades.png` | тайл 128 | битый камень, тёмные швы |
| `borders/hades.png` | 512×256 | базальтовый обрыв и чёрная вода Океана |
| `props/dead-poplar.png` | в 170 | мёртвый белый тополь без листвы |
| `props/stele.png` | в 85 | надгробная стела с именами |
| `props/blood-pit.png` | ш 110, плоский | жертвенная яма с кровью, ландмарк арены |
| `props/charon-boat.png` | ш 150 | чёрная лодка у берега, шест воткнут |
| `props/asphodel-clump.png` | в 40 | пучок бледных асфоделей |
| `props/gate-black.png` | в 120 | те же руинные ворота, но чёрные и оплавленные |

**Враги — тени павших**

- **Обычный (36).** Воин давно кончившейся войны: потемневшая бронза, пустой
  провал под шлемом, тело просвечивает — сквозь грудь видно землю. Заливка 60%,
  кремовая обводка.
- **Элита (48).** Тень с большим щитом и копьём, доспех богаче, просвет меньше
  (75%): чем сильнее тень, тем она плотнее, и это читаемая шкала.
- **Мини-босс (68).** Именованная тень: узнаваемый герой в полном вооружении,
  почти непрозрачный, с одной цветной деталью — она и есть его имя.

**Босс — Тень Ахилла** (слабость колющий)

Доспех из «Илиады»: щит с пятью концентрическими кругами, шлем с высоким
гребнем, копьё из пелионского ясеня — то самое, которое, кроме него, никто не
мог поднять. Внутри доспеха ничего нет: между шлемом и нагрудником видна
пустота и сквозь неё — пейзаж. Слабость к колющему: копьё против копья.

**Арена.** Жертвенная яма: круг чёрной земли, в центре яма с кровью,
по краю — чёрные оплавленные врата, за ними — ничего, просто серое.

**Трофей на корабль:** тень щита Ахилла на борт (полупрозрачная, единственный
трофей, сквозь который видно).

---

## 2. АССЕТЫ — СЛОТЫ ПОД КАРТИНКИ

**Куда грузить сгенерированную картинку:** в `islands/uploads/hades/<категория>/`,
с тем же именем файла, что написано в заголовке слота (например
`islands/uploads/hades/props/dead-poplar.png`). Категория — часть пути сразу
после `art/` в заголовке слота: `ground`, `road`, `borders`, `props` или
`entities`.

Когда файлы острова лежат в `uploads/hades/`, один раз прогнать:

```
python3 tools/import-island-art.py hades
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

#### [ ] `public/art/ground/hades.png` — пепел с бледной асфоделью · тайл 512

![](../public/art/ground/hades.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
A plain of pale grey ash seen from above: flat colourless ash as a calm base with
large soft slightly darker patches, very sparse tiny details only: a few small
pale asphodel stalks, a couple of tiny bone fragments, one faint crack. Utterly
still, no wind marks, no plants beyond the asphodel, no water.
PALETTE: ash #6E6A63 dominant, dark ash #4F4C48, asphodel pale #C9C3AE, rare bone
#DED5C0. No warm colours at all.
```

_Заметки:_

#### [ ] `public/art/road/hades.png` — битый камень, тёмные швы · тайл 128

![](../public/art/road/hades.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
A path of broken grey flagstones over ash: cracked angular stone pieces pressed
into pale ash, deep near-black joints, a few stones missing entirely, tiles
seamlessly along the long axis, 128x128.
PALETTE: stone #8A8578 / #6E6A63, joints #14161C, ash #C9C3AE.
```

_Заметки:_

#### [ ] `public/art/borders/hades.png` — базальтовый обрыв и чёрная вода Океана · 512×256

![](../public/art/borders/hades.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
Horizontal repeating border strip: a low basalt cliff edge dropping into
absolutely black motionless water, the rock face vertical and fissured, a rim of
pale ash along its top, no waves and no reflections in the water. Isolated strip
on flat #00FF00, no ground beneath, tileable left-to-right, ~55-degree top-down,
one hard light from the right, no shadow drawn, 512x256.
PALETTE: basalt #4F4C48 / #3E434C, ash rim #C9C3AE, black water #14161C.
```

_Заметки:_

### 2.2 Пропы

#### [ ] `public/art/props/dead-poplar.png` — мёртвый белый тополь без листвы · в 170

![](../public/art/props/dead-poplar.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A dead black poplar: a tall pale bark-stripped trunk with bare forked branches
reaching up, no leaves at all, one branch snapped and hanging, roots lifting out
of grey ash. Very tall and thin.
PALETTE: pale dead bark #8A8578 / #6E6A63, deep shadow #4F4C48, cream highlight
#C9C3AE.
```

_Заметки:_

#### [ ] `public/art/props/stele.png` — надгробная стела с именами · в 85

![](../public/art/props/stele.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
An ancient Greek grave stele: an upright rectangular stone slab with a carved
palmette top, worn Greek letters cut into its face, leaning slightly, chipped at
one corner. Head-high to a man.
PALETTE: stone #8A8578 / #C9C3AE / #4F4C48, letter shadows #14161C.
```

_Заметки:_

#### [ ] `public/art/props/blood-pit.png` — жертвенная яма с кровью, ландмарк арены · ш 110, плоский

![](../public/art/props/blood-pit.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A sacrificial pit dug into ash, seen from directly above, lying FLAT on the
ground: a rough circular trench filled with dark red blood, ash heaped at the rim,
a bronze bowl tipped over beside it, a few dark stains radiating outward. No
height, no vertical elements.
PALETTE: blood #C4342B / #6B1F1C, ash rim #C9C3AE, dark pit edge #4F4C48, bronze
#B87333.
```

_Заметки:_

#### [ ] `public/art/props/charon-boat.png` — чёрная лодка у берега, шест воткнут · ш 150

![](../public/art/props/charon-boat.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A long narrow black ferry boat drawn up on an ash shore, empty, a single long
punt pole stuck upright in the ground beside it, a lantern hook on the prow with
no lantern, water-blackened planks. Long and low.
PALETTE: black timber #14161C / #2A2A30, pale worn wood #6E6A63, bronze hook
#8A5526.
```

_Заметки:_

#### [ ] `public/art/props/asphodel-clump.png` — пучок бледных асфоделей · в 40

![](../public/art/props/asphodel-clump.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A clump of pale asphodel: thin colourless stalks with small six-petalled flowers,
knee-high, some stalks bent, growing out of grey ash.
PALETTE: stalk #8A8578, flower #C9C3AE / #DED5C0, ash #6E6A63.
```

_Заметки:_

#### [ ] `public/art/props/gate-black.png` — те же руинные ворота, но чёрные и оплавленные · в 120

![](../public/art/props/gate-black.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A ruined Greek temple gate: two weathered columns supporting a cracked lintel,
but the entire structure is burnt black and partly melted, the stone glassy and
slumped, one column fused at its base. The opening between the columns is solid
black. Tall — a person could walk under it.
PALETTE: melted black stone #14161C / #2A2A30 / #4F4C48, ash dust #C9C3AE, no
warm colours.
```

_Заметки:_

### 2.3 Враги и босс

#### [ ] `public/art/entities/hades-normal.png` — обычный враг

![](../public/art/entities/hades-normal.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
The shade of a fallen warrior: a hoplite in tarnished dark bronze armour with an
empty black void under the helmet, the body TRANSLUCENT — the ground is faintly
visible through the chest. Drawn at about 60% opacity but with a solid closed
cream #E8DCC8 rim light 3-4 px along the entire silhouette so it stays readable.
PALETTE: tarnished bronze #6E6A63 / #4F4C48, void #080D14, cream rim #E8DCC8,
faint ash #C9C3AE.
```

_Заметки:_

#### [ ] `public/art/entities/hades-elite.png` — элита

![](../public/art/entities/hades-elite.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Same shade family, one rank up: a large round shield and a long spear on the
back, richer armour with a crest, and noticeably LESS translucent (about 75%
opaque) — the stronger the shade, the denser it is.
PALETTE: as above plus a single warm bronze accent #D9762B on the crest.
```

_Заметки:_

#### [ ] `public/art/entities/hades-miniboss.png` — мини-босс

![](../public/art/entities/hades-miniboss.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Same family, a named shade: a fully armoured hero, nearly opaque, monumental
stance, with exactly ONE saturated colour detail on the whole figure (a crimson
sash) that marks him out. Twice the size of the base shade.
PALETTE: as above plus crimson #C4342B on the sash only.
```

_Заметки:_

#### [ ] `public/art/entities/boss-hades.png` — БОСС

![](../public/art/entities/boss-hades.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Boss character: the Shade of Achilles. Full Iliadic panoply — a great round
shield with five concentric embossed rings, a tall crested helmet, greaves, and
the long ash spear of Pelion held upright. But the armour is EMPTY: between the
helmet and the breastplate there is a visible gap of nothing, and the landscape
shows through it. Nearly opaque bronze with a cream rim light along the whole
silhouette. Standing, spear grounded, utterly still.
PALETTE: near-black #080D14, tarnished bronze #6E6A63 and #4F4C48, cream rim
#E8DCC8, crest crimson #C4342B, ash #C9C3AE.
```

_Заметки:_

---

## 3. РЕФЕРЕНСЫ

Сюда — всё, от чего отталкиваемся: скриншоты игр, фотографии мест, керамика,
наброски. Файлы класть в `islands/ref/hades/`, вставлять строкой
`![подпись](ref/hades/имя.png)`.

<!-- ![](ref/hades/имя.png) -->

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

[← остров 6](06-aiaia.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 8 →](08-sirens.md)
