"""Tests for collective.certificates."""

from pathlib import Path
from typing import Any

import json


#: Shared fixtures; the frontend keeps byte-identical copies.
RESOURCES: Path = Path(__file__).parent / "_resources"

#: Valid blueprint fixtures, by name.
BLUEPRINTS: tuple[str, ...] = ("sample", "minimal", "every-element")

#: Size of the sample background.
PAGE: tuple[int, int] = (3508, 2480)


def load_json(relative: str) -> Any:
    """Load a JSON file below ``_resources``."""
    return json.loads((RESOURCES / relative).read_text(encoding="utf-8"))


def load_blueprint(name: str) -> dict:
    """Load one of :data:`BLUEPRINTS`."""
    return load_json(f"blueprints/{name}.json")
