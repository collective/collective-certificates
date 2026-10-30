"""Where fonts come from: the bundled files and an optional extra directory.

A font is addressed by its token everywhere — in blueprints, in the
``Fonts`` vocabulary and in ``@@certificate-font/<token>``. Weight and style
are part of the token (``inter``, ``inter-bold``), so every token is one
file.
"""

from dataclasses import dataclass
from fontTools.ttLib import TTFont
from pathlib import Path
from plone import api

import hashlib
import re
import tempfile


#: Directory of the bundled font files.
BUNDLED_DIR: Path = Path(__file__).parent / "files"

#: File extensions accepted from the extra directory.
EXTENSIONS: tuple[str, ...] = (".ttf", ".otf")

#: Registry record naming the extra font directory.
EXTRA_DIR_RECORD = "collective.certificates.extra_font_dir"


@dataclass(frozen=True)
class FontSpec:
    """One font file."""

    token: str
    title: str
    path: Path


BUNDLED: dict[str, FontSpec] = {
    spec.token: spec
    for spec in (
        FontSpec("inter", "Inter", BUNDLED_DIR / "inter" / "inter.ttf"),
        FontSpec("inter-bold", "Inter Bold", BUNDLED_DIR / "inter" / "inter-bold.ttf"),
        FontSpec(
            "eb-garamond",
            "EB Garamond",
            BUNDLED_DIR / "ebgaramond" / "eb-garamond.ttf",
        ),
        FontSpec(
            "eb-garamond-bold",
            "EB Garamond Bold",
            BUNDLED_DIR / "ebgaramond" / "eb-garamond-bold.ttf",
        ),
        FontSpec("caveat", "Caveat", BUNDLED_DIR / "caveat" / "caveat.ttf"),
    )
}


def slugify(name: str) -> str:
    """Turn a file stem into a font token.

    :param name: File name without extension.
    :returns: Lowercase ASCII letters, digits and single dashes; empty when
        nothing usable is left.
    """
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug[:64]


def font_title(path: Path, fallback: str) -> str:
    """Read a font's full name from its ``name`` table.

    :param path: Font file.
    :param fallback: Returned when the file has no usable name.
    :returns: The full name (name ID 4), or ``fallback``.
    """
    try:
        font = TTFont(path, lazy=True)
        name = font["name"].getDebugName(4)
    except Exception:
        # Any unreadable or malformed file falls back to its file name.
        return fallback
    return name or fallback


def extra_dir() -> Path | None:
    """Return the extra font directory configured in the registry.

    :returns: The directory, or ``None`` when unset or not a directory.
    """
    value = api.portal.get_registry_record(EXTRA_DIR_RECORD, default="") or ""
    path = Path(value.strip()) if value.strip() else None
    return path if path is not None and path.is_dir() else None


def extra_fonts(directory: Path | None = None) -> dict[str, FontSpec]:
    """Return the fonts found in the extra directory.

    Tokens already used by a bundled font, and files whose name leaves no
    usable token, are skipped.

    :param directory: Directory to scan; defaults to :func:`extra_dir`.
    :returns: Font specs by token, sorted by token.
    """
    directory = directory if directory is not None else extra_dir()
    if directory is None:
        return {}
    found: dict[str, FontSpec] = {}
    for path in sorted(directory.iterdir()):
        if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
            continue
        token = slugify(path.stem)
        if not token or token in BUNDLED or token in found:
            continue
        found[token] = FontSpec(token, font_title(path, path.stem), path)
    return dict(sorted(found.items()))


def all_fonts() -> dict[str, FontSpec]:
    """Return bundled and extra fonts.

    :returns: Font specs by token, bundled first.
    """
    return {**BUNDLED, **extra_fonts()}


def get_font(token: str) -> FontSpec | None:
    """Look a font up by token.

    :param token: Font token.
    :returns: Its spec, or ``None`` when unknown.
    """
    return all_fonts().get(token)


def render_copy(spec: FontSpec, cache: Path | None = None) -> Path:
    """Return a copy of a font whose family name is its token.

    resvg matches ``font-family`` against a font's internal family name, so
    the renderer gets copies renamed to the token, each a standalone regular
    face. Copies are cached by token and file contents.

    :param spec: Font to copy.
    :param cache: Cache directory; defaults to one below the temp dir.
    :returns: Path of the renamed copy.
    """
    cache = cache or Path(tempfile.gettempdir()) / "collective.certificates-fonts"
    cache.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256(spec.token.encode() + spec.path.read_bytes()).hexdigest()
    target = cache / f"{spec.token}-{digest[:16]}{spec.path.suffix.lower()}"
    if target.exists():
        return target
    font = TTFont(spec.path)
    name = font["name"]
    # Typographic and WWS family names would otherwise group the copy with
    # its original family; removeNames ignores IDs that are absent.
    for name_id in (16, 17, 21, 22):
        name.removeNames(nameID=name_id)
    name.setName(spec.token, 1, 3, 1, 0x409)
    name.setName("Regular", 2, 3, 1, 0x409)
    name.setName(spec.token, 4, 3, 1, 0x409)
    name.setName(spec.token, 6, 3, 1, 0x409)
    font["OS/2"].usWeightClass = 400
    font["OS/2"].fsSelection = (font["OS/2"].fsSelection & ~0b1100001) | 0b1000000
    font["head"].macStyle = 0
    partial = target.with_suffix(target.suffix + ".part")
    font.save(partial)
    partial.replace(target)
    return target


def render_files(tokens: set[str], cache: Path | None = None) -> list[str]:
    """Return renamed copies of the fonts a rendering needs.

    :param tokens: Font tokens used by the blueprint; unknown ones are
        ignored (validation rejects them before rendering).
    :param cache: Cache directory, see :func:`render_copy`.
    :returns: File paths, sorted by token.
    """
    fonts = all_fonts()
    return [
        str(render_copy(fonts[token], cache))
        for token in sorted(tokens)
        if token in fonts
    ]
