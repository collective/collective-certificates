"""The Certificate content type.

An issued certificate: the rendered file, the field values it was rendered
with, and the UID of the template it came from. Its own UID is printed on
the certificate (as ``{{ certificate_uid }}`` or inside
``{{ verification_url }}``), which is how anyone holding it can verify it.
"""

from collective.certificates import _
from plone.dexterity.content import Item
from plone.namedfile.field import NamedBlobFile
from plone.schema import JSONField
from plone.supermodel import model
from zope import schema
from zope.interface import implementer

import json


DATA_SCHEMA = json.dumps({
    "type": "object",
    "additionalProperties": {"type": "string", "maxLength": 500},
})


class ICertificate(model.Schema):
    """An issued certificate."""

    model.primary("file")
    file = NamedBlobFile(
        title=_("label_certificate_file", default="File"),
        description=_(
            "help_certificate_file",
            default="The certificate as it was issued, PDF or PNG.",
        ),
        required=True,
    )

    data = JSONField(
        title=_("label_certificate_data", default="Values"),
        description=_(
            "help_certificate_data",
            default="Field values the certificate was rendered with.",
        ),
        schema=DATA_SCHEMA,
        required=False,
        readonly=True,
        default={},
    )

    template_uid = schema.TextLine(
        title=_("label_template_uid", default="Template"),
        description=_(
            "help_template_uid",
            default="UID of the certificate template it was rendered from.",
        ),
        required=False,
        readonly=True,
    )


@implementer(ICertificate)
class Certificate(Item):
    """An issued certificate."""

    # No class-level type annotations here: they create a class attribute
    # ``__annotations__``, and zope.annotation would then store every
    # instance's annotations (folder order, image scales) in that shared,
    # unpersisted dict instead of on the instance.
