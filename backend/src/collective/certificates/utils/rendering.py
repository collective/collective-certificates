"""Render a template with field values: SVG, PNG or PDF.

The SVG is :func:`collective.certificates.blueprint.svg.blueprint_to_svg`
with the template's images inlined as data URIs, ``fit: shrink`` measured
with the font files, and month names translated to the site's language.
"""

from collective.certificates import _
from collective.certificates.blueprint.dateformats import date_pattern
from collective.certificates.blueprint.fields import COMPUTED
from collective.certificates.blueprint.fields import MissingFields
from collective.certificates.blueprint.fields import SAMPLE_UID
from collective.certificates.blueprint.metrics import fit_size
from collective.certificates.blueprint.model import TextElement
from collective.certificates.blueprint.raster import png_to_pdf
from collective.certificates.blueprint.raster import svg_to_png
from collective.certificates.blueprint.svg import blueprint_to_svg
from collective.certificates.fonts.registry import all_fonts
from collective.certificates.fonts.registry import render_files
from plone import api
from typing import Any
from typing import Literal
from zope.i18n import translate

import base64


Format = Literal["png", "pdf"]

FORMATS: tuple[str, ...] = ("png", "pdf")

#: Registry record with the PDF resolution.
PDF_DPI_RECORD = "collective.certificates.pdf_dpi"

MONTHS = (
    _("month_1", default="January"),
    _("month_2", default="February"),
    _("month_3", default="March"),
    _("month_4", default="April"),
    _("month_5", default="May"),
    _("month_6", default="June"),
    _("month_7", default="July"),
    _("month_8", default="August"),
    _("month_9", default="September"),
    _("month_10", default="October"),
    _("month_11", default="November"),
    _("month_12", default="December"),
)


def month_names(language: str | None = None) -> tuple[str, ...]:
    """Return the month names in a language.

    :param language: Language code, Plone style (``pt-br``) or gettext style
        (``pt_BR``); defaults to the site's default language.
    :returns: Twelve names, January first.
    """
    language = language or api.portal.get_default_language()
    base, _sep, region = language.replace("_", "-").partition("-")
    target = f"{base}_{region.upper()}" if region else base
    return tuple(translate(month, target_language=target) for month in MONTHS)


def data_uri(image: Any) -> str:
    """Inline a stored image.

    :param image: A ``NamedBlobImage`` value.
    :returns: A ``data:`` URI.
    """
    encoded = base64.b64encode(image.data).decode("ascii")
    return f"data:{image.contentType};base64,{encoded}"


def shrink_size(element: TextElement, text: str) -> int:
    """Decide the drawn size of a text element.

    :param element: Text element.
    :param text: Rendered text.
    :returns: The fitted size for ``fit: shrink`` with ``max_width``, else
        the element's size.
    """
    if element.get("fit") != "shrink" or "max_width" not in element:
        return element["size"]
    spec = all_fonts()[element["font"]]
    return fit_size(spec.path, text, element["size"], element["max_width"])


def check_data(template: Any, data: dict[str, str]) -> None:
    """Make sure data has a value for every token callers must provide.

    :param template: A certificate template.
    :param data: Field values by token.
    :raises MissingFields: Listing the missing tokens; computed ones never
        count as missing.
    """
    missing = template.required_fields() - COMPUTED - set(data)
    if missing:
        raise MissingFields(missing)


def template_svg(
    template: Any, data: dict[str, str], assets: dict[str, str] | None = None
) -> str:
    """Render a template to SVG.

    :param template: A certificate template.
    :param data: Field values by token. Computed fields absent from it get
        sample values, so previews show a plausible QR code.
    :param assets: Image URLs by asset name; defaults to the template's
        images inlined as data URIs.
    :returns: The SVG document.
    :raises MissingFields: When data lacks tokens the blueprint uses.
    """
    check_data(template, data)
    values = {**template.computed_values(SAMPLE_UID), **data}
    if assets is None:
        assets = {
            name: data_uri(image) for name, image in template.asset_images().items()
        }
    return blueprint_to_svg(
        template.blueprint,
        values,
        assets,
        date_pattern(template.date_format),
        month_names(),
        shrink_size,
    )


def font_tokens(template: Any) -> set[str]:
    """Return the font tokens a template's blueprint uses.

    :param template: A certificate template.
    :returns: Tokens of text elements.
    """
    return {
        element["font"]
        for element in template.blueprint["elements"]
        if element["type"] == "text"
    }


def render(template: Any, data: dict[str, str], fmt: str = "pdf") -> bytes:
    """Render a template to PNG or PDF.

    :param template: A certificate template.
    :param data: Field values by token.
    :param fmt: ``png`` or ``pdf``.
    :returns: The file contents.
    :raises ValueError: For an unknown format.
    :raises MissingFields: When data lacks tokens the blueprint uses.
    """
    if fmt not in FORMATS:
        raise ValueError(f"Unknown format: {fmt}")
    png = svg_to_png(template_svg(template, data), render_files(font_tokens(template)))
    if fmt == "png":
        return png
    return png_to_pdf(png, api.portal.get_registry_record(PDF_DPI_RECORD, default=300))
