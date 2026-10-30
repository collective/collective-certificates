"""SVG → PNG with resvg, and PNG → one-page PDF with Pillow."""

from PIL import Image

import io
import resvg_py


def svg_to_png(svg: str, font_files: list[str]) -> bytes:
    """Rasterize an SVG at its own size.

    System fonts are not loaded: the output depends only on the files given,
    which is what makes it reproducible.

    :param svg: SVG document; images must be data URIs.
    :param font_files: Fonts whose family names equal the tokens the SVG
        uses.
    :returns: PNG bytes.
    """
    return bytes(
        resvg_py.svg_to_bytes(
            svg_string=svg, font_files=font_files, skip_system_fonts=True
        )
    )


def png_to_pdf(png: bytes, dpi: int) -> bytes:
    """Embed a PNG as the only page of a PDF.

    :param png: PNG bytes.
    :param dpi: Resolution; the page measures pixels / dpi inches.
    :returns: PDF bytes.
    """
    image = Image.open(io.BytesIO(png)).convert("RGBA")
    page = Image.new("RGB", image.size, (255, 255, 255))
    page.paste(image, mask=image.getchannel("A"))
    out = io.BytesIO()
    page.save(out, format="PDF", resolution=dpi)
    return out.getvalue()
