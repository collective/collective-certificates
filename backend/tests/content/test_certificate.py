from collective.certificates.content.certificate import Certificate
from collective.certificates.content.certificate import ICertificate
from plone import api
from plone.dexterity.fti import DexterityFTI
from zope.annotation.interfaces import IAnnotations
from zope.schema import getFieldsInOrder

import pytest


BEHAVIORS = ("plone.basic", "plone.shortname", "plone.excludefromnavigation")


class TestFTI:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_fti):
        self.fti: DexterityFTI = get_fti("Certificate")

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("title", "Certificate"),
            ("klass", "collective.certificates.content.certificate.Certificate"),
            ("schema", "collective.certificates.content.certificate.ICertificate"),
            ("global_allow", True),
            ("allowed_content_types", ()),
            ("add_permission", "collective.certificates.AddCertificate"),
        ],
    )
    def test_fti(self, attr: str, expected):
        assert getattr(self.fti, attr) == expected

    @pytest.mark.parametrize("idx,behavior", list(enumerate(BEHAVIORS)))
    def test_behaviors(self, idx: int, behavior: str):
        assert self.fti.behaviors[idx] == behavior

    def test_behaviors_count(self):
        assert len(self.fti.behaviors) == len(BEHAVIORS)


class TestSchema:
    def test_fields(self):
        assert [name for name, _ in getFieldsInOrder(ICertificate)] == [
            "file",
            "data",
            "template_uid",
        ]

    @pytest.mark.parametrize("name", ["data", "template_uid"])
    def test_readonly(self, name: str):
        """Values and template are a record of how it was issued."""
        assert ICertificate[name].readonly is True

    def test_primary_field(self):
        """The file is the primary field, as for a File."""
        from plone.rfc822.interfaces import IPrimaryField

        assert IPrimaryField.providedBy(ICertificate["file"])

    def test_class(self):
        assert ICertificate.implementedBy(Certificate)


class TestContent:
    def test_annotations_per_instance(self, portal):
        """Each certificate keeps its own annotations."""
        with api.env.adopt_roles(["Manager"]):
            first, second = (
                api.content.create(container=portal, type="Certificate", id=name)
                for name in ("first", "second")
            )
        assert isinstance(first, Certificate)
        IAnnotations(first)["probe"] = 1
        assert "probe" not in IAnnotations(second)
