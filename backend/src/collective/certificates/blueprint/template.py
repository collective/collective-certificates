"""The placeholder language of blueprint text and QR content.

``{{ token }}`` inserts a field value; ``{{ token|filter }}`` applies one of
:data:`FILTERS` first. Text outside braces is literal, and so is an
unterminated ``{{``. A terminated placeholder that does not follow the
grammar is a :class:`TemplateSyntaxError`.
"""

from dataclasses import dataclass
from datetime import date

import re


FILTERS: tuple[str, ...] = ("upper", "lower", "date")

#: The strftime subset ``date_format`` may use.
DATE_DIRECTIVES: tuple[str, ...] = ("%d", "%-d", "%m", "%Y", "%B", "%%")

#: English month names; callers pass translated names to :func:`render`.
MONTHS_EN: tuple[str, ...] = (
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
)

_PLACEHOLDER = re.compile(
    r"^\s*(?P<token>[a-z_][a-z0-9_]*)\s*(?:\|\s*(?P<filter>[a-z_][a-z0-9_]*)\s*)?$"
)
_DIRECTIVE = re.compile(r"%-d|%.|%$")
_ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class TemplateSyntaxError(ValueError):
    """A ``{{ … }}`` placeholder that does not follow the grammar."""


class TemplateRenderError(ValueError):
    """A value that cannot be rendered, such as a malformed date."""


@dataclass(frozen=True)
class Placeholder:
    """One ``{{ token|filter }}`` occurrence."""

    token: str
    filter: str | None


Part = str | Placeholder


def parse(content: str) -> list[Part]:
    """Split content into literal strings and placeholders.

    :param content: Text with placeholders.
    :returns: Literal strings and :class:`Placeholder` objects, in order.
        Adjacent literals are merged; empty literals are dropped.
    :raises TemplateSyntaxError: For a terminated placeholder whose inside
        is not ``token`` or ``token|filter``.
    """
    parts: list[Part] = []
    literal = ""
    position = 0
    while True:
        start = content.find("{{", position)
        end = content.find("}}", start + 2) if start != -1 else -1
        if end == -1:
            literal += content[position:]
            break
        literal += content[position:start]
        inner = content[start + 2 : end]
        match = _PLACEHOLDER.match(inner)
        if match is None:
            raise TemplateSyntaxError(
                f"Invalid placeholder: {content[start : end + 2]}"
            )
        if literal:
            parts.append(literal)
            literal = ""
        parts.append(Placeholder(match.group("token"), match.group("filter")))
        position = end + 2
    if literal:
        parts.append(literal)
    return parts


def placeholders(content: str) -> list[Placeholder]:
    """Return the placeholders of content, in order.

    :param content: Text with placeholders.
    :returns: Every :class:`Placeholder`, duplicates included.
    :raises TemplateSyntaxError: See :func:`parse`.
    """
    return [part for part in parse(content) if isinstance(part, Placeholder)]


def tokens(content: str) -> set[str]:
    """Return the field tokens content references.

    :param content: Text with placeholders.
    :returns: Distinct tokens.
    :raises TemplateSyntaxError: See :func:`parse`.
    """
    return {part.token for part in placeholders(content)}


def invalid_date_directives(date_format: str) -> list[str]:
    """Return the directives of a date format outside :data:`DATE_DIRECTIVES`.

    :param date_format: A strftime-style format.
    :returns: Offending directives in order of appearance; empty when valid.
    """
    return [d for d in _DIRECTIVE.findall(date_format) if d not in DATE_DIRECTIVES]


def format_date(
    value: str, date_format: str, months: tuple[str, ...] = MONTHS_EN
) -> str:
    """Format an ISO date with the strftime subset.

    Done by hand rather than with :meth:`date.strftime` so the output does
    not depend on the process locale and ``%-d`` works on every platform.

    :param value: ``YYYY-MM-DD``.
    :param date_format: Format using :data:`DATE_DIRECTIVES`.
    :param months: Twelve month names for ``%B``.
    :returns: The formatted date.
    :raises TemplateRenderError: For a malformed date or an unsupported
        directive.
    """
    if not _ISO_DATE.match(value):
        raise TemplateRenderError(f"Not an ISO date (YYYY-MM-DD): {value!r}")
    try:
        parsed = date.fromisoformat(value)
    except ValueError as exc:
        raise TemplateRenderError(f"Not a valid date: {value!r}") from exc
    bad = invalid_date_directives(date_format)
    if bad:
        raise TemplateRenderError(f"Unsupported date directive: {bad[0]}")
    values = {
        "%d": f"{parsed.day:02d}",
        "%-d": str(parsed.day),
        "%m": f"{parsed.month:02d}",
        "%Y": f"{parsed.year:04d}",
        "%B": months[parsed.month - 1],
        "%%": "%",
    }
    return _DIRECTIVE.sub(lambda match: values[match.group(0)], date_format)


def apply_filter(
    value: str, name: str | None, date_format: str, months: tuple[str, ...]
) -> str:
    """Apply one filter to a value.

    :param value: Field value.
    :param name: Filter name, or ``None`` for none.
    :param date_format: Format used by ``date``.
    :param months: Month names used by ``date``.
    :returns: The filtered value.
    :raises TemplateRenderError: For an unknown filter or a bad date.
    """
    if name is None:
        return value
    if name == "upper":
        return value.upper()
    if name == "lower":
        return value.lower()
    if name == "date":
        return format_date(value, date_format, months)
    raise TemplateRenderError(f"Unknown filter: {name}")


def render(
    content: str,
    data: dict[str, str],
    date_format: str = "%d/%m/%Y",
    months: tuple[str, ...] = MONTHS_EN,
) -> str:
    """Render content with field values.

    :param content: Text with placeholders.
    :param data: Field values by token.
    :param date_format: Format used by the ``date`` filter.
    :param months: Month names used by ``%B``.
    :returns: The rendered text.
    :raises TemplateSyntaxError: See :func:`parse`.
    :raises TemplateRenderError: For a token missing from ``data``, an
        unknown filter or a bad date.
    """
    out: list[str] = []
    for part in parse(content):
        if isinstance(part, str):
            out.append(part)
            continue
        if part.token not in data:
            raise TemplateRenderError(f"Missing value for {part.token}")
        out.append(apply_filter(data[part.token], part.filter, date_format, months))
    return "".join(out)
