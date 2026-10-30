from .. import load_blueprint
from .. import load_json
from .. import PAGE
from collective.certificates.blueprint.fields import MissingFields
from collective.certificates.utils import rendering
from PIL import Image
from plone import api

import io
import pytest
import re


DATA = load_json("sample/sample-data.json")


class TestMonths:
    def test_default_language(self, portal):
        assert rendering.month_names()[4] == "May"

    def test_untranslated_language_falls_back(self, portal):
        assert rendering.month_names("xx")[0] == "January"

    def test_twelve(self, portal):
        assert len(rendering.month_names("en")) == 12

    def test_portuguese(self, portal):
        assert rendering.month_names("pt_BR")[4] == "maio"

    def test_site_language(self, portal, create_template):
        """%B follows the site's default language."""
        api.portal.set_registry_record("plone.default_language", "pt-br")
        template = create_template(portal, date_format="long-day-first")
        svg = template.svg(DATA)
        assert "from 26 maio 2026 to 9 junho 2026" in svg

    @pytest.mark.parametrize(
        "token,expected",
        [
            ("day-month-year", "from 26/05/2026 to 09/06/2026"),
            ("long", "from May 26, 2026 to June 9, 2026"),
        ],
    )
    def test_date_format(self, portal, create_template, token: str, expected: str):
        """The template's date format token picks the pattern."""
        template = create_template(portal, date_format=token)
        assert expected in template.svg(DATA)


class TestShrinkSize:
    def test_no_fit(self, portal):
        element = load_blueprint("sample")["elements"][0]
        assert rendering.shrink_size(element, "x" * 500) == 64

    def test_fit_without_max_width(self, portal):
        element = {**load_blueprint("sample")["elements"][0], "fit": "shrink"}
        assert rendering.shrink_size(element, "x" * 500) == 64

    def test_shrinks(self, portal):
        element = load_blueprint("sample")["elements"][1]
        assert rendering.shrink_size(element, "W" * 60) < element["size"]


class TestTemplate:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, create_template):
        self.portal = portal
        self.template = create_template(portal)

    def test_svg_inlines_images(self):
        result = self.template.svg(DATA)
        hrefs = re.findall(r'href="([^"]{0,30})', result)
        assert hrefs == [
            "data:image/png;base64,iVBORw0K",
            "data:image/png;base64,iVBORw0K",
        ]

    def test_svg_custom_assets(self):
        result = self.template.svg(DATA, {"background": "bg.png"})
        assert 'href="bg.png"' in result
        assert 'id="signature"' not in result

    def test_svg_missing_fields(self):
        with pytest.raises(MissingFields) as exc:
            self.template.svg({"full_name": "Ana"})
        assert exc.value.missing == [
            "event_end_date",
            "event_name",
            "event_start_date",
            "responsible_person",
            "total_hours",
        ]

    def test_png_page_size(self):
        png = self.template.render(DATA, "png")
        image = Image.open(io.BytesIO(png))
        assert image.format == "PNG"
        assert image.size == PAGE

    def test_png_draws_over_background(self):
        """The certificate differs from the background alone."""
        png = Image.open(io.BytesIO(self.template.render(DATA, "png"))).convert("RGB")
        background = Image.open(self.template.background.open()).convert("RGB")
        assert png.tobytes() != background.tobytes()

    def test_text_color_inside_name_box(self):
        """The name is drawn in its color where the golden puts it."""
        png = Image.open(io.BytesIO(self.template.render(DATA, "png"))).convert("RGB")
        region = png.crop((190, 790, 2390, 920))
        assert any(
            abs(r - 31) < 8 and abs(g - 84) < 8 and abs(b - 122) < 8
            for r, g, b in region.getdata()
        )

    def test_pdf(self):
        pdf = self.template.render(DATA, "pdf")
        assert pdf.startswith(b"%PDF")
        assert len(re.findall(rb"/Type\s*/Page(?!s)", pdf)) == 1

    def test_pdf_dpi_from_registry(self):
        api.portal.set_registry_record(rendering.PDF_DPI_RECORD, 150)
        pdf = self.template.render(DATA, "pdf")
        box = re.search(rb"/MediaBox \[ ([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) \]", pdf)
        # 3508px at 150dpi = 23.39in = 1683.84pt
        assert float(box.group(3)) == pytest.approx(3508 / 150 * 72)

    def test_unknown_format(self):
        with pytest.raises(ValueError, match="Unknown format"):
            self.template.render(DATA, "gif")

    def test_font_tokens(self):
        assert rendering.font_tokens(self.template) == {
            "inter",
            "inter-bold",
            "eb-garamond-bold",
        }
