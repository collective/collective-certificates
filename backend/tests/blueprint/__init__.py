"""Blueprint format, validation, placeholder language and rendering."""

from collective.certificates.fonts.registry import BUNDLED


#: Validation context the shared fixtures assume.
FONTS: set[str] = set(BUNDLED)
ASSETS: set[str] = {"background", "signature"}
