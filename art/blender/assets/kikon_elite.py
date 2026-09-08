"""Кикон, тир «elite». Сборка общая — assets/_kikon.py."""

from __future__ import annotations

from assets import _kikon

KIND = "figure"
ID = "kikon-elite"
VERSION = 1


def bones(ctx):
    return _kikon.bones("elite")
