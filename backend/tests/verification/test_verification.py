from . import DATA
from . import FOLDER
from collective.certificates.api import create_certificate
from collective.certificates.utils.verification import file_hash
from collective.certificates.utils.verification import find_certificate
from collective.certificates.utils.verification import sha256
from collective.certificates.utils.verification import site_url
from collective.certificates.utils.verification import summary
from collective.certificates.utils.verification import verification_url
from plone import api
from plone.app.testing import logout

import pytest


@pytest.mark.portal(content=[FOLDER], roles=["Manager"])
class TestFindCertificate:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, create_template):
        self.portal = portal
        self.template = create_template(portal)
        self.certificate = create_certificate(self.template, DATA, "/certificates")
        self.uid = api.content.get_uuid(self.certificate)

    def test_found(self):
        assert find_certificate(self.uid) == self.certificate

    def test_unlisted_found_anonymously(self):
        """Holding the UID is enough, though the catalog lists it to no one."""
        logout()
        assert len(api.content.find(UID=self.uid)) == 0
        assert find_certificate(self.uid).getId() == self.certificate.getId()

    @pytest.mark.parametrize(
        "uid",
        [
            "",
            "nope",
            "257E08FDCD07FF6FA3D1BC14F6AEC321",
            "257e08fdcd07ff6fa3d1bc14f6aec3",
            "../x",
        ],
    )
    def test_malformed(self, uid: str):
        assert find_certificate(uid) is None

    def test_unknown(self):
        assert find_certificate("0" * 32) is None

    def test_other_type(self):
        """The template's UID is not a certificate's."""
        assert find_certificate(api.content.get_uuid(self.template)) is None

    def test_summary(self):
        result = summary(self.certificate)
        assert result["uid"] == self.uid
        assert result["title"] == "Star Trek: Picard — Patrick Stewart"
        assert result["data"] == DATA
        assert result["fields"][0] == {
            "token": "full_name",
            "title": "Full name",
            "kind": "text",
            "value": "Patrick Stewart",
        }
        assert [field["token"] for field in result["fields"]] == list(DATA)
        assert result["template"] == {
            "uid": api.content.get_uuid(self.template),
            "title": "Sample template",
        }
        assert result["issued"].startswith(str(self.certificate.created().year()))
        assert result["file"] == {
            "download": f"{self.portal.absolute_url()}/@@certificate-file/{self.uid}",
            "filename": "template-patrick-stewart.pdf",
            "content-type": "application/pdf",
            "size": self.certificate.file.getSize(),
            "sha256": self.certificate.file_hash,
        }

    def test_file_hash_stored(self):
        """The hash stored at issue wins over the current file's."""
        self.certificate.file_hash = "f" * 64
        assert file_hash(self.certificate) == "f" * 64
        assert summary(self.certificate)["file"]["sha256"] == "f" * 64

    def test_file_hash_computed(self):
        """A certificate issued before hashes were stored gets its file's."""
        expected = self.certificate.file_hash
        self.certificate.file_hash = None
        assert file_hash(self.certificate) == expected
        assert expected == sha256(self.certificate.file.data)

    def test_file_hash_without_file(self):
        bare = api.content.create(container=self.portal, type="Certificate", id="bare")
        assert file_hash(bare) is None

    def test_sha256(self):
        assert sha256(b"abc") == (
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        )

    def test_verification_url(self):
        """The site's verification page, served by the frontend."""
        assert verification_url(self.uid) == (
            f"{self.portal.absolute_url()}/verify/{self.uid}"
        )

    @pytest.mark.parametrize(
        "domain", ["https://www.example.org", "https://www.example.org/"]
    )
    def test_verification_url_frontend_domain(self, monkeypatch, domain: str):
        """VOLTO_FRONTEND_DOMAIN wins, as it does for plone.volto."""
        monkeypatch.setenv("VOLTO_FRONTEND_DOMAIN", domain)
        assert site_url() == "https://www.example.org"
        assert verification_url("abc") == "https://www.example.org/verify/abc"

    def test_summary_template_gone(self):
        api.content.delete(obj=self.template, check_linkintegrity=False)
        assert summary(self.certificate)["template"] is None
