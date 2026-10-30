"""Regenerate the fixtures derived from the blueprints.

- ``tests/_resources/expected-svg/<name>.svg``: golden SVG of every valid
  blueprint, rendered with the sample data and ``asset:<name>`` hrefs.
- ``tests/_resources/qr-vectors.json``: QR matrices for a few inputs.
- ``tests/_resources/contract-context.json``: what the frontend needs to
  reproduce the goldens and the validation fixtures — fonts, field kinds
  and samples, page, assets, and the size each golden text is drawn at
  (the two sides measure text differently; the server's size wins) — and
  the pattern of each date format token.
- ``docs/docs/_static/sample.png`` and ``sample.pdf``: the sample
  certificate as the server renders it.

Run from the backend directory after a deliberate change to the SVG format,
the fixtures or the bundled fonts, and review the diff::

    .venv/bin/python scripts/update_fixtures.py
"""

from collections.abc import Callable
from collective.certificates.blueprint.dateformats import DATE_PATTERNS
from collective.certificates.blueprint.dateformats import DEFAULT_DATE_FORMAT
from collective.certificates.blueprint.fields import FIELDS
from collective.certificates.blueprint.metrics import fit_size
from collective.certificates.blueprint.model import TextElement
from collective.certificates.blueprint.qrcode import qr_matrix
from collective.certificates.blueprint.raster import png_to_pdf
from collective.certificates.blueprint.raster import svg_to_png
from collective.certificates.blueprint.svg import blueprint_to_svg
from collective.certificates.fonts.registry import BUNDLED
from collective.certificates.fonts.registry import render_copy
from pathlib import Path

import base64
import json


BACKEND = Path(__file__).resolve().parent.parent
RESOURCES = BACKEND / "tests" / "_resources"
STATIC = BACKEND.parent / "docs" / "docs" / "_static"

BLUEPRINTS: tuple[str, ...] = ("sample", "minimal", "every-element")

#: Size of the sample background, the page of the valid fixtures.
PAGE: tuple[int, int] = (3508, 2480)

#: hrefs used in the goldens; contract tests replace real hrefs with these.
GOLDEN_ASSETS: dict[str, str] = {
    "background": "asset:background",
    "signature": "asset:signature",
}

QR_INPUTS: tuple[tuple[str, str], ...] = (
    ("HELLO", "L"),
    ("12345", "H"),
    ("Château Picard", "Q"),
    ("https://example.org/verify?name=Patrick Stewart", "M"),
    ("Patrick Stewart, Star Trek: Picard, Season Three", "H"),
)


def size(element: TextElement, text: str) -> int:
    """Apply ``fit: shrink`` with the bundled fonts.

    :param element: Text element.
    :param text: Rendered text.
    :returns: Drawn size.
    """
    if element.get("fit") != "shrink" or "max_width" not in element:
        return element["size"]
    return fit_size(
        BUNDLED[element["font"]].path, text, element["size"], element["max_width"]
    )


def recording(drawn: dict[str, int]) -> Callable[[TextElement, str], int]:
    """Wrap :func:`size` to record each text element's size.

    :param drawn: Filled with the size by element id.
    :returns: A size function for :func:`blueprint_to_svg`.
    """

    def recording_size(element: TextElement, text: str) -> int:
        drawn[element["id"]] = size(element, text)
        return drawn[element["id"]]

    return recording_size


def load(relative: str) -> dict:
    """Load a JSON fixture.

    :param relative: Path below ``tests/_resources``.
    :returns: Decoded JSON.
    """
    return json.loads((RESOURCES / relative).read_text(encoding="utf-8"))


def main() -> int:
    """Write every derived fixture.

    :returns: Process exit status.
    """
    # Computed fields too: the goldens render blueprints directly.
    data = {field.token: field.sample for field in FIELDS}
    golden_dir = RESOURCES / "expected-svg"
    golden_dir.mkdir(exist_ok=True)
    sizes: dict[str, dict[str, int]] = {}
    for name in BLUEPRINTS:
        drawn: dict[str, int] = {}
        svg = blueprint_to_svg(
            load(f"blueprints/{name}.json"), data, GOLDEN_ASSETS, size=recording(drawn)
        )
        (golden_dir / f"{name}.svg").write_text(svg, encoding="utf-8")
        sizes[name] = drawn
        print(f"expected-svg/{name}.svg")

    context = {
        "description": (
            "Context of the shared fixtures. Validation uses fonts, page and "
            "assets; field kinds come from the FieldKinds vocabulary. Goldens "
            "render with every field's sample, the golden assets as hrefs, and "
            "the text sizes listed here. Date formats map a template's "
            "date_format token to the pattern the renderer receives."
        ),
        "fonts": sorted(BUNDLED),
        "fields": {
            field.token: {"kind": field.kind, "sample": field.sample}
            for field in FIELDS
        },
        "page": list(PAGE),
        "assets": sorted(GOLDEN_ASSETS),
        "golden_assets": GOLDEN_ASSETS,
        "golden_sizes": sizes,
        "date_formats": DATE_PATTERNS,
        "default_date_format": DEFAULT_DATE_FORMAT,
    }
    (RESOURCES / "contract-context.json").write_text(
        json.dumps(context, indent=1, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print("contract-context.json")

    vectors = [
        {
            "content": content,
            "ec": ec,
            "modules": len(matrix),
            "matrix": ["".join("1" if dark else "0" for dark in row) for row in matrix],
        }
        for content, ec in QR_INPUTS
        for matrix in [qr_matrix(content, ec)]
    ]
    (RESOURCES / "qr-vectors.json").write_text(
        json.dumps({"cases": vectors}, indent=1, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print("qr-vectors.json")

    images = {
        name: "data:image/png;base64,"
        + base64.b64encode((RESOURCES / "sample" / f"{name}.png").read_bytes()).decode()
        for name in GOLDEN_ASSETS
    }
    svg = blueprint_to_svg(load("blueprints/sample.json"), data, images, size=size)
    fonts = [str(render_copy(spec)) for spec in BUNDLED.values()]
    png = svg_to_png(svg, fonts)
    STATIC.mkdir(parents=True, exist_ok=True)
    (STATIC / "sample.png").write_bytes(png)
    (STATIC / "sample.pdf").write_bytes(png_to_pdf(png, 300))
    print("docs/docs/_static/sample.png and sample.pdf")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
