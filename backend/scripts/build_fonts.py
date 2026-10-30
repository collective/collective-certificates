"""Build the bundled fonts from google/fonts.

google/fonts ships variable fonts only; the renderer and the designer need
one static file per token, so each one is instanced with fontTools. The
result is an OFL "Modified Version": every family bundled here was chosen
because its license reserves no font name (Lora, for one, does, which is why
it is not here). Each family's ``OFL.txt`` is copied next to its files.

Run from the backend directory::

    .venv/bin/python scripts/build_fonts.py

The source commit is pinned so the output is reproducible.
"""

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from pathlib import Path
from urllib.parse import quote
from urllib.request import urlopen

import io


#: google/fonts commit the fonts are built from.
COMMIT = "6157dfaa640ca5738b4d1a7070fe389c3036d7fc"

BASE = f"https://raw.githubusercontent.com/google/fonts/{COMMIT}/ofl"

#: (family directory, source file, token, axis locations)
FONTS: tuple[tuple[str, str, str, dict[str, float]], ...] = (
    ("inter", "Inter[opsz,wght].ttf", "inter", {"wght": 400, "opsz": 14}),
    ("inter", "Inter[opsz,wght].ttf", "inter-bold", {"wght": 700, "opsz": 14}),
    ("ebgaramond", "EBGaramond[wght].ttf", "eb-garamond", {"wght": 400}),
    ("ebgaramond", "EBGaramond[wght].ttf", "eb-garamond-bold", {"wght": 700}),
    ("caveat", "Caveat[wght].ttf", "caveat", {"wght": 400}),
)

TARGET = (
    Path(__file__).resolve().parent.parent
    / "src"
    / "collective"
    / "certificates"
    / "fonts"
    / "files"
)


def fetch(path: str) -> bytes:
    """Download one file from the pinned commit.

    :param path: Path below ``ofl/``.
    :returns: File contents.
    """
    url = f"{BASE}/{quote(path)}"
    with urlopen(url, timeout=60) as response:  # noqa: S310 - fixed https URL
        return response.read()


def main() -> int:
    """Build every font and copy its license.

    :returns: Process exit status.
    """
    sources: dict[str, bytes] = {}
    for family, source, token, axes in FONTS:
        folder = TARGET / family
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "OFL.txt").write_bytes(fetch(f"{family}/OFL.txt"))
        key = f"{family}/{source}"
        if key not in sources:
            sources[key] = fetch(key)
        font = TTFont(io.BytesIO(sources[key]))
        static = instancer.instantiateVariableFont(font, axes, updateFontNames=True)
        path = folder / f"{token}.ttf"
        static.save(path)
        print(f"{path.relative_to(TARGET)}: {path.stat().st_size} bytes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
