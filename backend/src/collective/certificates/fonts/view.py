"""``@@certificate-font/<token>``: serve a font file for ``@font-face``."""

from collective.certificates.fonts.registry import BUNDLED_DIR
from collective.certificates.fonts.registry import extra_dir
from collective.certificates.fonts.registry import get_font
from pathlib import Path
from Products.Five.browser import BrowserView
from typing import Any
from zExceptions import NotFound
from zope.interface import implementer
from zope.publisher.interfaces import IPublishTraverse


CONTENT_TYPES: dict[str, str] = {".ttf": "font/ttf", ".otf": "font/otf"}


def is_inside(path: Path, directory: Path | None) -> bool:
    """Tell whether a path resolves inside a directory.

    :param path: Candidate file.
    :param directory: Allowed directory, or ``None``.
    :returns: ``True`` only when both resolve and ``path`` is below
        ``directory``.
    """
    if directory is None:
        return False
    return path.resolve().is_relative_to(directory.resolve())


@implementer(IPublishTraverse)
class FontView(BrowserView):
    """Stream one font file by token."""

    token: str | None = None

    def publishTraverse(self, request: Any, name: str) -> "FontView":
        """Consume the token path segment.

        :param request: Current request.
        :param name: Path segment after the view name.
        :returns: This view.
        :raises NotFound: For a second segment.
        """
        if self.token is not None:
            raise NotFound(name)
        self.token = name
        return self

    def __call__(self) -> bytes:
        """Return the font file.

        :returns: File contents.
        :raises NotFound: For a missing or unknown token, or a file outside
            the bundled and extra directories.
        """
        spec = get_font(self.token) if self.token else None
        if spec is None:
            raise NotFound(self.token or "")
        if not (is_inside(spec.path, BUNDLED_DIR) or is_inside(spec.path, extra_dir())):
            raise NotFound(self.token)
        response = self.request.response
        response.setHeader(
            "Content-Type", CONTENT_TYPES.get(spec.path.suffix.lower(), "font/ttf")
        )
        response.setHeader("Cache-Control", "public, max-age=31536000")
        response.setHeader("Access-Control-Allow-Origin", "*")
        return spec.path.read_bytes()
