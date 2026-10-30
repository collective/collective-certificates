"""The certificate fields a blueprint can reference.

Fields are hard-coded in 1.0: :data:`FIELDS` is the one place to extend.
Each field has a token (what ``{{ token }}`` names in a blueprint), a
translatable title, a kind deciding which filters apply, and a sample value
used by the designer, ``@preview`` and the tests.

Fields of kind ``computed`` are filled in when a certificate is created —
its UID and verification URL — and are never asked from callers.
"""

from collective.certificates import _
from dataclasses import dataclass
from typing import Literal
from zope.i18nmessageid import Message


FieldKind = Literal["text", "date", "computed"]

#: UID used for samples and previews, where no certificate exists yet.
SAMPLE_UID = "257e08fdcd07ff6fa3d1bc14f6aec321"


@dataclass(frozen=True)
class FieldSpec:
    """One certificate field."""

    token: str
    title: Message
    kind: FieldKind
    sample: str


FIELDS: tuple[FieldSpec, ...] = (
    FieldSpec(
        token="full_name",
        title=_("field_full_name", default="Full name"),
        kind="text",
        sample="Patrick Stewart",
    ),
    FieldSpec(
        token="event_name",
        title=_("field_event_name", default="Event name"),
        kind="text",
        sample="Star Trek: Picard",
    ),
    FieldSpec(
        token="event_start_date",
        title=_("field_event_start_date", default="Event start date"),
        kind="date",
        sample="2026-05-26",
    ),
    FieldSpec(
        token="event_end_date",
        title=_("field_event_end_date", default="Event end date"),
        kind="date",
        sample="2026-06-09",
    ),
    FieldSpec(
        token="responsible_person",
        title=_("field_responsible_person", default="Responsible person"),
        kind="text",
        sample="Jean-Luc Picard",
    ),
    FieldSpec(
        token="total_hours",
        title=_("field_total_hours", default="Total hours"),
        kind="text",
        sample="47",
    ),
    FieldSpec(
        token="certificate_uid",
        title=_("field_certificate_uid", default="Certificate ID"),
        kind="computed",
        sample=SAMPLE_UID,
    ),
    FieldSpec(
        token="verification_url",
        title=_("field_verification_url", default="Verification URL"),
        kind="computed",
        sample=f"https://example.org/verify/{SAMPLE_UID}",
    ),
)

#: Field specs by token.
FIELDS_BY_TOKEN: dict[str, FieldSpec] = {field.token: field for field in FIELDS}

#: Tokens filled in by the system.
COMPUTED: frozenset[str] = frozenset(f.token for f in FIELDS if f.kind == "computed")


class MissingFields(ValueError):
    """Raised when data lacks tokens a blueprint references."""

    def __init__(self, missing: set[str]) -> None:
        self.missing: list[str] = sorted(missing)
        super().__init__(f"Missing certificate fields: {', '.join(self.missing)}")


def sample_data() -> dict[str, str]:
    """Return the sample value of every field callers provide, keyed by token.

    :returns: A new dictionary without computed fields, safe to mutate.
    """
    return {field.token: field.sample for field in FIELDS if field.kind != "computed"}


def field_kind(token: str) -> FieldKind | None:
    """Return the kind of a field token.

    :param token: Field token.
    :returns: The kind, or ``None`` for an unknown token.
    """
    field = FIELDS_BY_TOKEN.get(token)
    return field.kind if field else None
