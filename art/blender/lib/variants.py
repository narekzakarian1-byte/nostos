"""Детерминированные вариации по сиду.

Тот же принцип, что core/Rng.ts в игре: случайность обязана быть
воспроизводимой. Иначе перерендер того же ассета даёт другой файл, и понять,
что именно изменилось, невозможно.

Реализация нарочно не через random.Random: нужен чистый хеш, дающий одно и то
же число для одной и той же пары (сид, имя), в любом порядке вызовов.
"""

from __future__ import annotations

import hashlib


def unit(seed: int, key: str = "") -> float:
    """Число в [0, 1). Зависит только от аргументов, не от истории вызовов."""
    digest = hashlib.sha256(f"{seed}:{key}".encode("utf-8")).digest()
    return int.from_bytes(digest[:6], "big") / float(1 << 48)


def jitter(seed: int, key: str = "") -> float:
    """Число в [-1, 1). Основной инструмент вариации."""
    return unit(seed, key) * 2.0 - 1.0


def pick(seed: int, key: str, options: list):
    return options[int(unit(seed, key) * len(options)) % len(options)]


def chance(seed: int, key: str, probability: float) -> bool:
    return unit(seed, key) < probability


def spread(seed: int, key: str, count: int) -> list[float]:
    """count различных отклонений в [-1, 1) — по одному на грань или блок."""
    return [jitter(seed, f"{key}.{i}") for i in range(count)]
