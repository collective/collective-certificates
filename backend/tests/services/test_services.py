from .. import load_blueprint
from .. import PAGE
from . import DATA
from PIL import Image
from plone import api

import io
import pytest
import transaction


class TestPreview:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, request_factory):
        self.portal = portal
        self.manager = request_factory(role="Manager")
        self.anon = request_factory(role="Anonymous")

    def test_png(self):
        response = self.manager.get("template/@preview")
        assert response.status_code == 200
        assert response.headers["Content-Type"] == "image/png"
        assert response.headers["Cache-Control"] == "private, no-store"
        assert (
            response.headers["Content-Disposition"]
            == 'inline; filename="template-preview.png"'
        )
        assert Image.open(io.BytesIO(response.content)).size == PAGE

    def test_svg(self):
        response = self.manager.get("template/@preview", params={"format": "svg"})
        assert response.status_code == 200
        assert response.headers["Content-Type"].startswith("image/svg+xml")
        assert "Patrick Stewart" in response.text

    def test_unknown_format(self):
        response = self.manager.get("template/@preview", params={"format": "gif"})
        assert response.status_code == 400
        assert response.json()["error"]["message"] == "Unknown format: gif"

    def test_invalid_blueprint(self):
        response = self.manager.get("broken/@preview")
        assert response.status_code == 400
        error = response.json()["error"]
        assert error["message"] == "Invalid blueprint"
        assert error["errors"] == [
            {
                "element": "qr",
                "path": "/elements/8",
                "message": "qr: the element does not fit on the page.",
            }
        ]

    def test_bad_sample_data(self):
        response = self.manager.get("bad-sample/@preview")
        assert response.status_code == 400
        assert "Not an ISO date" in response.json()["error"]["message"]

    def test_anonymous(self):
        assert self.anon.get("template/@preview").status_code == 401


class TestRender:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, request_factory):
        self.manager = request_factory(role="Manager")
        self.anon = request_factory(role="Anonymous")

    def test_pdf(self):
        response = self.manager.post("template/@render", json={"data": DATA})
        assert response.status_code == 200
        assert response.headers["Content-Type"] == "application/pdf"
        assert (
            response.headers["Content-Disposition"]
            == 'attachment; filename="template-patrick-stewart.pdf"'
        )
        assert response.content.startswith(b"%PDF")

    def test_png(self):
        response = self.manager.post(
            "template/@render", json={"data": DATA, "format": "png"}
        )
        assert response.status_code == 200
        assert response.content.startswith(b"\x89PNG")

    def test_missing_fields(self):
        response = self.manager.post(
            "template/@render", json={"data": {"full_name": "Ana"}}
        )
        assert response.status_code == 400
        assert response.json()["error"]["missing"] == [
            "event_end_date",
            "event_name",
            "event_start_date",
            "responsible_person",
            "total_hours",
        ]

    def test_no_body(self):
        response = self.manager.post("template/@render")
        assert response.status_code == 400
        assert "full_name" in response.json()["error"]["missing"]

    def test_unknown_format(self):
        response = self.manager.post(
            "template/@render", json={"data": DATA, "format": "gif"}
        )
        assert response.status_code == 400

    def test_invalid_blueprint(self):
        response = self.manager.post("broken/@render", json={"data": DATA})
        assert response.status_code == 400
        assert response.json()["error"]["errors"][0]["element"] == "qr"

    def test_bad_date(self):
        data = {**DATA, "event_end_date": "31/12/2026"}
        response = self.manager.post("template/@render", json={"data": data})
        assert response.status_code == 400

    def test_anonymous(self):
        assert (
            self.anon.post("template/@render", json={"data": DATA}).status_code == 401
        )


class TestValidateBlueprint:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, request_factory):
        self.manager = request_factory(role="Manager")

    def test_valid(self):
        response = self.manager.post(
            "template/@validate-blueprint", json={"blueprint": load_blueprint("sample")}
        )
        assert response.status_code == 200
        assert response.json() == {"errors": [], "valid": True}

    def test_invalid(self):
        bp = load_blueprint("minimal")
        bp["elements"][0]["font"] = "comic-sans"
        response = self.manager.post(
            "template/@validate-blueprint", json={"blueprint": bp}
        )
        assert response.json() == {
            "errors": [
                {
                    "element": "name",
                    "path": "/elements/0/font",
                    "message": "name: unknown font comic-sans.",
                }
            ],
            "valid": False,
        }

    def test_schema_error(self):
        response = self.manager.post(
            "template/@validate-blueprint", json={"blueprint": {"version": 2}}
        )
        body = response.json()
        assert body["valid"] is False
        assert body["errors"][0]["message"].startswith("Invalid value at /:")

    def test_missing(self):
        response = self.manager.post("template/@validate-blueprint", json={})
        assert response.status_code == 400


class TestCreateCertificate:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, request_factory):
        self.portal = portal
        self.factory = request_factory
        self.manager = request_factory(role="Manager")

    def test_created(self):
        response = self.manager.post(
            "template/@create-certificate", json={"data": DATA, "path": "/certificates"}
        )
        assert response.status_code == 201
        body = response.json()
        assert body["@type"] == "Certificate"
        assert body["title"] == "Star Trek: Picard — Patrick Stewart"
        assert body["@id"].endswith("/certificates/template-patrick-stewart")
        transaction.begin()
        item = api.content.get(path="/certificates/template-patrick-stewart")
        assert item.file.data.startswith(b"%PDF")

    def test_png_with_filename(self):
        response = self.manager.post(
            "template/@create-certificate",
            json={
                "data": DATA,
                "path": "/certificates",
                "format": "png",
                "filename": "c.png",
            },
        )
        assert response.status_code == 201
        assert response.json()["@type"] == "Certificate"
        assert response.json()["@id"].endswith("/certificates/c")

    @pytest.mark.parametrize(
        "body,message",
        [
            ({"data": DATA}, "Missing path"),
            ({"data": DATA, "path": ""}, "Missing path"),
            ({"data": DATA, "path": "/nowhere"}, "No container at /nowhere"),
            (
                {"data": DATA, "path": "/certificates", "format": "gif"},
                "Unknown format: gif",
            ),
            (
                {"data": {**DATA, "event_start_date": "x"}, "path": "/certificates"},
                "Not an ISO date (YYYY-MM-DD): 'x'",
            ),
        ],
    )
    def test_bad_request(self, body: dict, message: str):
        response = self.manager.post("template/@create-certificate", json=body)
        assert response.status_code == 400
        assert response.json()["error"]["message"] == message

    def test_missing_fields(self):
        response = self.manager.post(
            "template/@create-certificate", json={"data": {}, "path": "/certificates"}
        )
        assert response.status_code == 400
        assert len(response.json()["error"]["missing"]) == 6

    def test_invalid_blueprint(self):
        response = self.manager.post(
            "broken/@create-certificate", json={"data": DATA, "path": "/certificates"}
        )
        assert response.status_code == 400

    def test_editor_without_add_permission(self, editor):
        """Edit permission on the template is not enough to add to the folder."""
        session = self.factory(basic_auth=editor)
        assert (
            session.post(
                "template/@validate-blueprint", json={"blueprint": {}}
            ).status_code
            == 200
        )
        response = session.post(
            "template/@create-certificate", json={"data": DATA, "path": "/certificates"}
        )
        assert response.status_code == 401
        transaction.begin()
        assert self.portal["certificates"].objectIds() == []

    def test_editor_on_own_folder(self, editor):
        """With add permission on the container, an editor can create certificates."""
        folder = self.portal["certificates"]
        with api.env.adopt_roles(["Manager"]):
            api.user.grant_roles(username=editor[0], obj=folder, roles=["Contributor"])
            folder.manage_permission(
                "collective.certificates: Add Certificate", ["Contributor"]
            )
        transaction.commit()
        session = self.factory(basic_auth=editor)
        response = session.post(
            "template/@create-certificate", json={"data": DATA, "path": "/certificates"}
        )
        assert response.status_code == 201
