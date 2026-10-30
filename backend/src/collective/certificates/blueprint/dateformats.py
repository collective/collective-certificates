"""The date formats a template can choose from.

A template stores a token; the renderer receives the token's pattern, in
the strftime subset of the placeholder language. The frontend keeps the
same tokens and patterns, checked against the shared contract context.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class DateFormatSpec:
    """One date format."""

    token: str
    pattern: str


DATE_FORMATS: tuple[DateFormatSpec, ...] = (
    DateFormatSpec(token="day-month-year", pattern="%d/%m/%Y"),
    DateFormatSpec(token="month-day-year", pattern="%m/%d/%Y"),
    DateFormatSpec(token="iso", pattern="%Y-%m-%d"),
    DateFormatSpec(token="long", pattern="%B %-d, %Y"),
    DateFormatSpec(token="long-day-first", pattern="%-d %B %Y"),
)

#: Patterns by token.
DATE_PATTERNS: dict[str, str] = {spec.token: spec.pattern for spec in DATE_FORMATS}

#: The format of a new template.
DEFAULT_DATE_FORMAT: str = "day-month-year"

#: The date the vocabulary writes in each format, as the format's title.
EXAMPLE_DATE: str = "2026-12-31"


def date_pattern(token: str | None) -> str:
    """Return the pattern of a date format.

    :param token: A date format token.
    :returns: Its pattern; the default format's for an unknown token.
    """
    return DATE_PATTERNS.get(token or "", DATE_PATTERNS[DEFAULT_DATE_FORMAT])
