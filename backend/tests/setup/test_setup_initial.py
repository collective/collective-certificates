from collective.certificates.blueprint.validate import validate
from collective.certificates.fonts.registry import all_fonts
from collective.certificates.utils.rendering import render
from plone import api

import pytest


TEMPLATE_PATH = "/starfleet-academy-certificate"


@pytest.mark.portal(profiles=["collective.certificates:initial"])
class TestInitialProfile:
    @pytest.fixture(autouse=True)
    def _setup(self, portal) -> None:
        self.portal = portal

    @pytest.mark.parametrize(
        "path,portal_type",
        [
            ("/images", "Document"),
            ("/images/plone-foundation.png", "Image"),
            (TEMPLATE_PATH, "CertificateTemplate"),
        ],
    )
    def test_example_content(self, path: str, portal_type: str):
        """The initial profile imports the example content."""
        content = api.content.get(path=path)
        assert content.portal_type == portal_type


@pytest.mark.portal(profiles=["collective.certificates:initial"])
class TestInitialPermissions:
    @pytest.fixture(autouse=True)
    def _setup(self, portal) -> None:
        self.portal = portal

    @pytest.mark.parametrize(
        "permission",
        [
            "collective.certificates: Add CertificateTemplate",
            "collective.certificates: Add Certificate",
        ],
    )
    def test_manager_only(self, permission: str):
        """The example content profile lets Managers, and only them, add."""
        roles = [
            role["name"]
            for role in self.portal.rolesOfPermission(permission)
            if role["selected"]
        ]
        assert roles == ["Manager"]


@pytest.mark.portal(profiles=["collective.certificates:initial"])
class TestExampleTemplate:
    @pytest.fixture(autouse=True)
    def _setup(self, portal) -> None:
        self.template = api.content.get(path=TEMPLATE_PATH)

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("title", "Starfleet Academy Certificate"),
            ("date_format", "long"),
        ],
    )
    def test_settings(self, attr: str, expected: str):
        """The example template comes configured."""
        assert getattr(self.template, attr) == expected

    def test_background(self):
        assert self.template.background.getImageSize() == (2338, 1652)

    def test_signature_item(self):
        """The signature is an Image item inside the template."""
        signature = self.template["signature"]
        assert signature.portal_type == "Image"
        assert signature.title == "Signature"
        assert signature.image.getImageSize() == (900, 220)

    def test_assets(self):
        assert self.template.assets() == {"background", "signature"}

    def test_blueprint_is_valid(self):
        """The design fits the background and uses known fonts and assets."""
        blueprint = self.template.blueprint
        assert blueprint["page"] == {"width": 2338, "height": 1652}
        issues = validate(
            blueprint, set(all_fonts()), (2338, 1652), self.template.assets()
        )
        assert issues == []

    def test_sample_data(self):
        assert self.template.sample_data["full_name"] == "Patrick Stewart"
        assert self.template.sample_data["event_name"] == "Star Trek: Picard"

    def test_english_text(self):
        """The design's own text is in English."""
        texts = {
            element["id"]: element["content"]
            for element in self.template.blueprint["elements"]
            if element["type"] == "text"
        }
        assert texts["certify"] == "This certifies that"
        assert texts["role"] == "Course director"

    def test_renders_with_sample_data(self):
        """The sample data covers every field the design uses."""
        png = render(self.template, dict(self.template.sample_data), "png")
        assert png.startswith(b"\x89PNG")
