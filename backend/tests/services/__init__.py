"""REST API services, over HTTP."""

from .. import load_blueprint
from .. import load_json


DATA = load_json("sample/sample-data.json")


def outside_page() -> dict:
    """The sample blueprint with one element pushed off the page."""
    bp = load_blueprint("sample")
    bp["elements"][-1]["x"] = 3400
    return bp


#: Templates the functional portal is provisioned with: id → overrides.
TEMPLATES: dict[str, dict] = {
    "template": {"title": "Template"},
    "broken": {"title": "Broken", "blueprint": outside_page()},
    "bad-sample": {"title": "Bad sample", "sample_data": {"event_start_date": "soon"}},
}
