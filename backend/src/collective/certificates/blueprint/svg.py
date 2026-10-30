"""Blueprint + data → SVG, the format both sides agree on.

The output is deterministic and identical to the frontend's
``blueprintToSvg`` except for ``href`` values: one element per line, every
number an integer, attributes in a fixed order, and text escaped with
:func:`escape`. Fonts are referenced by token; the renderer maps tokens to
files (see :func:`collective.certificates.fonts.registry.render_files`).
"""

from collections.abc import Callable
from collective.certificates.blueprint.model import Blueprint
from collective.certificates.blueprint.model import ImageElement
from collective.certificates.blueprint.model import QrElement
from collective.certificates.blueprint.model import TextElement
from collective.certificates.blueprint.qrcode import qr_matrix
from collective.certificates.blueprint.qrcode import qr_path
from collective.certificates.blueprint.qrcode import QUIET_ZONE
from collective.certificates.blueprint.template import MONTHS_EN
from collective.certificates.blueprint.template import render


#: Returns the size a text element is drawn at, given its rendered text.
SizeFunction = Callable[[TextElement, str], int]

_ESCAPES = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}


def escape(value: str) -> str:
    """Escape text for both element content and attribute values.

    :param value: Raw text.
    :returns: Text with ``& < > " '`` replaced by entities.
    """
    return "".join(_ESCAPES.get(char, char) for char in value)


def nominal_size(element: TextElement, text: str) -> int:
    """Size function that ignores ``fit``.

    :param element: Text element.
    :param text: Rendered text.
    :returns: The element's ``size``.
    """
    return element["size"]


def text_svg(element: TextElement, text: str, size: int) -> str:
    """Draw a text element.

    :param element: Text element.
    :param text: Rendered text.
    :param size: Font size to draw at.
    :returns: One ``<text>`` element.
    """
    return (
        f'<text id="{element["id"]}" x="{element["x"]}" y="{element["y"]}" '
        f'font-family="{element["font"]}" font-size="{size}" '
        f'fill="{element["color"]}" text-anchor="{element["anchor"]}" '
        f'dominant-baseline="{element["baseline"]}">{escape(text)}</text>'
    )


def image_svg(element: ImageElement, href: str) -> str:
    """Draw an image element, fitted inside its box.

    :param element: Image element.
    :param href: Image URL.
    :returns: One ``<image>`` element.
    """
    return (
        f'<image id="{element["id"]}" x="{element["x"]}" y="{element["y"]}" '
        f'width="{element["width"]}" height="{element["height"]}" '
        f'href="{escape(href)}" preserveAspectRatio="xMidYMid meet"/>'
    )


def qr_svg(element: QrElement, text: str) -> str:
    """Draw a QR element as a nested SVG in module units.

    :param element: QR element.
    :param text: Rendered content.
    :returns: One nested ``<svg>`` element.
    """
    matrix = qr_matrix(text, element["ec"])
    modules = len(matrix) + 2 * QUIET_ZONE
    return (
        f'<svg id="{element["id"]}" x="{element["x"]}" y="{element["y"]}" '
        f'width="{element["size"]}" height="{element["size"]}" '
        f'viewBox="0 0 {modules} {modules}" shape-rendering="crispEdges">'
        f'<rect width="{modules}" height="{modules}" fill="{element["bg"]}"/>'
        f'<path d="{qr_path(matrix)}" fill="{element["fg"]}"/></svg>'
    )


def blueprint_to_svg(
    blueprint: Blueprint,
    data: dict[str, str],
    assets: dict[str, str],
    date_format: str = "%d/%m/%Y",
    months: tuple[str, ...] = MONTHS_EN,
    size: SizeFunction = nominal_size,
) -> str:
    """Render a blueprint to SVG.

    :param blueprint: A valid blueprint.
    :param data: Field values by token.
    :param assets: Image URLs by asset name; ``background`` is drawn under
        everything, and image elements whose asset is missing are skipped.
    :param date_format: Format used by the ``date`` filter.
    :param months: Month names used by ``%B``.
    :param size: Decides the size of each text element (``fit: shrink``).
    :returns: The SVG document, newline-terminated.
    :raises collective.certificates.blueprint.template.TemplateRenderError:
        When content cannot be rendered with ``data``.
    """
    width = blueprint["page"]["width"]
    height = blueprint["page"]["height"]
    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" '
        f'height="{height}" viewBox="0 0 {width} {height}">'
    ]
    if "background" in assets:
        lines.append(
            f'<image x="0" y="0" width="{width}" height="{height}" '
            f'href="{escape(assets["background"])}" preserveAspectRatio="none"/>'
        )
    for element in blueprint["elements"]:
        if element["type"] == "text":
            text = render(element["content"], data, date_format, months)
            lines.append(text_svg(element, text, size(element, text)))
        elif element["type"] == "image":
            if element["asset"] in assets:
                lines.append(image_svg(element, assets[element["asset"]]))
        else:
            text = render(element["content"], data, date_format, months)
            lines.append(qr_svg(element, text))
    lines.append("</svg>")
    return "\n".join(lines) + "\n"
