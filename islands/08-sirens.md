[← остров 7](07-hades.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 9 →](09-strait.md)

# ОСТРОВ 8 — ОСТРОВ СИРЕН

> Концепция острова, слоты под картинки и промпты к ним. Общие правила — камера,
> свет, контраст, именование файлов — в [ISLANDS.md §1](../ISLANDS.md#1-общие-правила).
> Числа боя живут в `balance.json` и сюда не переносятся.
>
> **Ассетов на остров: 13.**

---

## 1. КОНЦЕПЦИЯ

**id:** `sirens` · **босс:** Сирены, слабость **рубящий** ·
**биом:** плоский известняковый шельф над стоячей водой, кость

> Море стоит. Ни ветра, ни волны, ни звука — кроме одного, и его ты слышишь
> раньше, чем видишь берег.

**Вид.** Белый мраморный шельф, гладкий и разъеденный солью, лежащий чуть выше
воды. Ни травы, ни деревьев — ни одной живой вертикали. Вертикали здесь дают
только вёсла, воткнутые в камень целым лесом, и остовы кораблей. Всюду кости,
но плоско: они лежат, а не громоздятся, и не мешают читать узлы. Вода зеркальная,
`#6FA8A0`, и в ней отражается небо — единственное движение на всём острове.

Самый светлый остров игры. Чёрные силуэты на нём читаются лучше всего, и это
намеренно: остров 9 сразу после него — самый тёмный, и переход должен ударить.

**Палитра**

| Роль | Hex |
|---|---|
| известняк | `#E4DECB` |
| известняк в тени | `#C2B9A2` |
| мокрый камень | `#A8A08C` |
| стоячая вода | `#6FA8A0` |
| кость | `#F0EAD9` |
| медовый акцент сирен | `#E2A93B` |

**Планировка**

```
┌────────────────┬────────────────┬────────────────┐
│ ГНЁЗДА СИРЕН   │ ★ МРАМОРНЫЙ    │ СТУПЕНИ        │
│ на скалах      │  ШЕЛЬФ         │ В НИКУДА       │
│ ▲ Птенец  ◆    │  три гнезда    │ ▲ Лирник  ◆    │
│                │  по краю       │                │
├────────────────┼─══════════════─┼────────────────┤
│ ЛЕС ВЁСЕЛ      │ КОСТЯНОЕ ПОЛЕ  │ СОЛЁНЫЕ ЛУЖИ   │
│ ▲ Эврилох      │ • • • •        │ зеркала        │
│ ◆              │                │ ▲ Утопленник   │
├────────────────┼─══════════════─┼────────────────┤
│ ОСТОВЫ         │ ◎ ПЛОСКИЙ      │ МАЧТА С        │
│ КОРАБЛЕЙ       │   ШЕЛЬФ У ВОДЫ │ ВЕРЁВКАМИ      │
│ • •            │                │ ▲ Перимед  ◆   │
└────────────────┴════════════════┴────────────────┘
```

Дорога — мраморные плиты, изъеденные солью до ноздреватости. Она почти не
отличается по цвету от земли, и это единственный остров, где дорога не ведёт:
ориентиром служит лес вёсел.

**Пять мини-боссов** — те, кто доплыл и остался

| Имя | Копии | Где |
|---|---|---|
| Кормчий Перимед | рубящий | у мачты с верёвками |
| Эврилох Слушающий | рубящий | лес вёсел |
| Птенец сирены | колющий | гнёзда на скалах |
| Утопленник-барабанщик | колющий | солёные лужи |
| Лирник | дробящий | мраморные ступени |

**Объекты**

| Файл | Размер | Что это |
|---|---|---|
| `ground/sirens.png` | тайл 512 | известняк, разъеденный солью, тонкие трещины |
| `road/sirens.png` | тайл 128 | мраморные плиты в соляных кавернах |
| `borders/sirens.png` | 512×256 | обрыв шельфа в стеклянную воду |
| `props/oar-forest.png` | в 130 | группа вёсел, воткнутых в камень |
| `props/wreck-ribs.png` | ш 170 | шпангоуты корабля, торчащие из камня |
| `props/marble-steps.png` | ш 120 | мраморные ступени, обрывающиеся в воздухе |
| `props/siren-nest.png` | в 70 | гнездо из костей, волос и обрывков парусины |
| `props/salt-pool.png` | ш 100, плоский | солёная лужа-зеркало |
| `props/bone-field.png` | ш 90, низкий | россыпь костей и черепов, плоская |

**Враги — зачарованные**

Не сирены: сирен трое, и они босс. Обычные враги — моряки, которые доплыли и
остались, и продолжают идти на голос.

- **Обычный (36).** Истощённая фигура, рёбра наружу, глаза закрыты, идёт на
  звук. **В ушах воск** — два белых пятна по бокам головы, самая читаемая
  деталь острова. С плеч свисают обрывки верёвок, которыми он себя привязывал.
- **Элита (48).** Тот же, но верёвки затянуты в жгуты, на груди — обломок весла
  как импровизированный доспех, воск залил уже пол-лица.
- **Мини-босс (68).** Полусросшийся с гнездом: перья проросли сквозь кожу,
  руки удлинились, стоит согнувшись по-птичьи.

**Босс — Сирены** (слабость рубящий)

Три фигуры на одной шкале здоровья: тело крупной птицы, женское лицо, крылья
сложены как плащ. Одна с лирой, вторая с двойной флейтой, третья просто поёт —
и её рот открыт неестественно широко. Они стоят треугольником вокруг центра
арены и не двигаются с места; двигается игрок. Слабость к рубящему: перо и
шея — то, что перерубается.

**Механика без новых механик:** это один босс-сущность с одной шкалой,
отрисованный тремя фигурами вокруг центра (`render.bossArena.radius`). Никакого
нового кода боя, только три вызова отрисовки.

**Арена.** Мраморный шельф у самой воды, три гнезда из костей по краю круга,
внутри круга — кости, лежащие правильным кольцом. Их положил не прибой.

**Трофей на корабль:** лира сирены на мачте.

---

## 2. АССЕТЫ — СЛОТЫ ПОД КАРТИНКИ

**Куда грузить сгенерированную картинку:** в `islands/uploads/sirens/<категория>/`,
с тем же именем файла, что написано в заголовке слота (например
`islands/uploads/sirens/props/oar-forest.png`). Категория — часть пути сразу
после `art/` в заголовке слота: `ground`, `road`, `borders`, `props` или
`entities`.

Когда файлы острова лежат в `uploads/sirens/`, один раз прогнать:

```
python3 tools/import-island-art.py sirens
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

#### [ ] `public/art/ground/sirens.png` — известняк, разъеденный солью, тонкие трещины · тайл 512

![](../public/art/ground/sirens.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
A flat sea-worn limestone shelf seen from above: pale cream stone as a calm base,
large soft patches of slightly darker weathering, very sparse tiny details only: a
few small salt-eaten pits, two or three thin hairline cracks, a couple of tiny
bleached shell fragments. No plants, no sand, no water, no bones.
PALETTE: limestone #E4DECB dominant, shadow #C2B9A2, wet stone #A8A08C, bone
fleck #F0EAD9, rare dark crack #6E6A63.
```

_Заметки:_

#### [ ] `public/art/road/sirens.png` — мраморные плиты в соляных кавернах · тайл 128

![](../public/art/road/sirens.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
A path of large marble slabs eaten hollow by salt: pale polished stone with
irregular pitted cavities, thin dark joints, one slab cracked across, faint salt
bloom, tiles seamlessly along the long axis, 128x128.
PALETTE: marble #E4DECB / #C2B9A2, cavities #A8A08C, joints #6E6A63.
```

_Заметки:_

#### [ ] `public/art/borders/sirens.png` — обрыв шельфа в стеклянную воду · 512×256

![](../public/art/borders/sirens.png)

<sub>перед промптом — ПРЕАМБУЛА TILE из §5</sub>

```
Horizontal repeating border strip: the edge of a limestone shelf dropping a short
way into perfectly still glassy green-teal water, the stone lip undercut and
pitted by salt, the water flat as a mirror with a thin pale reflection line. No
waves, no foam. Isolated strip on flat #00FF00, no ground beneath, tileable
left-to-right, ~55-degree top-down, one hard light from the right, no shadow
drawn, 512x256.
PALETTE: limestone #E4DECB / #C2B9A2, water #6FA8A0 / #4E8F86, reflection
#F0EAD9.
```

_Заметки:_

### 2.2 Пропы

#### [ ] `public/art/props/oar-forest.png` — группа вёсел, воткнутых в камень · в 130

![](../public/art/props/oar-forest.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A cluster of seven or eight long ship's oars driven upright into cracked stone,
leaning at different angles, blades up, some splintered, faded rope still tied
around two of them. Taller than a man.
PALETTE: sun-bleached wood #C9C3AE / #9C8E72, rope #E4DECB, dark split #4F4C48.
```

_Заметки:_

#### [ ] `public/art/props/wreck-ribs.png` — шпангоуты корабля, торчащие из камня · ш 170

![](../public/art/props/wreck-ribs.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
The rib frames of a wrecked galley rising out of stone: a row of curved timber
ribs with the planking gone, one rib snapped, barnacles and dried weed clinging
low, the keel line visible. Wide and skeletal.
PALETTE: waterlogged timber #6E6A63 / #4A3B2C, bleached edge #C9C3AE, dried weed
#7A6438.
```

_Заметки:_

#### [ ] `public/art/props/marble-steps.png` — мраморные ступени, обрывающиеся в воздухе · ш 120

![](../public/art/props/marble-steps.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A short flight of marble steps that begins on the ground and ends in mid air,
going nowhere: five worn treads, the topmost broken off, salt-eaten edges, a
fallen baluster beside them.
PALETTE: marble #E4DECB / #C2B9A2 / #A8A08C, dark joint #6E6A63.
```

_Заметки:_

#### [ ] `public/art/props/siren-nest.png` — гнездо из костей, волос и обрывков парусины · в 70

![](../public/art/props/siren-nest.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A huge nest built on a low rock: woven from human bones, long dark hair, torn
sailcloth and rope, lined with feathers, one bronze cup tangled in the weave.
Wider than tall.
PALETTE: bone #F0EAD9 / #C2B9A2, hair #14161C, sailcloth #E4DECB, feather honey
accent #E2A93B, bronze #B87333.
```

_Заметки:_

#### [ ] `public/art/props/salt-pool.png` — солёная лужа-зеркало · ш 100, плоский

![](../public/art/props/salt-pool.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A shallow salt pool in limestone seen from directly above, lying FLAT on the
ground: still teal water with a white salt rim, a perfect mirror surface showing a
pale sky reflection, a few bones lying just under the water. No height.
PALETTE: water #6FA8A0 / #4E8F86, salt rim #F0EAD9, submerged bone #C2B9A2.
```

_Заметки:_

#### [ ] `public/art/props/bone-field.png` — россыпь костей и черепов, плоская · ш 90, низкий

![](../public/art/props/bone-field.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
A scatter of human bones lying flat on stone, seen from above: ribs, long bones
and two skulls, spread out and picked clean, no heap and almost no height, dark
hollow eye sockets.
PALETTE: bone #F0EAD9 / #C2B9A2, hollows #4F4C48.
```

_Заметки:_

### 2.3 Враги и босс

#### [ ] `public/art/entities/sirens-normal.png` — обычный враг

![](../public/art/entities/sirens-normal.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
An enchanted sailor: an emaciated figure with ribs showing, eyes closed, walking
forward toward a sound. Two clear WHITE PLUGS OF WAX in his ears — the most
readable detail on the figure. Frayed ropes hang from his shoulders where he tied
himself. Torn tunic, bare feet.
PALETTE: near-black body #080D14, wax #F0EAD9, rope #E4DECB, tunic #C2B9A2, dry
skin highlight #E8DCC8.
```

_Заметки:_

#### [ ] `public/art/entities/sirens-elite.png` — элита

![](../public/art/entities/sirens-elite.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Same enchanted-sailor family, one rank up: the ropes now twisted into thick
bindings across the chest, a broken oar blade lashed on as improvised armour, wax
spread over half the face, broader and heavier.
PALETTE: as above plus honey wax #E2A93B.
```

_Заметки:_

#### [ ] `public/art/entities/sirens-miniboss.png` — мини-босс

![](../public/art/entities/sirens-miniboss.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Same family, half merged with the nest: feathers pushing through the skin of the
arms and back, arms grown long, standing hunched in a bird-like crouch, bone
fragments woven into what is left of his clothing. Twice the size of the base
figure.
PALETTE: as above plus feather #C2B9A2 and honey #E2A93B.
```

_Заметки:_

#### [ ] `public/art/entities/boss-sirens.png` — БОСС · босс — ТРИ ФИГУРЫ В ОДНОМ ФАЙЛЕ

![](../public/art/entities/boss-sirens.png)

<sub>объект собирается в Blender — `ART_RUNBOOK.md`</sub>

```
Boss character: the Sirens — THREE figures standing in a triangle, drawn in one
image. Each has the body and taloned legs of a large bird, folded wings hanging
like a cloak, and a woman's face. The left one holds a lyre, the right one a
double flute, the centre one simply sings with her mouth open unnaturally wide.
Motionless, facing the viewer, feet gripping stone.
PALETTE: near-black plumage #080D14, pale faces and arms #F0EAD9, honey feather
accent #E2A93B, bone #C2B9A2, bronze lyre #B87333.
```

_Заметки:_

---

## 3. РЕФЕРЕНСЫ

Сюда — всё, от чего отталкиваемся: скриншоты игр, фотографии мест, керамика,
наброски. Файлы класть в `islands/ref/sirens/`, вставлять строкой
`![подпись](ref/sirens/имя.png)`.

<!-- ![](ref/sirens/имя.png) -->

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

[← остров 7](07-hades.md) · [все острова](../ISLANDS.md) · [общие правила](../ISLANDS.md#1-общие-правила) · [остров 9 →](09-strait.md)
