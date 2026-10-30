from .. import load_json
from . import FOLDER
from AccessControl import Unauthorized
from collective.certificates import api as certificates
from collective.certificates.blueprint.fields import MissingFields
from collective.certificates.blueprint.template import TemplateRenderError
from collective.certificates.content.certificate import Certificate
from plone import api
from plone.app.testing import setRoles
from plone.app.testing import TEST_USER_ID

import pytest


DATA = load_json("sample/sample-data.json")


@pytest.mark.portal(content=[FOLDER], roles=["Manager"])
class TestCreateCertificate:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, create_template):
        self.portal = portal
        self.template = create_template(portal)
        self.folder = portal["certificates"]

    @pytest.mark.parametrize(
        "path",
        [
            "/certificates",
            "/plone/certificates",
            "/certificates/",
            "/plone/certificates/",
        ],
    )
    def test_path_forms(self, path: str):
        """Site-relative and absolute paths both resolve."""
        item = certificates.create_certificate(self.template, DATA, path)
        assert item.aq_parent == self.folder

    def test_container_object(self):
        item = certificates.create_certificate(self.template, DATA, self.folder)
        assert item.aq_parent == self.folder

    @pytest.mark.parametrize("path", ["/", "/plone", ""])
    def test_site_root(self, path: str):
        item = certificates.create_certificate(self.template, DATA, path or self.portal)
        assert item.aq_parent == self.portal

    def test_certificate(self):
        item = certificates.create_certificate(self.template, DATA, "/certificates")
        assert isinstance(item, Certificate)
        assert item.portal_type == "Certificate"
        assert item.id == "template-patrick-stewart"
        assert item.title == "Star Trek: Picard — Patrick Stewart"
        assert item.data == DATA
        assert item.template_uid == api.content.get_uuid(self.template)

    def test_pdf(self):
        item = certificates.create_certificate(self.template, DATA, "/certificates")
        assert item.file.filename == "template-patrick-stewart.pdf"
        assert item.file.contentType == "application/pdf"
        assert item.file.data.startswith(b"%PDF")

    def test_png_prints_own_uid(self):
        """The stored file is the render with this certificate's UID and URL."""
        item = certificates.create_certificate(
            self.template, DATA, "/certificates", format="png"
        )
        uid = api.content.get_uuid(item)
        expected = self.template.render(
            {
                **DATA,
                "certificate_uid": uid,
                "verification_url": f"{self.portal.absolute_url()}/verify/{uid}",
            },
            "png",
        )
        assert item.file.contentType == "image/png"
        assert item.file.data == expected
        assert item.file.data != self.template.render(DATA, "png")

    def test_explicit_filename(self):
        item = certificates.create_certificate(
            self.template, DATA, "/certificates", filename="custom.pdf"
        )
        assert item.id == "custom"
        assert item.file.filename == "custom.pdf"

    def test_unique_ids(self):
        first = certificates.create_certificate(self.template, DATA, "/certificates")
        second = certificates.create_certificate(self.template, DATA, "/certificates")
        assert first.id != second.id
        assert api.content.get_uuid(first) != api.content.get_uuid(second)

    def test_title_without_event(self):
        data = {**DATA, "event_name": " "}
        item = certificates.create_certificate(
            self.template, data, "/certificates", format="png"
        )
        assert item.title == "template-patrick-stewart.png"

    def test_missing_fields(self):
        """Missing values fail before anything is created."""
        with pytest.raises(MissingFields) as exc:
            certificates.create_certificate(
                self.template, {"full_name": "Ana"}, "/certificates"
            )
        assert "total_hours" in exc.value.missing
        assert "verification_url" not in exc.value.missing
        assert self.folder.objectIds() == []

    def test_bad_date(self):
        """A value that cannot be rendered fails before anything is created."""
        data = {**DATA, "event_start_date": "26/05/2026"}
        with pytest.raises(TemplateRenderError):
            certificates.create_certificate(self.template, data, "/certificates")
        assert self.folder.objectIds() == []

    def test_unknown_path(self):
        with pytest.raises(certificates.ContainerNotFound):
            certificates.create_certificate(self.template, DATA, "/nowhere")

    def test_unknown_format(self):
        with pytest.raises(ValueError, match="Unknown format"):
            certificates.create_certificate(
                self.template, DATA, "/certificates", format="gif"
            )

    def test_render_certificate(self):
        assert certificates.render_certificate(self.template, DATA, "png").startswith(
            b"\x89PNG"
        )


class TestDefaults:
    def test_filename_without_name(self, portal, create_template):
        template = create_template(portal)
        assert certificates.default_filename(template, {}, "pdf") == "template.pdf"

    def test_title_without_name(self):
        assert certificates.default_title({"event_name": "X"}, "f.pdf") == "f.pdf"


@pytest.mark.portal(content=[FOLDER])
class TestPermissions:
    def test_no_add_permission(self, portal, create_template):
        """The caller's permissions apply: a Member cannot add to the folder."""
        template = create_template(portal)
        setRoles(portal, TEST_USER_ID, ["Member"])
        with pytest.raises(Unauthorized):
            certificates.create_certificate(template, DATA, "/certificates")
