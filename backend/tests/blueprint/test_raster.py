from collective.certificates.blueprint import raster
from collective.certificates.fonts.registry import BUNDLED
from collective.certificates.fonts.registry import render_copy
from PIL import Image

import io
import pytest
import re


def svg_text(family: str) -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100" viewBox="0 0 400 100">'
        '<rect width="400" height="100" fill="#ffffff"/>'
        f'<text x="10" y="70" font-family="{family}" font-size="50" fill="#ff0000">Hamburg</text>'
        "</svg>"
    )


def red_pixels(png: bytes) -> int:
    image = Image.open(io.BytesIO(png)).convert("RGB")
    return sum(1 for r, g, b in image.getdata() if r > 200 and g < 80 and b < 80)


class TestSvgToPng:
    @pytest.fixture(autouse=True)
    def _setup(self, tmp_path):
        self.fonts = [str(render_copy(BUNDLED["inter-bold"], tmp_path))]

    def test_size(self):
        png = raster.svg_to_png(svg_text("inter-bold"), self.fonts)
        assert Image.open(io.BytesIO(png)).size == (400, 100)

    def test_token_family_renders(self):
        """The renamed copy is found by token."""
        assert red_pixels(raster.svg_to_png(svg_text("inter-bold"), self.fonts)) > 500

    def test_unknown_family_draws_nothing(self):
        """resvg silently skips text in an unknown family: validation must catch it first."""
        assert red_pixels(raster.svg_to_png(svg_text("inter"), self.fonts)) == 0

    def test_no_system_fonts(self):
        """System fonts are not used, even for a generic family."""
        assert red_pixels(raster.svg_to_png(svg_text("sans-serif"), self.fonts)) == 0


class TestPngToPdf:
    def test_page_size(self):
        buffer = io.BytesIO()
        Image.new("RGBA", (600, 300), (255, 0, 0, 128)).save(buffer, format="PNG")
        pdf = raster.png_to_pdf(buffer.getvalue(), 300)
        assert pdf.startswith(b"%PDF")
        # 600px at 300dpi = 2in = 144pt wide, 72pt high.
        box = re.search(rb"/MediaBox \[ ([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) \]", pdf)
        assert [float(value) for value in box.groups()] == [0, 0, 144, 72]
        assert len(re.findall(rb"/Type\s*/Page(?!s)", pdf)) == 1
