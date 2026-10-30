"""Generate the neutral sample background and signature images.

They stand in for real artwork in tests, docs and the tutorial: a 3508x2480
landscape page (A4 at 300 dpi) with a header band, a logo placeholder and a
footer band, and a hand-drawn-looking signature on a transparent canvas.

Run from the backend directory::

    .venv/bin/python scripts/make_sample_assets.py
"""

from pathlib import Path
from PIL import Image
from PIL import ImageDraw

import math


TARGET = Path(__file__).resolve().parent.parent / "tests" / "_resources" / "sample"

WIDTH, HEIGHT = 3508, 2480
INK = (27, 27, 27, 255)
ACCENT = (31, 84, 122)
SOFT = (226, 236, 243)


def background() -> Image.Image:
    """Draw the sample background.

    :returns: An RGB image of the page size.
    """
    image = Image.new("RGB", (WIDTH, HEIGHT), (255, 255, 255))
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, WIDTH, 420), fill=ACCENT)
    draw.rectangle((0, HEIGHT - 160, WIDTH, HEIGHT), fill=ACCENT)
    # Logo placeholder: a light box with a diagonal cross.
    box = (190, 110, 790, 310)
    draw.rectangle(box, fill=SOFT, outline=(255, 255, 255), width=8)
    draw.line((box[0], box[1], box[2], box[3]), fill=ACCENT, width=6)
    draw.line((box[0], box[3], box[2], box[1]), fill=ACCENT, width=6)
    # Illustration placeholder on the right.
    draw.ellipse((2500, 700, 3300, 1500), fill=SOFT)
    return image


def signature() -> Image.Image:
    """Draw a scribble standing in for a signature.

    :returns: An RGBA image with a transparent background.
    """
    width, height = 900, 220
    image = Image.new("RGBA", (width, height), (255, 255, 255, 0))
    draw = ImageDraw.Draw(image)
    points = [
        (
            40 + step * 4,
            110 + 55 * math.sin(step / 9.0) + 25 * math.sin(step / 2.3) - 0.08 * step,
        )
        for step in range(205)
    ]
    draw.line(points, fill=INK, width=7, joint="curve")
    draw.line((60, 185, 860, 175), fill=INK, width=5)
    return image


def main() -> int:
    """Write both images.

    :returns: Process exit status.
    """
    TARGET.mkdir(parents=True, exist_ok=True)
    background().save(TARGET / "background.png", optimize=True)
    signature().save(TARGET / "signature.png", optimize=True)
    for name in ("background.png", "signature.png"):
        path = TARGET / name
        print(f"{path.name}: {path.stat().st_size} bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
