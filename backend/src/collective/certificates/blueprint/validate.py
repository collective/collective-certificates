"""Blueprint validation: the JSON Schema, then semantic checks.

The schema says what a blueprint may look like; the semantic checks say
whether it makes sense for a template — fonts that exist, tokens that are
fields, elements on the page. Both produce :class:`ValidationIssue` items
with translatable messages naming the element.
"""

from collective.certificates import _
from collective.certificates.blueprint.fields import field_kind
from collective.certificates.blueprint.model import ValidationIssue
from collective.certificates.blueprint.template import FILTERS
from collective.certificates.blueprint.template import placeholders
from collective.certificates.blueprint.template import TemplateSyntaxError
from functools import cache
from jsonschema import Draft202012Validator
from pathlib import Path
from typing import Any

import json


SCHEMA_PATH: Path = Path(__file__).parent / "schema.json"


@cache
def schema_text() -> str:
    """Return ``schema.json`` as text.

    :returns: The schema source.
    """
    return SCHEMA_PATH.read_text(encoding="utf-8")


@cache
def validator() -> Draft202012Validator:
    """Return a validator for ``schema.json``.

    :returns: A cached validator.
    """
    return Draft202012Validator(json.loads(schema_text()))


def pointer(parts: Any) -> str:
    """Build a JSON pointer.

    :param parts: Path segments.
    :returns: The pointer, ``""`` for the document root.
    """
    return "".join(
        "/" + str(part).replace("~", "~0").replace("/", "~1") for part in parts
    )


def element_id(blueprint: Any, parts: list[Any]) -> str | None:
    """Return the id of the element a path points into.

    :param blueprint: The validated document.
    :param parts: Path segments of a schema error, so they exist in it.
    :returns: The element's ``id`` when the path is below ``/elements/N``
        and that element has a string id, else ``None``.
    """
    if len(parts) < 2 or parts[0] != "elements" or not isinstance(parts[1], int):
        return None
    element = blueprint["elements"][parts[1]]
    value = element.get("id") if isinstance(element, dict) else None
    return value if isinstance(value, str) else None


def issue(element: str | None, path: str, message: Any) -> ValidationIssue:
    """Build one issue.

    :param element: Element id, or ``None``.
    :param path: JSON pointer.
    :param message: Translatable message.
    :returns: The issue.
    """
    return {"element": element, "path": path, "message": message}


def schema_issues(blueprint: Any) -> list[ValidationIssue]:
    """Check a blueprint against ``schema.json``.

    :param blueprint: Decoded JSON.
    :returns: One issue per schema error, ordered by path.
    """
    errors = sorted(
        validator().iter_errors(blueprint),
        key=lambda e: list(map(str, e.absolute_path)),
    )
    found = []
    for error in errors:
        parts = list(error.absolute_path)
        found.append(
            issue(
                element_id(blueprint, parts),
                pointer(parts),
                _(
                    "error_schema",
                    default="Invalid value at ${path}: ${detail}",
                    mapping={"path": pointer(parts) or "/", "detail": error.message},
                ),
            )
        )
    return found


def content_issues(element: dict[str, Any], index: int) -> list[ValidationIssue]:
    """Check the placeholders of an element's content.

    :param element: A text or QR element.
    :param index: Position in ``elements``.
    :returns: Issues for syntax errors, unknown tokens and filters, and
        ``date`` on a non-date token.
    """
    path = f"/elements/{index}/content"
    eid = element["id"]
    try:
        found = placeholders(element["content"])
    except TemplateSyntaxError as exc:
        return [
            issue(
                eid,
                path,
                _(
                    "error_placeholder_syntax",
                    default="${element}: ${detail}",
                    mapping={"element": eid, "detail": str(exc)},
                ),
            )
        ]
    issues = []
    for placeholder in found:
        kind = field_kind(placeholder.token)
        if kind is None:
            issues.append(
                issue(
                    eid,
                    path,
                    _(
                        "error_unknown_token",
                        default="${element}: unknown field ${token}.",
                        mapping={"element": eid, "token": placeholder.token},
                    ),
                )
            )
        if placeholder.filter is not None and placeholder.filter not in FILTERS:
            issues.append(
                issue(
                    eid,
                    path,
                    _(
                        "error_unknown_filter",
                        default="${element}: unknown filter ${filter}.",
                        mapping={"element": eid, "filter": placeholder.filter},
                    ),
                )
            )
        if placeholder.filter == "date" and kind not in (None, "date"):
            issues.append(
                issue(
                    eid,
                    path,
                    _(
                        "error_date_filter",
                        default=(
                            "${element}: the date filter needs a date field, "
                            "not ${token}."
                        ),
                        mapping={"element": eid, "token": placeholder.token},
                    ),
                )
            )
    return issues


def bounds(element: dict[str, Any]) -> tuple[int, int]:
    """Return the far corner an element needs on the page.

    :param element: A schema-valid element.
    :returns: ``(x, y)`` of its bottom-right corner; the anchor point for
        text, whose extent depends on the font.
    """
    if element["type"] == "image":
        return element["x"] + element["width"], element["y"] + element["height"]
    if element["type"] == "qrcode":
        return element["x"] + element["size"], element["y"] + element["size"]
    return element["x"], element["y"]


def semantic_issues(
    blueprint: dict[str, Any],
    fonts: set[str],
    background: tuple[int, int] | None = None,
    assets: set[str] | None = None,
    check_layout: bool = True,
) -> list[ValidationIssue]:
    """Check a schema-valid blueprint against a template's context.

    :param blueprint: A blueprint that passed :func:`schema_issues`.
    :param fonts: Known font tokens.
    :param background: ``(width, height)`` of the background, when known.
    :param assets: Image fields that have an image, when known.
    :param check_layout: Also check the page size against the background
        and that every element fits on the page.
    :returns: Issues in element order; page-level ones first.
    """
    issues: list[ValidationIssue] = []
    page = blueprint["page"]
    if (
        check_layout
        and background is not None
        and (page["width"], page["height"]) != background
    ):
        issues.append(
            issue(
                None,
                "/page",
                _(
                    "error_page_size",
                    default=(
                        "The page is ${page_width}x${page_height} but the "
                        "background is ${width}x${height}."
                    ),
                    mapping={
                        "page_width": page["width"],
                        "page_height": page["height"],
                        "width": background[0],
                        "height": background[1],
                    },
                ),
            )
        )
    seen: set[str] = set()
    for index, element in enumerate(blueprint["elements"]):
        eid = element["id"]
        if eid in seen:
            issues.append(
                issue(
                    eid,
                    f"/elements/{index}/id",
                    _(
                        "error_duplicate_id",
                        default="${element}: another element has the same id.",
                        mapping={"element": eid},
                    ),
                )
            )
        seen.add(eid)
        if element["type"] == "text" and element["font"] not in fonts:
            issues.append(
                issue(
                    eid,
                    f"/elements/{index}/font",
                    _(
                        "error_unknown_font",
                        default="${element}: unknown font ${font}.",
                        mapping={"element": eid, "font": element["font"]},
                    ),
                )
            )
        if element["type"] in ("text", "qrcode"):
            issues.extend(content_issues(element, index))
        if (
            element["type"] == "image"
            and assets is not None
            and element["asset"] not in assets
        ):
            issues.append(
                issue(
                    eid,
                    f"/elements/{index}/asset",
                    _(
                        "error_missing_asset",
                        default="${element}: the template has no ${asset} image.",
                        mapping={"element": eid, "asset": element["asset"]},
                    ),
                )
            )
        right, bottom = bounds(element)
        if check_layout and (right > page["width"] or bottom > page["height"]):
            issues.append(
                issue(
                    eid,
                    f"/elements/{index}",
                    _(
                        "error_outside_page",
                        default="${element}: the element does not fit on the page.",
                        mapping={"element": eid},
                    ),
                )
            )
    return issues


def validate(
    blueprint: Any,
    fonts: set[str],
    background: tuple[int, int] | None = None,
    assets: set[str] | None = None,
    check_layout: bool = True,
) -> list[ValidationIssue]:
    """Validate a blueprint completely.

    :param blueprint: Decoded JSON.
    :param fonts: Known font tokens.
    :param background: ``(width, height)`` of the background, when known.
    :param assets: Image fields that have an image, when known.
    :param check_layout: See :func:`semantic_issues`.
    :returns: Schema issues when there are any (semantic checks need a
        schema-valid document), else the semantic issues. Empty when valid.
    """
    found = schema_issues(blueprint)
    if found:
        return found
    return semantic_issues(blueprint, fonts, background, assets, check_layout)
