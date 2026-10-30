from .. import BLUEPRINTS
from .. import load_blueprint
from .. import load_json
from .. import PAGE
from .. import RESOURCES
from . import ASSETS
from . import FONTS
from collective.certificates.blueprint.dateformats import DATE_PATTERNS
from collective.certificates.blueprint.dateformats import DEFAULT_DATE_FORMAT
from collective.certificates.blueprint.fields import FIELDS

import pytest
import re


CONTEXT = load_json("contract-context.json")
FONT_SIZE = re.compile(r'<text id="([^"]+)"[^>]* font-size="(\d+)"')


class TestContractContext:
    def test_fonts(self):
        """The fonts are the bundled ones, as the validation tests use."""
        assert set(CONTEXT["fonts"]) == FONTS

    def test_fields(self):
        """Every field, computed ones included, with its kind and sample."""
        assert CONTEXT["fields"] == {
            field.token: {"kind": field.kind, "sample": field.sample}
            for field in FIELDS
        }

    def test_page_and_assets(self):
        """Page and assets match the validation tests' context."""
        assert tuple(CONTEXT["page"]) == PAGE
        assert set(CONTEXT["assets"]) == ASSETS
        assert set(CONTEXT["golden_assets"]) == ASSETS

    def test_date_formats(self):
        """Every date format token with its pattern, and the default."""
        assert CONTEXT["date_formats"] == DATE_PATTERNS
        assert CONTEXT["default_date_format"] == DEFAULT_DATE_FORMAT

    @pytest.mark.parametrize("name", BLUEPRINTS)
    def test_golden_sizes(self, name: str):
        """Sizes are the ones drawn in the golden, for every text element."""
        golden = (RESOURCES / "expected-svg" / f"{name}.svg").read_text(
            encoding="utf-8"
        )
        drawn = {eid: int(size) for eid, size in FONT_SIZE.findall(golden)}
        texts = {
            element["id"]
            for element in load_blueprint(name)["elements"]
            if element["type"] == "text"
        }
        assert set(drawn) == texts
        assert CONTEXT["golden_sizes"][name] == drawn
