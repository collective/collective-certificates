from . import DATA
from collective.certificates.api import create_certificate
from plone import api

import pytest
import transaction


@pytest.fixture
def certificate(portal):
    """A private certificate, committed so HTTP requests see it."""
    with api.env.adopt_roles(["Manager"]):
        item = create_certificate(portal["template"], DATA, "/certificates")
    transaction.commit()
    return item


class TestVerificationService:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, certificate, request_factory):
        self.portal = portal
        self.certificate = certificate
        self.uid = api.content.get_uuid(certificate)
        self.anon = request_factory(role="Anonymous")

    def test_anonymous_summary(self):
        response = self.anon.get(f"@certificate-verification/{self.uid}")
        assert response.status_code == 200
        body = response.json()
        assert body["uid"] == self.uid
        assert body["data"]["full_name"] == "Patrick Stewart"
        assert body["template"]["title"] == "Template"
        assert body["file"]["download"].endswith(f"/@@certificate-file/{self.uid}")

    @pytest.mark.parametrize("uid", ["0" * 32, "nope"])
    def test_not_found(self, uid: str):
        assert self.anon.get(f"@certificate-verification/{uid}").status_code == 404

    def test_no_uid(self):
        assert self.anon.get("@certificate-verification").status_code == 404

    def test_extra_segment(self):
        assert (
            self.anon.get(f"@certificate-verification/{self.uid}/x").status_code == 404
        )


class TestCertificateFile:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, certificate, request_factory):
        self.certificate = certificate
        self.uid = api.content.get_uuid(certificate)
        self.anon = request_factory(role="Anonymous", api=False)

    def test_anonymous_download(self):
        response = self.anon.get(f"@@certificate-file/{self.uid}")
        assert response.status_code == 200
        assert response.headers["Content-Type"] == "application/pdf"
        assert response.headers["Content-Disposition"] == (
            'inline; filename="template-patrick-stewart.pdf"'
        )
        assert response.content == self.certificate.file.data

    def test_download_through_api(self):
        """The Volto verification page links the file through ``++api++``."""
        response = self.anon.get(f"++api++/@@certificate-file/{self.uid}")
        assert response.status_code == 200
        assert response.content == self.certificate.file.data

    def test_not_found(self):
        assert self.anon.get(f"@@certificate-file/{'0' * 32}").status_code == 404

    def test_extra_segment(self):
        assert self.anon.get(f"@@certificate-file/{self.uid}/x").status_code == 404
