from . import DATA
from collective.certificates.api.batch import COLUMNS
from plone import api

import pytest
import transaction


HEADER = ",".join(COLUMNS)


def row(container: str = "/certificates", **overrides: str) -> str:
    """Return one CSV line with the sample data."""
    values = {**DATA, "parent_container": container, **overrides}
    return ",".join(values.get(column, "") for column in COLUMNS)


class TestCertificatesCsv:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, request_factory):
        self.manager = request_factory(role="Manager")
        self.anon = request_factory(role="Anonymous")

    def test_get(self):
        response = self.manager.get("template/@certificates-csv")
        assert response.status_code == 200
        body = response.json()
        assert body["filename"] == "template.csv"
        lines = body["csv"].splitlines()
        assert lines[0] == HEADER
        assert lines[1].startswith("/,")

    def test_anonymous(self):
        assert self.anon.get("template/@certificates-csv").status_code == 401


class TestCreateCertificates:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, request_factory):
        self.portal = portal
        self.factory = request_factory
        self.manager = request_factory(role="Manager")

    def post(self, session, csv: str, template: str = "template", **extra):
        return session.post(
            f"{template}/@create-certificates", json={"csv": csv, **extra}
        )

    def test_created(self):
        text = f"{HEADER}\n{row()}\n{row(full_name='William Riker')}\n"
        response = self.post(self.manager, text)
        assert response.status_code == 201
        body = response.json()
        assert body["items_total"] == 2
        assert [item["title"] for item in body["items"]] == [
            "Star Trek: Picard — Patrick Stewart",
            "Star Trek: Picard — William Riker",
        ]
        transaction.begin()
        assert len(self.portal["certificates"].objectIds()) == 2

    def test_png(self):
        response = self.post(self.manager, f"{HEADER}\n{row()}\n", format="png")
        assert response.status_code == 201
        transaction.begin()
        item = self.portal["certificates"].objectValues()[0]
        assert item.file.contentType == "image/png"

    def test_invalid_rows(self):
        """Every issue by line and column; nothing created."""
        text = f"{HEADER}\n{row()}\n{row('/nowhere')}\n"
        response = self.post(self.manager, text)
        assert response.status_code == 400
        error = response.json()["error"]
        assert error["message"] == "Invalid CSV"
        assert error["errors"] == [
            {
                "row": 3,
                "column": "parent_container",
                "message": "No container at /nowhere.",
            }
        ]
        transaction.begin()
        assert self.portal["certificates"].objectIds() == []

    @pytest.mark.parametrize(
        "body,message",
        [
            ({"csv": 1}, "Missing csv"),
            ({}, "Missing csv"),
            ({"csv": "", "format": "gif"}, "Unknown format: gif"),
        ],
    )
    def test_bad_request(self, body: dict, message: str):
        response = self.manager.post("template/@create-certificates", json=body)
        assert response.status_code == 400
        assert response.json()["error"]["message"] == message

    def test_invalid_blueprint(self):
        response = self.post(self.manager, f"{HEADER}\n{row()}\n", template="broken")
        assert response.status_code == 400
        assert response.json()["error"]["message"] == "Invalid blueprint"

    def test_editor_cannot_add(self, editor):
        """Editing the template is not enough: the folder must allow adding."""
        session = self.factory(basic_auth=editor)
        response = self.post(session, f"{HEADER}\n{row()}\n")
        assert response.status_code == 400
        assert response.json()["error"]["errors"][0]["message"] == (
            "You cannot add certificates to /certificates."
        )

    def test_anonymous(self):
        response = self.post(self.factory(role="Anonymous"), f"{HEADER}\n{row()}\n")
        assert response.status_code == 401
        transaction.begin()
        assert len(api.content.find(portal_type="Certificate")) == 0
