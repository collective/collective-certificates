"""The CertificateTemplate content type.

A background image and a blueprint placing text, images and QR codes on
the background. The template is a container: the images its ``image``
elements show, such as a signature or a logo, are Image items inside it.
Rendering a template with field values produces the certificate.
"""

from collective.certificates import _
from collective.certificates.blueprint.dateformats import DEFAULT_DATE_FORMAT
from collective.certificates.blueprint.fields import sample_data
from collective.certificates.blueprint.model import empty_blueprint
from collective.certificates.blueprint.model import ValidationIssue
from collective.certificates.blueprint.template import tokens
from collective.certificates.blueprint.validate import schema_text
from collective.certificates.blueprint.validate import validate
from collective.certificates.fonts.registry import all_fonts
from collective.certificates.utils import rendering
from collective.certificates.utils.verification import verification_url
from plone.dexterity.content import Container
from plone.namedfile.field import NamedBlobImage
from plone.schema import JSONField
from plone.supermodel import model
from typing import Any
from zope import schema
from zope.interface import implementer
from zope.interface import Invalid
from zope.interface import invariant

import json


SAMPLE_DATA_SCHEMA = json.dumps({
    "type": "object",
    "additionalProperties": {"type": "string", "maxLength": 500},
})

#: The asset name of the background field; any other asset name is the id
#: of an Image item inside the template.
BACKGROUND: str = "background"


def image_size(image: Any) -> tuple[int, int] | None:
    """Return the pixel size of a stored image.

    :param image: A ``NamedBlobImage`` value, or ``None``.
    :returns: ``(width, height)``, or ``None`` when absent or unknown.
    """
    if not image:
        return None
    width, height = image.getImageSize()
    return (width, height) if width > 0 and height > 0 else None


def contained_images(container: Any) -> dict[str, Any]:
    """Return the images stored in Image items inside a template.

    :param container: A certificate template, or anything else.
    :returns: Image values by item id; empty when ``container`` holds none.
    """
    items = getattr(container, "objectValues", None)
    if items is None:
        return {}
    return {
        item.getId(): item.image
        for item in items()
        if getattr(item, "portal_type", None) == "Image"
        and getattr(item, "image", None)
    }


class ICertificateTemplate(model.Schema):
    """A certificate layout over a background image."""

    background = NamedBlobImage(
        title=_("label_background", default="Background"),
        description=_(
            "help_background",
            default="The page of the certificate. Its size in pixels is the page size.",
        ),
        required=True,
    )

    blueprint = JSONField(
        title=_("label_blueprint", default="Design"),
        description=_(
            "help_blueprint",
            default="Where each text, image and QR code goes on the page.",
        ),
        schema=schema_text(),
        widget="certificate_blueprint",
        required=True,
        defaultFactory=empty_blueprint,
    )

    sample_data = JSONField(
        title=_("label_sample_data", default="Sample data"),
        description=_(
            "help_sample_data",
            default="Field values used by the designer and the preview.",
        ),
        schema=SAMPLE_DATA_SCHEMA,
        widget="certificate_sample_data",
        required=False,
        defaultFactory=sample_data,
    )

    date_format = schema.Choice(
        title=_("label_date_format", default="Date format"),
        description=_(
            "help_date_format",
            default="How the date filter writes dates.",
        ),
        vocabulary="collective.certificates.DateFormats",
        required=True,
        default=DEFAULT_DATE_FORMAT,
    )

    @invariant
    def blueprint_matches_template(data: Any) -> None:
        """Reject blueprints naming unknown fonts, fields, filters or assets.

        The page size and element bounds are not checked here: replacing the
        background must stay possible, and the page follows it on save.
        Neither are Image items: a template is validated before anything can
        be added inside it, as when it is created or imported, and its items
        can change without it. :meth:`CertificateTemplate.validate_blueprint`
        checks them before a preview or a certificate.

        :param data: Form data, falling back to stored values.
        :raises Invalid: With the first issue found.
        """
        blueprint = getattr(data, "blueprint", None)
        if not isinstance(blueprint, dict):
            return
        elements = blueprint.get("elements")
        assets = {
            element["asset"]
            for element in (elements if isinstance(elements, list) else [])
            if isinstance(element, dict) and isinstance(element.get("asset"), str)
        }
        assets.discard(BACKGROUND)
        if getattr(data, BACKGROUND, None):
            assets.add(BACKGROUND)
        issues = validate(blueprint, set(all_fonts()), None, assets, check_layout=False)
        if issues:
            raise Invalid(issues[0]["message"])


@implementer(ICertificateTemplate)
class CertificateTemplate(Container):
    """A certificate layout over a background image."""

    # No class-level type annotations here: they create a class attribute
    # ``__annotations__``, and zope.annotation would then store every
    # instance's annotations (folder order, image scales) in that shared,
    # unpersisted dict instead of on the instance.

    def computed_values(self, uid: str) -> dict[str, str]:
        """Return the values of the computed fields for a certificate.

        :param uid: The certificate's UID.
        :returns: ``certificate_uid`` and ``verification_url``.
        """
        return {
            "certificate_uid": uid,
            "verification_url": verification_url(uid),
        }

    def asset_images(self) -> dict[str, Any]:
        """Return the images ``image`` elements may show.

        :returns: Image values by asset name: the background, when set, and
            each Image item inside the template by its id. No item can be
            named ``background``: Plone reserves the field's name.
        """
        images = contained_images(self)
        background = getattr(self, BACKGROUND, None)
        if background:
            images[BACKGROUND] = background
        return images

    def assets(self) -> set[str]:
        """Return the asset names ``image`` elements may use.

        :returns: Keys of :meth:`asset_images`.
        """
        return set(self.asset_images())

    def page_size(self) -> tuple[int, int] | None:
        """Return the background's pixel size.

        :returns: ``(width, height)``, or ``None`` without a background.
        """
        return image_size(getattr(self, "background", None))

    def validate_blueprint(self, blueprint: Any = None) -> list[ValidationIssue]:
        """Validate a blueprint against this template.

        :param blueprint: Blueprint to check; defaults to the stored one.
        :returns: Every issue, page size and element bounds included.
        """
        blueprint = self.blueprint if blueprint is None else blueprint
        return validate(blueprint, set(all_fonts()), self.page_size(), self.assets())

    def required_fields(self) -> set[str]:
        """Return the field tokens the stored blueprint references.

        :returns: Tokens used by text and QR elements.
        """
        found: set[str] = set()
        for element in self.blueprint["elements"]:
            if element["type"] in ("text", "qrcode"):
                found |= tokens(element["content"])  # type: ignore[typeddict-item]
        return found

    def svg(self, data: dict[str, str], assets: dict[str, str] | None = None) -> str:
        """Render this template to SVG.

        :param data: Field values by token.
        :param assets: Image URLs by field name; defaults to data URIs.
        :returns: The SVG document.
        :raises collective.certificates.blueprint.fields.MissingFields: When data lacks
            tokens the blueprint uses.
        """
        return rendering.template_svg(self, data, assets)

    def render(self, data: dict[str, str], fmt: str = "pdf") -> bytes:
        """Render this template to PNG or PDF.

        :param data: Field values by token.
        :param fmt: ``png`` or ``pdf``.
        :returns: The file contents.
        :raises ValueError: For an unknown format.
        :raises collective.certificates.blueprint.fields.MissingFields: When data lacks
            tokens the blueprint uses.
        """
        return rendering.render(self, data, fmt)
