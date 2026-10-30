"""Font registry, font view and font copies for rendering.

These tests change the registry, so they use the function-scoped ``portal``.
"""

from collective.certificates.fonts.registry import BUNDLED


#: A bundled font file to copy into an extra directory.
INTER = BUNDLED["inter"].path
