"""Typed views of a blueprint. ``schema.json`` is the normative definition."""

from typing import Literal
from typing import NotRequired
from typing import TypedDict


Anchor = Literal["start", "middle", "end"]
Baseline = Literal["alphabetic", "middle", "hanging"]
Fit = Literal["none", "shrink"]
#: ``background``, or the id of an Image item inside the template.
Asset = str
ErrorCorrection = Literal["L", "M", "Q", "H"]


class Page(TypedDict):
    """Page size in the background's pixel space."""

    width: int
    height: int


class TextElement(TypedDict):
    """One line of text."""

    id: str
    type: Literal["text"]
    x: int
    y: int
    anchor: Anchor
    baseline: Baseline
    font: str
    size: int
    color: str
    content: str
    rotation: NotRequired[int]
    max_width: NotRequired[int]
    fit: NotRequired[Fit]


class ImageElement(TypedDict):
    """An image field of the template."""

    id: str
    type: Literal["image"]
    x: int
    y: int
    width: int
    height: int
    asset: Asset
    rotation: NotRequired[int]


class QrElement(TypedDict):
    """A QR code."""

    id: str
    type: Literal["qrcode"]
    x: int
    y: int
    size: int
    content: str
    ec: ErrorCorrection
    fg: str
    bg: str
    rotation: NotRequired[int]


Element = TextElement | ImageElement | QrElement


class Blueprint(TypedDict):
    """A certificate layout."""

    version: Literal[1]
    page: Page
    elements: list[Element]


class ValidationIssue(TypedDict):
    """One problem found in a blueprint.

    ``element`` is the id of the offending element (``None`` for page-level
    problems), ``path`` the JSON pointer of the offending value.
    """

    element: str | None
    path: str
    message: str


def empty_blueprint(width: int = 3508, height: int = 2480) -> Blueprint:
    """Return a blueprint with no elements.

    :param width: Page width; defaults to A4 landscape at 300 dpi.
    :param height: Page height.
    :returns: A new blueprint.
    """
    return {"version": 1, "page": {"width": width, "height": height}, "elements": []}
