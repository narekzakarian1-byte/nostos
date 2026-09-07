[← остров 8](08-sirens.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 10 →](10-thrinacia.md)

# ОСТРОВ 9 — ПРОЛИВ

> Концепция острова, слоты под картинки и промпты к ним. Общие правила — камера,
> свет, контраст, именование файлов — в [ISLANDS.md §1](../ISLANDS.md#1-общие-правила).
> Числа боя живут в `balance.json` и сюда не переносятся.
>
> **Ассетов на остров: 13.**

---

## 1. КОНЦЕПЦИЯ

**id:** `strait` · **босс:** Скилла, слабость **колющий** ·
**биом:** мокрая чёрная скала, полка над водоворотом

> Не поле. Коридор. Слева скала с шестью пастями, справа воронка, и пройти надо
> посередине, потеряв шестерых.

**Вид.** Самый узкий остров игры. Слева отвесная мокрая скала, в ней шесть
чёрных зевов на разной высоте. Справа — вода, крутящаяся воронкой, над ней
нависает дикая смоковница (та самая, за которую Одиссей уцепился, когда Харибда
проглотила плот). Между ними — каменная полка шириной в экран, мокрая, с
натянутым вдоль скалы канатом. Свет холодный, всё блестит от брызг.

**Этот остров ломает планировку 3×3 намеренно:** он **1 экран в ширину и 5 в
высоту** (`worldScreensX: 1, worldScreensY: 5` — потребует пер-островных
размеров мира, см. §5). Единственный остров, где нельзя обойти узел стороной, и
единственный, который запоминается формой, а не цветом. После него остров 10 —
широкое открытое пастбище, и контраст работает в обе стороны.

**Исключение по контрасту (§1.2):** земля тёмная (`#55636F`). Врагам обязательна
кремовая обводка `#E8DCC8`, пена и брызги дают светлые пятна, но их не должно
быть в тех местах, где стоят узлы.

**Палитра**

| Роль | Hex |
|---|---|
| мокрая скала | `#55636F` |
| скала в тени | `#39434D` |
| пена | `#DCE6EA` |
| вода воронки | `#3E6C74` |
| водоросли | `#46603A` |
| зев пасти | `#C4342B` |

**Планировка** (1×5 экрана, снизу вверх)

```
        ┌────────────────┐
  верх  │ ★ ПОЛКА ПОД    │  арена: шесть зевов над головой,
        │  ШЕСТЬЮ ЗЕВАМИ │  смоковница справа, воронка внизу
        ├────────────────┤
        │ СМОКОВНИЦА     │  ▲ Тритон-падальщик · ◆
        │ над Харибдой   │
        ├────────────────┤
        │ УЗКОЕ МЕСТО    │  ▲ Мурена · ▲ Краб Кархар · • •
        │ канат вдоль    │
        ├────────────────┤
        │ ОБЛОМКИ МАЧТ   │  ▲ Гребец в водорослях · ◆ · • •
        │ в расщелине    │
        ├────────────────┤
  низ   │ ◎ МОКРАЯ       │  ▲ Кормчий Эльпидий · ◆ · • •
        │   СТУПЕНЬ      │
        └────────────────┘
```

Дороги в привычном виде нет: есть полка и натянутый вдоль скалы канат. Канат
работает как дорога — тёмная линия, вдоль которой идёт игрок. Это лучший
указатель пути в игре и стоит одного пропа.

**Пять мини-боссов**

| Имя | Копии | Где |
|---|---|---|
| Кормчий Эльпидий, утопший | колющий | мокрая ступень у входа |
| Гребец в водорослях | колющий | обломки мачт |
| Мурена-падальщица | рубящий | узкое место |
| Краб Кархар | дробящий | узкое место, другая сторона |
| Тритон-падальщик | дробящий | под смоковницей |

**Объекты**

| Файл | Размер | Что это |
|---|---|---|
| `ground/strait.png` | тайл 512 | мокрый чёрный камень, лужи, налипшие раковины |
| `road/strait.png` | тайл 128 | не дорога — мокрая полка со следами каната |
| `borders/strait.png` | 512×256 | отвесная скала слева / бурлящая вода справа (два варианта в одном файле — верх и низ полосы) |
| `props/fig-tree-wild.png` | в 170 | дикая смоковница, нависает над водой |
| `props/maw-cave.png` | в 120 | чёрный зев в скале, зубы по кромке |
| `props/whirlpool.png` | ш 200, плоский | воронка Харибды, лежит на воде |
| `props/mast-wreck.png` | в 140 | обломок мачты с обрывком паруса |
| `props/rope-line.png` | ш 160 | натянутый канат на костылях вдоль скалы |
| `props/stalactite.png` | в 60 | сталактиты сверху и наросты раковин |

**Враги — утопленники и падальщики пролива**

- **Обычный (36).** Моряк, пробывший в воде слишком долго: раздутый силуэт,
  водоросли вместо волос, ракушки наросли на плече и предплечье, вода стекает.
  Идёт медленно и неровно.
- **Элита (48).** Тот же, но панцирь из наросших раковин на груди и спине, одна
  рука срослась с клешнёй.
- **Мини-босс (68).** Морская тварь, кормящаяся здесь: мурена или краб размером
  с человека, с обрывками снастей на теле.

**Босс — Скилла** (слабость колющий)

Тела не видно: оно в пещере. Из скалы над ареной выходят **шесть змеиных шей**,
на каждой — собачья голова с тремя рядами зубов; вокруг основания шей — пояс из
собачьих голов помельче. Шеи двигаются независимо, и в бою они бьют по очереди.
Слабость к колющему: единственное, что можно сделать с шеей, — проткнуть её.

**Харибда — не второй босс, а фон арены:** воронка справа, куда всё уходит.
Никакой новой механики затягивания в текущем объёме нет; если захочется — это
отдельный разговор, потому что GDD не описывает ни одной механики арены, кроме
регена босса.

**Арена.** Полка под скалой: полукруг вместо круга, ограниченный водой; шесть
зевов над головой игрока, смоковница у правого края, воронка за ней.

**Трофей на корабль:** щупальце-шея Скиллы вдоль борта (GDD §8).

---

## 2. АССЕТЫ — СЛОТЫ ПОД КАРТИНКИ

**Куда грузить сгенерированную картинку:** в `islands/uploads/strait/<категория>/`,
с тем же именем файла, что написано в заголовке слота (например
`islands/uploads/strait/props/fig-tree-wild.png`). Категория — часть пути сразу
после `art/` в заголовке слота: `ground`, `road`, `borders`, `props` или
`entities`.

Когда файлы острова лежат в `uploads/strait/`, один раз прогнать:

```
python3 tools/import-island-art.py strait
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

#### [ ] `public/art/ground/strait.png` — мокрый чёрный камень, лужи, налипшие раковины · тайл 512

![](../public/art/ground/strait.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
Wet dark sea-rock ledge seen from above: flat wet grey-blue stone as a calm base,
large soft patches of darker wet and lighter dry stone, very sparse tiny details
only: a few small shallow puddles reflecting pale light, a couple of tiny barnacle
clusters, one thin strand of dark seaweed. No large rocks, no foam, no water body.
PALETTE: wet rock #55636F dominant, shadow #39434D, dry rock #6E7A8C, puddle
sheen #DCE6EA, rare seaweed #46603A.
```

_Заметки:_

#### [ ] `public/art/road/strait.png` — не дорога — мокрая полка со следами каната · тайл 128

![](../public/art/road/strait.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
A worn wet stone ledge path: smoother polished rock where feet have passed, dark
water seeping at the edges, a few iron spikes driven into the stone with frayed
rope ends, tiles seamlessly along the long axis, 128x128.
PALETTE: polished rock #6E7A8C, wet dark #39434D, iron #3E434C, rope #C9C3AE.
```

_Заметки:_

#### [ ] `public/art/borders/strait.png` — отвесная скала слева / бурлящая вода справа (два варианта в одном файле — верх и низ полосы) · 512×256

![](../public/art/borders/strait.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
Horizontal repeating border strip in TWO halves stacked vertically: the upper
half is a sheer wet black cliff face with fissures and dripping seams; the lower
half is churning foaming teal seawater with white foam streaks and spray. Isolated
strip on flat #00FF00, no ground between them, tileable left-to-right, ~55-degree
top-down, one hard light from the right, no shadow drawn, 512x256.
PALETTE: cliff #39434D / #55636F, foam #DCE6EA, water #3E6C74.
```

_Заметки:_

### 2.2 Пропы

#### [ ] `public/art/props/fig-tree-wild.png` — дикая смоковница, нависает над водой · в 170

![](../public/art/props/fig-tree-wild.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A wild fig tree growing sideways out of a cliff: a thick twisted trunk leaning far
out over empty space, broad lobed leaves, aerial roots gripping the rock, a few
ripe dark figs. Leans strongly to one side, wider than tall.
PALETTE: leaves #46603A / #2F5137, bark #4A3B2C / #68482E, figs #5B2A3A, cream rim
light #E8DCC8.
```

_Заметки:_

#### [ ] `public/art/props/maw-cave.png` — чёрный зев в скале, зубы по кромке · в 120

![](../public/art/props/maw-cave.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A black cave mouth in wet rock, ringed with broken stone teeth along its upper and
lower lip so that it reads as a MOUTH rather than an opening. The interior is
solid black with a faint red glow deep inside. Wider than tall.
PALETTE: wet rock #55636F / #39434D, teeth #C9C3AE, interior #080D14, deep red
glow #C4342B.
```

_Заметки:_

#### [ ] `public/art/props/whirlpool.png` — воронка Харибды, лежит на воде · ш 200, плоский

![](../public/art/props/whirlpool.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A whirlpool seen from directly above, lying FLAT: concentric spiral bands of
churning teal water narrowing to a black centre, white foam streaks following the
spiral, splintered planks caught in the outer ring. No height, no vertical
elements.
PALETTE: water #3E6C74 / #2A4E56, foam #DCE6EA, black centre #14161C, wreck timber
#68482E.
```

_Заметки:_

#### [ ] `public/art/props/mast-wreck.png` — обломок мачты с обрывком паруса · в 140

![](../public/art/props/mast-wreck.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A broken ship's mast wedged upright in rock: snapped off at head height, a torn
sail hanging wet and heavy from the yard, ropes trailing, barnacles at the base.
Tall and thin.
PALETTE: timber #68482E / #442E1E, wet sail #C9C3AE, rope #A8A08C, barnacle
#DCE6EA.
```

_Заметки:_

#### [ ] `public/art/props/rope-line.png` — натянутый канат на костылях вдоль скалы · ш 160

![](../public/art/props/rope-line.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A guide rope stretched along a cliff: two iron spikes driven into rock with a
thick wet hemp rope strung between them, sagging in the middle, frayed strands
hanging. Long and low, much wider than tall.
PALETTE: rope #A8A08C / #6E6A63, iron #3E434C, wet rock base #55636F.
```

_Заметки:_

#### [ ] `public/art/props/stalactite.png` — сталактиты сверху и наросты раковин · в 60

![](../public/art/props/stalactite.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A cluster of wet stone stalactites and encrusted shell growths hanging from an
overhang, tapering to sharp points, water beading at the tips, a few broken off.
PALETTE: wet stone #55636F / #39434D, mineral pale #DCE6EA, shell #C9C3AE.
```

_Заметки:_

### 2.3 Враги и босс

#### [ ] `public/art/entities/strait-normal.png` — обычный враг

![](../public/art/entities/strait-normal.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A drowned sailor: a swollen bloated silhouette, dark seaweed instead of hair,
barnacles and shells encrusted on one shoulder and forearm, water running off the
tattered tunic, standing lopsided as if the body no longer balances. Cream rim
light along the whole silhouette.
PALETTE: near-black body #080D14, seaweed #46603A, barnacle #DCE6EA, wet tunic
#55636F, cream rim #E8DCC8.
```

_Заметки:_

#### [ ] `public/art/entities/strait-elite.png` — элита

![](../public/art/entities/strait-elite.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Same drowned family, one rank up: a carapace of grown-together shells across chest
and back, one arm fused into a crab claw, more seaweed, heavier and wider.
PALETTE: as above plus shell honey #A8843F.
```

_Заметки:_

#### [ ] `public/art/entities/strait-miniboss.png` — мини-босс

![](../public/art/entities/strait-miniboss.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Same family, a sea scavenger that feeds here: a man-sized moray eel reared up on a
coil, jaws open, with torn ship's rigging and rope still tangled around its body.
Twice the size of the base figure.
PALETTE: as above plus eel #39434D and pale gullet #DCE6EA.
```

_Заметки:_

#### [ ] `public/art/entities/boss-strait.png` — БОСС

![](../public/art/entities/boss-strait.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Boss character: Scylla. The body is never shown — it stays in the cave. From the
rock emerge SIX long serpentine necks, each ending in a dog's head with three rows
of teeth, jaws open, tongues out. Around the base where the necks join the rock
there is a girdle of smaller dog heads. The necks are at different heights and
angles, filling the frame like a fan. Wet, glistening, hostile.
PALETTE: near-black #080D14, wet grey-blue #55636F, pale teeth #E8DCC8, red gullet
#C4342B, seaweed #46603A.
```

_Заметки:_

---

## 3. РЕФЕРЕНСЫ

Сюда — всё, от чего отталкиваемся: скриншоты игр, фотографии мест, керамика,
наброски. Файлы класть в `islands/ref/strait/`, вставлять строкой
`![подпись](ref/strait/имя.png)`.

<!-- ![](ref/strait/имя.png) -->

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

[← остров 8](08-sirens.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 10 →](10-thrinacia.md)
