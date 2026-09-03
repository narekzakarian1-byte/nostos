"""
Вырез хромакейного фона из сгенерированной картинки.

    python3 tools/cutout.py <вход.png> <выход.png> [макс_сторона]

Зелёным считается пиксель, у которого зелёный канал доминирует над красным и
синим. У кремового мрамора, синей тени и терракоты доминанты нет, поэтому
объект не страдает — в отличие от выреза по одному конкретному цвету, на
котором сыпались olive.png и старые ruin-gate.png.

Требование к промпту: замкнутая тёмная обводка по контуру. Она поглощает
полупрозрачную кромку, и зелёного ореола на светлой земле не остаётся.
"""
from __future__ import annotations

import sys
from PIL import Image, ImageChops

# Ниже LOW пиксель считается объектом, выше HIGH — фоном, между — кромка,
# где прозрачность растёт плавно. Иначе край получается рваным.
LOW, HIGH = 25, 90


def cutout(src: str, dst: str, max_side: int | None) -> None:
    im = Image.open(src).convert('RGB')
    r, g, b = im.split()
    max_rb = ImageChops.lighter(r, b)
    greenness = ImageChops.subtract(g, max_rb)

    def to_alpha(v: int) -> int:
        if v <= LOW:
            return 255
        if v >= HIGH:
            return 0
        return int(255 * (HIGH - v) / (HIGH - LOW))

    alpha = Image.eval(greenness, to_alpha)
    # Зелёный отлив на кромке: зелёный канал не может быть выше максимума из
    # красного и синего, иначе по контуру идёт салатовая кайма.
    out = Image.merge('RGBA', (r, ImageChops.darker(g, max_rb), b, alpha))

    # Рамка считается по НЕПРОЗРАЧНОМУ, а не по всему, где альфа больше нуля.
    # Мягкая тень генератора оставляет по краю кадра единичные пиксели с
    # альфой в пару единиц, и getbbox по ним возвращает весь квадрат: объект
    # уезжает в середину огромного пустого поля, а движок ставит на землю
    # низ КАРТИНКИ — корабль повисает в воздухе и оказывается втрое меньше.
    solid = alpha.point(lambda v: 255 if v > 32 else 0)
    box = solid.getbbox()
    if box:
        out = out.crop(box)
    if max_side and max(out.size) > max_side:
        scale = max_side / max(out.size)
        out = out.resize((round(out.width * scale), round(out.height * scale)), Image.LANCZOS)

    out.save(dst)
    print(f'{im.size} -> {out.size}  bbox={box}')


if __name__ == '__main__':
    cutout(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else None)
