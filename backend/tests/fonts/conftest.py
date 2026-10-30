from . import INTER
from collections.abc import Callable
from pathlib import Path
from plone import api

import pytest
import shutil


@pytest.fixture
def extra_font_dir(tmp_path) -> Path:
    """An extra font directory with two fonts and some noise.

    - ``My Font.ttf`` → token ``my-font`` (a copy of Inter)
    - ``Inter.otf`` → token ``inter``, which collides with a bundled font
    - ``broken.ttf`` → not a font: falls back to its file name for the title
    - ``readme.txt`` and a ``sub`` directory → ignored
    """
    directory = tmp_path / "fonts"
    directory.mkdir()
    shutil.copy(INTER, directory / "My Font.ttf")
    shutil.copy(INTER, directory / "Inter.otf")
    (directory / "broken.ttf").write_bytes(b"not a font")
    (directory / "readme.txt").write_text("hello")
    (directory / "sub").mkdir()
    (directory / "___.ttf").write_bytes(b"")
    return directory


@pytest.fixture
def set_extra_dir(portal) -> Callable[[str], None]:
    """Set the extra font directory registry record."""

    def func(value: str) -> None:
        api.portal.set_registry_record("collective.certificates.extra_font_dir", value)

    return func
