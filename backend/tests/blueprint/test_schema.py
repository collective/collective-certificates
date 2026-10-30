from .. import BLUEPRINTS
from .. import load_blueprint
from .. import load_json
from .. import PAGE
from . import ASSETS
from . import FONTS
from collective.certificates.blueprint.model import empty_blueprint
from collective.certificates.blueprint.validate import schema_issues
from collective.certificates.blueprint.validate import validate

import pytest


INVALID = load_json("invalid-blueprints.json")["cases"]


class TestValidFixtures:
    @pytest.mark.parametrize("name", BLUEPRINTS)
    def test_valid(self, name: str):
        """Every valid fixture passes schema and semantic checks."""
        assert validate(load_blueprint(name), FONTS, PAGE, ASSETS) == []

    def test_empty_blueprint(self):
        """The default value of the field is valid."""
        assert schema_issues(empty_blueprint()) == []

    def test_empty_blueprint_size(self):
        """The default page is A4 landscape at 300 dpi."""
        assert empty_blueprint()["page"] == {"width": 3508, "height": 2480}


class TestInvalidFixtures:
    @pytest.mark.parametrize("case", INVALID, ids=[case["name"] for case in INVALID])
    def test_issues(self, case: dict):
        """Each invalid fixture yields exactly the expected (element, path) pairs."""
        assets = set(case.get("context", {}).get("assets", ASSETS))
        issues = validate(case["blueprint"], FONTS, PAGE, assets)
        assert [{"element": i["element"], "path": i["path"]} for i in issues] == case[
            "errors"
        ]

    @pytest.mark.parametrize("case", INVALID, ids=[case["name"] for case in INVALID])
    def test_messages_translatable(self, case: dict):
        """Every issue carries a translatable message in our domain."""
        assets = set(case.get("context", {}).get("assets", ASSETS))
        for issue in validate(case["blueprint"], FONTS, PAGE, assets):
            assert issue["message"].domain == "collective.certificates"

    def test_schema_message_names_path(self):
        """Schema errors name the path and keep the validator's detail."""
        issue = schema_issues({
            "version": 2,
            "page": {"width": 1, "height": 1},
            "elements": [],
        })[0]
        assert issue["message"].mapping["path"] == "/version"
        assert issue["message"].mapping["detail"] == "1 was expected"

    def test_root_error_path(self):
        """A root-level error is reported at '/' in the message."""
        issue = schema_issues([])[0]
        assert issue["path"] == ""
        assert issue["message"].mapping["path"] == "/"

    def test_layout_checks_can_be_skipped(self):
        """check_layout=False ignores page size and bounds."""
        case = next(c for c in INVALID if c["name"] == "outside-page")
        assert (
            validate(case["blueprint"], FONTS, (1, 1), ASSETS, check_layout=False) == []
        )

    def test_assets_unknown(self):
        """Without known assets, image elements are not checked against them."""
        case = next(c for c in INVALID if c["name"] == "missing-asset")
        assert validate(case["blueprint"], FONTS, PAGE, None) == []

    def test_background_unknown(self):
        """Without a known background, the page size is not checked."""
        case = next(c for c in INVALID if c["name"] == "page-mismatch")
        assert validate(case["blueprint"], FONTS, None, ASSETS) == []

    def test_json_pointer_escaping(self):
        """'~' and '/' are escaped in pointers."""
        from collective.certificates.blueprint.validate import pointer

        assert pointer(["a/b", "c~d", 0]) == "/a~1b/c~0d/0"
