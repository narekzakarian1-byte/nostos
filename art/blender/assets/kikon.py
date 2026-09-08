"""Кикон, тир «normal». Сборка общая — assets/_kikon.py."""

from __future__ import annotations

from assets import _kikon

KIND = "figure"
ID = "kikon"
VERSION = 1


def bones(ctx):
    return _kikon.bones("normal")
