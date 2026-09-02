[← остров 10](10-thrinacia.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 12 →](12-scheria.md)

# ОСТРОВ 11 — ОГИГИЯ

> Концепция острова, слоты под картинки и промпты к ним. Общие правила — камера,
> свет, контраст, именование файлов — в [ISLANDS.md §1](../ISLANDS.md#1-общие-правила).
> Числа боя живут в `balance.json` и сюда не переносятся.
>
> **Ассетов на остров: 13.**

---

## 1. КОНЦЕПЦИЯ

**id:** `ogygia` · **босс:** Калипсо, слабость **рубящий** ·
**биом:** райская зелень, четыре ручья, грот

> Тюрьма, которая выглядит как рай. Семь лет. Всё цветёт, всё поёт, и от этого
> хочется выть.

**Вид.** Самая густая и красивая зелень игры: кипарис, ольха, тополь, фиалковые
и сельдерейные луга (всё по описанию Од. V — Гомер даёт этот остров подробнее
любого другого). Четыре источника бьют рядом и расходятся четырьмя ручьями в
разные стороны — они делят карту на четыре сектора и работают навигацией.
Наверху — грот, увитый виноградом. На берегу внизу лежит **недостроенный плот**:
вот твой выход, вот зачем ты дерёшься. Это лучший объект-мотивация в игре, и его
видно с точки высадки.

Красота здесь должна быть чуть слишком правильной: цветы одинаковые, ручьи
симметричные, трава без единой проплешины. Остров выглядит как декорация,
потому что он и есть декорация.

**Палитра**

| Роль | Hex |
|---|---|
| луг | `#3F8A5E` |
| луг в тени | `#2C6446` |
| луг на свету | `#59A472` |
| фиалка | `#6E5A9C` |
| вода источника | `#6FBFA8` |
| кипарис | `#1E4034` |
| песок бухты | `#E8DCC8` |

**Планировка**

```
┌────────────────┬────────────────┬────────────────┐
│ ЧЕТЫРЕ         │ ★ ГРОТ КАЛИПСО │ КИПАРИСЫ       │
│ ИСТОЧНИКА      │  вход в лозе   │ гнёзда сов     │
│ ▲ Нимфа  ◆     │                │ ▲ Сова  ◆      │
├────────────────┼─══════════════─┼────────────────┤
│ ФИАЛКОВЫЙ ЛУГ  │ ТРОПА В ЦВЕТАХ │ ЛОЗА НА СКАЛЕ  │
│ ▲ Сон о        │ • • • •        │ ▲ Лоза-страж   │
│ Пенелопе  ◆    │                │ ◆              │
├────────────────┼─══════════════─┼────────────────┤
│ БЕРЕГ С ПЛОТОМ │ ◎ БУХТА        │ ОЛЬХА И ТОПОЛЬ │
│ ▲ Сон о        │                │ • •            │
│ Телемахе       │                │                │
└────────────────┴════════════════┴────────────────┘
```

Дорога почти заросла: плитняк, между плитами трава по колено. Единственная
дорога, которую нужно искать глазами, — и это ровно то, что чувствует человек,
проживший тут семь лет.

**Пять мини-боссов**

| Имя | Копии | Где |
|---|---|---|
| Сон о Пенелопе | рубящий | фиалковый луг |
| Сон о Телемахе | рубящий | у недостроенного плота |
| Нимфа источника | колющий | четыре источника |
| Лоза-страж | колющий | лоза на скале грота |
| Сова Калипсо | дробящий | кипарисы |

**Сны — костюмный ход острова.** Гомер не даёт на Огигии врагов, и выдумывать
монстров тут было бы фальшиво. Вместо них остров подсовывает образы дома, чтобы
удержать: полупрозрачные фигуры Пенелопы, Телемаха, погибших товарищей —
знакомые силуэты в белом, размытые по краю. Драться с ними неприятно, и это
правильно: остров держит не силой.

**Объекты**

| Файл | Размер | Что это |
|---|---|---|
| `ground/ogygia.png` | тайл 512 | идеальный луг с мелкими фиалками |
| `road/ogygia.png` | тайл 128 | плитняк, заросший травой |
| `borders/ogygia.png` | 512×256 | море и скала с лозой |
| `props/grotto-mouth.png` | в 200 | вход в грот, увитый виноградом, ландмарк арены |
| `props/spring-four.png` | ш 160, плоский | четыре источника рядом, ручьи в разные стороны |
| `props/cypress-tall.png` | в 210 | кипарис, узкий вертикальный силуэт |
| `props/alder-poplar.png` | в 180 | ольха и тополь парой |
| `props/violet-meadow.png` | ш 120, плоский | фиалковый ковёр |
| `props/raft-unfinished.png` | ш 170 | недостроенный плот, топор воткнут в бревно |

**Враги — сны и лозы**

- **Обычный (36).** Знакомая фигура в белом: женщина у ткацкого станка, мальчик,
  гребец. Силуэт узнаваемый, край размыт, заливка 55%, кремовая обводка. Лица нет
  — ровно там, где должно быть лицо, пусто.
- **Элита (48).** Сон, который почти вспомнил себя: чуть плотнее, в руках
  предмет из прошлой жизни (веретено, весло, детский лук).
- **Мини-босс (68).** Лоза-страж: сплетённая из виноградных плетей фигура с
  цветами вместо глаз, растёт прямо из земли и не отрывает от неё ног.

**Босс — Калипсо** (слабость рубящий)

Высокая женская фигура в платье, сотканном из морской пены: оно светится
изнутри и стекает. Волосы — нити водорослей до земли. За спиной раскрыт веер из
**семи колец** — семь лет. Она красива, и это должно быть неприятно: ни клыков,
ни когтей, ни крови. Слабость к рубящему: путы режут.

**Арена.** Площадка перед гротом: круг мягкой травы, по краю четыре ручья,
сходящиеся к входу, у стены — станок, на котором она ткёт. За её спиной вход в
грот, из которого идёт тёплый свет.

**Трофей на корабль:** лоскут её ткани на мачте — вечно мокрый и никогда не
сохнет.

---

## 2. АССЕТЫ — СЛОТЫ ПОД КАРТИНКИ

**Куда грузить сгенерированную картинку:** в `islands/uploads/ogygia/<категория>/`,
с тем же именем файла, что написано в заголовке слота (например
`islands/uploads/ogygia/props/grotto-mouth.png`). Категория — часть пути сразу
после `art/` в заголовке слота: `ground`, `road`, `borders`, `props` или
`entities`.

Когда файлы острова лежат в `uploads/ogygia/`, один раз прогнать:

```
python3 tools/import-island-art.py ogygia
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

#### [ ] `public/art/ground/ogygia.png` — идеальный луг с мелкими фиалками · тайл 512

![](../public/art/ground/ogygia.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
A perfect lush meadow seen from above: flat rich emerald grass as a calm base with
large soft patches of lighter and deeper green, very sparse tiny details only: a
few tiny violet flowers, a couple of small wild celery sprigs, one faint dew
sheen. Unnaturally even and healthy, no bare patches, no rocks, no leaves.
PALETTE: meadow #3F8A5E dominant, shadow #2C6446, light green #59A472, violet
#6E5A9C, rare pale bloom #E8DCC8.
```

_Заметки:_

#### [ ] `public/art/road/ogygia.png` — плитняк, заросший травой · тайл 128

![](../public/art/road/ogygia.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
A flagstone path almost swallowed by grass: flat pale stones with thick meadow
grass growing over their edges and between them, a few stones completely hidden,
tiny violets in the joints, tiles seamlessly along the long axis, 128x128.
PALETTE: stone #C9C3AE / #A8A08C, grass #3F8A5E / #2C6446, violet #6E5A9C.
```

_Заметки:_

#### [ ] `public/art/borders/ogygia.png` — море и скала с лозой · 512×256

![](../public/art/borders/ogygia.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
Horizontal repeating border strip: a low mossy sea cliff edge with grapevine
hanging over its lip, calm turquoise water below with a thin line of pale foam
against the rock, small ferns in the crevices. Isolated strip on flat #00FF00, no
ground beneath, tileable left-to-right, ~55-degree top-down, one hard light from
the right, no shadow drawn, 512x256.
PALETTE: rock #A8A08C / #6E7A8C, moss #2C6446, vine #3F8A5E, water #6FBFA8, foam
#E8DCC8.
```

_Заметки:_

### 2.2 Пропы

#### [ ] `public/art/props/grotto-mouth.png` — вход в грот, увитый виноградом, ландмарк арены · в 200

![](../public/art/props/grotto-mouth.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
The mouth of a sea grotto in a green cliff: a wide arched cave opening completely
curtained with hanging grapevine and clusters of dark grapes, warm firelight
glowing from deep inside, ferns and flowers growing on the rock around it.
Monumental landmark, wider than tall.
PALETTE: rock #A8A08C / #6E7A8C, vine #3F8A5E / #2C6446, grapes #5B3A5E, warm glow
#D9762B, cave dark #080D14.
```

_Заметки:_

#### [ ] `public/art/props/spring-four.png` — четыре источника рядом, ручьи в разные стороны · ш 160, плоский

![](../public/art/props/spring-four.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
Four springs rising side by side from the ground, seen from directly above and
lying FLAT: four small clear pools with pale pebble rims, each sending a narrow
stream away in a different direction, water bright turquoise, green grass between
them. No height.
PALETTE: water #6FBFA8 / #4E8F86, pebble rim #E8DCC8, grass #3F8A5E.
```

_Заметки:_

#### [ ] `public/art/props/cypress-tall.png` — кипарис, узкий вертикальный силуэт · в 210

![](../public/art/props/cypress-tall.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
A single tall cypress: a very narrow dark column of dense foliage rising to a
point, slight lean, a thin bare trunk visible at the base. Extremely tall and
narrow — five times a man's height, a fifth of that in width.
PALETTE: cypress #1E4034 / #2C6446, lit edge #3F8A5E, trunk #4A3B2C.
```

_Заметки:_

#### [ ] `public/art/props/alder-poplar.png` — ольха и тополь парой · в 180

![](../public/art/props/alder-poplar.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
Two trees growing close together: a broad-crowned alder with round leaves and a
slender poplar with a tall narrow crown, their canopies overlapping, one shared
patch of exposed roots.
PALETTE: alder #3F8A5E / #2C6446, poplar #59A472, bark #4A3B2C, cream rim light
#E8DCC8.
```

_Заметки:_

#### [ ] `public/art/props/violet-meadow.png` — фиалковый ковёр · ш 120, плоский

![](../public/art/props/violet-meadow.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
A carpet of violets seen from directly above, lying completely FLAT on the ground:
dozens of small purple flowers over low green foliage, denser in the middle and
scattering at the edges. No height, no stems standing up.
PALETTE: violet #6E5A9C / #4E3E75, foliage #3F8A5E / #2C6446, pale bloom #E8DCC8.
```

_Заметки:_

#### [ ] `public/art/props/raft-unfinished.png` — недостроенный плот, топор воткнут в бревно · ш 170

![](../public/art/props/raft-unfinished.png)

<sub>перед промптом — ПРЕАМБУЛА PROP из §5</sub>

```
An unfinished raft on a beach: twenty trimmed logs lashed side by side with only
half of them tied, a half-stepped mast lying across it, a bronze axe left standing
in a log, wood chips and coils of rope around it. Long and low.
PALETTE: fresh cut wood #C9A94E / #9C7B4A, bark #4A3B2C, rope #E8DCC8, bronze axe
#B87333.
```

_Заметки:_

### 2.3 Враги и босс

#### [ ] `public/art/entities/ogygia-normal.png` — обычный враг

![](../public/art/entities/ogygia-normal.png)

<sub>перед промптом — ПРЕАМБУЛА CHAR из §5</sub>

```
A dream of home: a familiar human figure in a plain white robe — a woman standing
at a loom — TRANSLUCENT at about 55% opacity with softly dissolving edges, and
where the face should be there is nothing at all, just blank emptiness. A closed
cream #E8DCC8 rim light keeps the silhouette readable.
PALETTE: white robe #E8DCC8, faint body #A8B8C4, blank face #C9C3AE, near-black
outline #080D14, violet tint #6E5A9C at the hem.
```

_Заметки:_

#### [ ] `public/art/entities/ogygia-elite.png` — элита

![](../public/art/entities/ogygia-elite.png)

<sub>перед промптом — ПРЕАМБУЛА CHAR из §5</sub>

```
Same dream family, one rank up: denser and more solid (about 70% opacity), holding
one object from the life it half remembers — a spindle, an oar, or a child's bow —
still faceless.
PALETTE: as above plus bronze object accent #B87333.
```

_Заметки:_

#### [ ] `public/art/entities/ogygia-miniboss.png` — мини-босс

![](../public/art/entities/ogygia-miniboss.png)

<sub>перед промптом — ПРЕАМБУЛА CHAR из §5</sub>

```
Different member of the same island: a vine guardian — a humanoid figure woven
entirely from grapevine stems and leaves, open flowers where its eyes should be,
its legs never separating from the ground but growing out of it. Twice the size of
the dreams.
PALETTE: vine #3F8A5E / #2C6446 / #1E4034, flowers #6E5A9C, grapes #5B3A5E, cream
rim #E8DCC8.
```

_Заметки:_

#### [ ] `public/art/entities/boss-ogygia.png` — БОСС

![](../public/art/entities/boss-ogygia.png)

<sub>перед промптом — ПРЕАМБУЛА CHAR из §5</sub>

```
Boss character: Calypso. A tall woman in a gown woven from sea foam that glows
faintly from within and pours downward like water; her hair is long strands of
seaweed reaching the ground. Behind her back, SEVEN thin rings open out like a fan
— seven years. She is beautiful and calm, with no fangs, claws or blood; the
threat is entirely in her stillness. One hand extended, palm up, offering.
PALETTE: foam gown #E8DCC8 and #6FBFA8, seaweed hair #1E4034, ring gold #B87333,
violet shadow #6E5A9C, near-black outline #080D14. Max 6 colors.
```

_Заметки:_

---

## 3. РЕФЕРЕНСЫ

Сюда — всё, от чего отталкиваемся: скриншоты игр, фотографии мест, керамика,
наброски. Файлы класть в `islands/ref/ogygia/`, вставлять строкой
`![подпись](ref/ogygia/имя.png)`.

<!-- ![](ref/ogygia/имя.png) -->

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

[← остров 10](10-thrinacia.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 12 →](12-scheria.md)
