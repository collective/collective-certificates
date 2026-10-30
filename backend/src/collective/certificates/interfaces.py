"""Module where all interfaces, events and exceptions live."""

from collective.certificates import _
from zope import schema
from zope.interface import Interface
from zope.publisher.interfaces.browser import IDefaultBrowserLayer


class IBrowserLayer(IDefaultBrowserLayer):
    """Marker interface that defines a browser layer."""


class ISettings(Interface):
    """Registry records, prefixed ``collective.certificates``."""

    extra_font_dir = schema.TextLine(
        title=_("label_extra_font_dir", default="Extra font directory"),
        description=_(
            "help_extra_font_dir",
            default=(
                "Absolute path of a directory with additional .ttf or .otf "
                "files. Each file becomes a font named after the file."
            ),
        ),
        required=False,
        default="",
    )

    pdf_dpi = schema.Int(
        title=_("label_pdf_dpi", default="PDF resolution"),
        description=_(
            "help_pdf_dpi",
            default="Dots per inch used to size the page of generated PDFs.",
        ),
        required=True,
        default=300,
        min=72,
        max=1200,
    )
