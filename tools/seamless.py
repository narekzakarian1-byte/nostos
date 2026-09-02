"""
Делает тайл бесшовным по обеим осям.

    python3 tools/seamless.py <вход.png> <выход.png> [сторона]

Генератор рисует «текстуру», но не тайл: стык виден сразу, а тайл земли всего
вчетверо меньше карты (ISLANDS.md §1.1), и повтор на экране есть всегда.

Приём стандартный: сдвинуть картинку по кругу на полразмера — тогда бывшие
края оказываются посередине, — и замазать крестовину копией со сдвигом,
растворив её мягкой маской. По краям после сдвига лежит то, что раньше было
серединой, поэтому склейка сходится сама.
"""
from __future__ import annotations

import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter


def seamless(src: str, dst: str, side: int | None = None) -> None:
    im = Image.open(src).convert('RGB')
    if side:
        im = im.resize((side, side), Image.LANCZOS)
    w, h = im.size

    rolled = ImageChops.offset(im, w // 2, h // 2)

    # Маска крестовины: полосы вдоль бывших краёв, размытые до плавного перехода.
    band = max(4, min(w, h) // 8)
    mask = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.rectangle([w // 2 - band, 0, w // 2 + band, h], fill=255)
    draw.rectangle([0, h // 2 - band, w, h // 2 + band], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(band / 2))

    # Чем замазываем: та же картинка, сдвинутая по диагонали на четверть.
    # Она из того же тайла, поэтому масштаб и палитра совпадают точно.
    patch = ImageChops.offset(rolled, w // 4, h // 4)
    out = Image.composite(patch, rolled, mask)

    out.save(dst)
    print(f'{im.size} -> бесшовный {out.size}  {dst}')


if __name__ == '__main__':
    seamless(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else None)
