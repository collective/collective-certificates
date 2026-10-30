from .. import load_json
from collective.certificates.blueprint import template
from collective.certificates.blueprint.template import Placeholder
from collective.certificates.blueprint.template import TemplateRenderError
from collective.certificates.blueprint.template import TemplateSyntaxError

import pytest


VECTORS = load_json("template-vectors.json")
CASES = VECTORS["cases"]
IDS = [f"{i}:{case['content']}" for i, case in enumerate(CASES)]


def case_data(case: dict) -> dict:
    return {**VECTORS["data"], **case.get("data", {})}


class TestVectors:
    @pytest.mark.parametrize("case", CASES, ids=IDS)
    def test_render(self, case: dict):
        """Each vector renders as expected, or fails the expected way."""
        args = (case["content"], case_data(case), case.get("date_format", "%d/%m/%Y"))
        if case.get("error") == "syntax":
            with pytest.raises(TemplateSyntaxError):
                template.render(*args)
        elif case.get("error") == "render":
            with pytest.raises(TemplateRenderError):
                template.render(*args)
        else:
            assert template.render(*args) == case["expected"]

    @pytest.mark.parametrize(
        "case", [c for c in CASES if "tokens" in c], ids=lambda c: c["content"]
    )
    def test_tokens(self, case: dict):
        """Tokens are the distinct field names referenced."""
        assert template.tokens(case["content"]) == set(case["tokens"])


class TestParse:
    def test_parts(self):
        """Literals and placeholders alternate, literals merged."""
        assert template.parse("a {{ x|upper }}b{{y}}") == [
            "a ",
            Placeholder("x", "upper"),
            "b",
            Placeholder("y", None),
        ]

    def test_unterminated_merges_literal(self):
        """An unterminated '{{' joins the preceding literal."""
        assert template.parse("{{ x }} and {{ y") == [
            Placeholder("x", None),
            " and {{ y",
        ]

    def test_empty(self):
        """Empty content has no parts."""
        assert template.parse("") == []


class TestDates:
    @pytest.mark.parametrize(
        "fmt,expected",
        [
            ("%d/%m/%Y", "06/05/2026"),
            ("%-d", "6"),
            ("%B", "Mai"),
            ("100%%", "100%"),
        ],
    )
    def test_format_date(self, fmt: str, expected: str):
        months = (
            "Jan",
            "Feb",
            "Mär",
            "Apr",
            "Mai",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Okt",
            "Nov",
            "Dez",
        )
        assert template.format_date("2026-05-06", fmt, months) == expected

    @pytest.mark.parametrize(
        "fmt,expected",
        [
            ("%d/%m/%Y", []),
            ("%A %d %H", ["%A", "%H"]),
            ("%-m", ["%-"]),
            ("trailing %", ["%"]),
        ],
    )
    def test_invalid_directives(self, fmt: str, expected: list):
        assert template.invalid_date_directives(fmt) == expected

    def test_apply_unknown_filter(self):
        with pytest.raises(TemplateRenderError, match="Unknown filter"):
            template.apply_filter("x", "title", "%d", template.MONTHS_EN)
