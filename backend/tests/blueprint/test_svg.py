from .. import BLUEPRINTS
from .. import load_blueprint
from .. import RESOURCES
from collective.certificates.blueprint import svg
from collective.certificates.blueprint.fields import FIELDS
from collective.certificates.blueprint.template import TemplateRenderError
from collective.certificates.utils.rendering import shrink_size

import pytest


GOLDEN_ASSETS = {"background": "asset:background", "signature": "asset:signature"}
#: Every field, computed ones included: goldens render blueprints directly.
DATA = {field.token: field.sample for field in FIELDS}


class TestGoldens:
    @pytest.mark.parametrize("name", BLUEPRINTS)
    def test_golden(self, portal, name: str):
        """The SVG matches the committed golden byte for byte."""
        expected = (RESOURCES / "expected-svg" / f"{name}.svg").read_text(
            encoding="utf-8"
        )
        result = svg.blueprint_to_svg(
            load_blueprint(name), DATA, GOLDEN_ASSETS, size=shrink_size
        )
        assert result == expected

    @pytest.mark.parametrize("name", BLUEPRINTS)
    def test_deterministic(self, portal, name: str):
        first = svg.blueprint_to_svg(
            load_blueprint(name), DATA, GOLDEN_ASSETS, size=shrink_size
        )
        second = svg.blueprint_to_svg(
            load_blueprint(name), DATA, GOLDEN_ASSETS, size=shrink_size
        )
        assert first == second


class TestDocument:
    def test_lines(self):
        """One element per line: open, background, elements, close."""
        result = svg.blueprint_to_svg(load_blueprint("minimal"), DATA, GOLDEN_ASSETS)
        lines = result.splitlines()
        assert lines[0].startswith(
            '<svg xmlns="http://www.w3.org/2000/svg" width="3508"'
        )
        assert lines[1].startswith('<image x="0" y="0" width="3508" height="2480"')
        assert lines[2].startswith('<text id="name"')
        assert lines[3] == "</svg>"
        assert result.endswith("</svg>\n")

    def test_without_background(self):
        result = svg.blueprint_to_svg(load_blueprint("minimal"), DATA, {})
        assert "<image" not in result

    def test_missing_asset_skipped(self):
        """An image element whose asset is absent is not drawn."""
        result = svg.blueprint_to_svg(
            load_blueprint("sample"), DATA, {"background": "bg"}
        )
        assert 'id="signature"' not in result
        assert 'id="signer"' in result

    def test_nominal_size(self):
        """Without a size function, fit is ignored."""
        result = svg.blueprint_to_svg(load_blueprint("every-element"), DATA, {})
        assert (
            'id="shrunk" x="100" y="1400" font-family="eb-garamond-bold" font-size="200"'
            in result
        )

    def test_render_error(self):
        with pytest.raises(TemplateRenderError):
            svg.blueprint_to_svg(load_blueprint("minimal"), {}, {})

    def test_href_escaped(self):
        result = svg.blueprint_to_svg(
            load_blueprint("minimal"), DATA, {"background": 'a"b&c'}
        )
        assert 'href="a&quot;b&amp;c"' in result


class TestEscape:
    @pytest.mark.parametrize(
        "raw,expected",
        [
            ("plain", "plain"),
            ("<&>", "&lt;&amp;&gt;"),
            ("\"'", "&quot;&#39;"),
            ("Château — ✓", "Château — ✓"),
        ],
    )
    def test_escape(self, raw: str, expected: str):
        assert svg.escape(raw) == expected
