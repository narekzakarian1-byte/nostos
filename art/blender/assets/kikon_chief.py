"""Кикон, тир «chief». Сборка общая — assets/_kikon.py."""

from __future__ import annotations

from assets import _kikon

KIND = "figure"
ID = "kikon-chief"
VERSION = 1


def bones(ctx):
    return _kikon.bones("chief")
