from collective.certificates.blueprint import metrics
from collective.certificates.fonts.registry import BUNDLED

import pytest


GARAMOND_BOLD = BUNDLED["eb-garamond-bold"].path
INTER = BUNDLED["inter"].path
TEXT = "26/05/2026 — 09/06/2026 (32 h)"


class TestMeasure:
    def test_units_per_em(self):
        assert metrics.text_units(INTER, "")[1] == 2048
        assert metrics.text_units(GARAMOND_BOLD, "")[1] == 1000

    def test_width_scales_linearly(self):
        one = metrics.text_width(INTER, "Hamburg", 10)
        assert metrics.text_width(INTER, "Hamburg", 20) == pytest.approx(2 * one)

    def test_missing_glyph_uses_notdef(self):
        """A code point outside the cmap measures as .notdef."""
        _, advances, notdef = metrics.font_table(INTER)
        assert 0x10FFFF not in advances
        assert metrics.text_units(INTER, "\U0010ffff")[0] == notdef

    def test_cached(self):
        assert metrics.font_table(INTER) is metrics.font_table(INTER)


class TestFitSize:
    def test_boundary(self):
        """84 fits 1200px (1194.6), 85 does not (1208.8)."""
        assert metrics.fit_size(GARAMOND_BOLD, TEXT, 200, 1200) == 84
        assert metrics.text_width(GARAMOND_BOLD, TEXT, 84) <= 1200
        assert metrics.text_width(GARAMOND_BOLD, TEXT, 85) > 1200

    def test_fits_already(self):
        assert metrics.fit_size(INTER, "Hi", 40, 10000) == 40

    def test_never_below_one(self):
        assert metrics.fit_size(INTER, "W" * 500, 40, 1) == 1

    def test_empty_text(self):
        assert metrics.fit_size(INTER, "", 40, 1) == 40
