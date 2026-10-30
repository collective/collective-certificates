"""QR codes as module matrices and SVG paths.

Encoding is always byte mode in UTF-8, at exactly the requested error
correction level (no automatic boost), so that the frontend's encoder can
reach the same symbol version for the same input.
"""

import segno


#: Light modules around the symbol, inside the element's box.
QUIET_ZONE = 4


def qr_matrix(content: str, ec: str) -> list[list[bool]]:
    """Encode content as a QR code.

    :param content: Text to encode.
    :param ec: Error correction level, one of ``L``, ``M``, ``Q``, ``H``.
    :returns: Rows of modules, ``True`` for dark, without quiet zone.
    """
    code = segno.make_qr(
        content, error=ec, mode="byte", encoding="utf-8", boost_error=False
    )
    return [[bool(module) for module in row] for row in code.matrix]


def qr_path(matrix: list[list[bool]], offset: int = QUIET_ZONE) -> str:
    """Draw dark modules as one SVG path, a rectangle per horizontal run.

    :param matrix: Module rows.
    :param offset: Shift applied to both axes, in modules.
    :returns: Path data such as ``M4 4h7v1h-7z``.
    """
    parts: list[str] = []
    for y, row in enumerate(matrix):
        x = 0
        while x < len(row):
            if not row[x]:
                x += 1
                continue
            start = x
            while x < len(row) and row[x]:
                x += 1
            run = x - start
            parts.append(f"M{start + offset} {y + offset}h{run}v1h-{run}z")
    return "".join(parts)
