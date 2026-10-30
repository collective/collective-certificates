from collective.certificates.blueprint import dateformats

import pytest


class TestDatePattern:
    @pytest.mark.parametrize(
        "token,pattern",
        [
            ("day-month-year", "%d/%m/%Y"),
            ("month-day-year", "%m/%d/%Y"),
            ("iso", "%Y-%m-%d"),
            ("long", "%B %-d, %Y"),
            ("long-day-first", "%-d %B %Y"),
        ],
    )
    def test_known(self, token: str, pattern: str):
        assert dateformats.date_pattern(token) == pattern

    @pytest.mark.parametrize("token", [None, "", "%d/%m/%Y", "short"])
    def test_unknown(self, token):
        """A value stored before the vocabulary falls back to the default."""
        assert dateformats.date_pattern(token) == "%d/%m/%Y"

    def test_default_is_a_format(self):
        assert dateformats.DEFAULT_DATE_FORMAT in dateformats.DATE_PATTERNS
