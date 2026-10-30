"""Text measurement with fontTools, and ``fit: shrink``.

Widths are the sum of the glyphs' advance widths, without kerning or
shaping: close to what the renderer draws for Latin text, and the same
model the designer approximates with ``canvas.measureText``. The server's
result is the one that ends up in the certificate.
"""

from fontTools.ttLib import TTFont
from functools import cache
from pathlib import Path


@cache
def font_table(path: Path) -> tuple[int, dict[int, int], int]:
    """Read what measuring needs from a font file.

    :param path: Font file.
    :returns: ``(units_per_em, advance by code point, notdef advance)``.
    """
    font = TTFont(path, lazy=True)
    hmtx = font["hmtx"].metrics
    cmap = font.getBestCmap() or {}
    advances = {code: hmtx[glyph][0] for code, glyph in cmap.items() if glyph in hmtx}
    notdef = hmtx[".notdef"][0] if ".notdef" in hmtx else 0
    return font["head"].unitsPerEm, advances, notdef


def text_units(path: Path, text: str) -> tuple[int, int]:
    """Measure text in font units.

    :param path: Font file.
    :param text: Text to measure.
    :returns: ``(width in font units, units per em)``.
    """
    units_per_em, advances, notdef = font_table(path)
    return sum(advances.get(ord(char), notdef) for char in text), units_per_em


def text_width(path: Path, text: str, size: int) -> float:
    """Measure text in pixels.

    :param path: Font file.
    :param text: Text to measure.
    :param size: Font size in pixels.
    :returns: The advance width of the text.
    """
    width, units_per_em = text_units(path, text)
    return width * size / units_per_em


def fit_size(path: Path, text: str, size: int, max_width: int) -> int:
    """Return the largest size not above ``size`` at which text fits.

    Equivalent to stepping down by 1 from ``size`` until the width is at
    most ``max_width``, computed exactly in integers.

    :param path: Font file.
    :param text: Rendered text.
    :param size: Preferred size.
    :param max_width: Available width in pixels.
    :returns: A size between 1 and ``size``.
    """
    width, units_per_em = text_units(path, text)
    if width == 0:
        return size
    return max(1, min(size, (max_width * units_per_em) // width))
