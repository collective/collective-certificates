"""Vocabularies of fonts, fields, field kinds, date formats and QR error correction."""

from collective.certificates import _
from collective.certificates.blueprint.dateformats import DATE_FORMATS
from collective.certificates.blueprint.dateformats import EXAMPLE_DATE
from collective.certificates.blueprint.fields import FIELDS
from collective.certificates.blueprint.template import format_date
from collective.certificates.fonts.registry import all_fonts
from collective.certificates.utils.rendering import month_names
from typing import Any
from zope.interface import provider
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleTerm
from zope.schema.vocabulary import SimpleVocabulary


@provider(IVocabularyFactory)
def fonts_vocabulary(context: Any) -> SimpleVocabulary:
    """Bundled fonts plus the ones in the extra font directory.

    :param context: Ignored.
    :returns: Terms whose token is the font token and title its name.
    """
    return SimpleVocabulary([
        SimpleTerm(value=spec.token, token=spec.token, title=spec.title)
        for spec in all_fonts().values()
    ])


@provider(IVocabularyFactory)
def fields_vocabulary(context: Any) -> SimpleVocabulary:
    """Certificate fields a blueprint can reference.

    :param context: Ignored.
    :returns: Terms whose token is the field token and title its label.
    """
    return SimpleVocabulary([
        SimpleTerm(value=field.token, token=field.token, title=field.title)
        for field in FIELDS
    ])


@provider(IVocabularyFactory)
def field_kinds_vocabulary(context: Any) -> SimpleVocabulary:
    """Kind of each certificate field, as the term title.

    The designer reads it to decide which filters a field offers, through
    the standard ``@vocabularies`` endpoint.

    :param context: Ignored.
    :returns: Terms whose token is the field token and title its kind.
    """
    return SimpleVocabulary([
        SimpleTerm(value=field.token, token=field.token, title=field.kind)
        for field in FIELDS
    ])


QR_ERROR_CORRECTION: tuple[tuple[str, Any], ...] = (
    ("L", _("qr_ec_l", default="Low (7%)")),
    ("M", _("qr_ec_m", default="Medium (15%)")),
    ("Q", _("qr_ec_q", default="Quartile (25%)")),
    ("H", _("qr_ec_h", default="High (30%)")),
)


@provider(IVocabularyFactory)
def date_formats_vocabulary(context: Any) -> SimpleVocabulary:
    """Date formats a template can choose from.

    :param context: Ignored.
    :returns: Terms whose token is the format token and title an example
        date written in it, months in the site's language.
    """
    months = month_names()
    return SimpleVocabulary([
        SimpleTerm(
            value=spec.token,
            token=spec.token,
            title=format_date(EXAMPLE_DATE, spec.pattern, months),
        )
        for spec in DATE_FORMATS
    ])


@provider(IVocabularyFactory)
def qr_error_correction_vocabulary(context: Any) -> SimpleVocabulary:
    """QR error correction levels.

    :param context: Ignored.
    :returns: Terms for ``L``, ``M``, ``Q`` and ``H``.
    """
    return SimpleVocabulary([
        SimpleTerm(value=level, token=level, title=title)
        for level, title in QR_ERROR_CORRECTION
    ])
