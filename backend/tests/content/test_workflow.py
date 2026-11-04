from AccessControl.PermissionRole import rolesForPermissionOn
from collective.certificates.content.indexers import certificate_allowed_roles_and_users
from plone import api
from plone.app.testing import login
from plone.app.testing import logout
from plone.app.testing import SITE_OWNER_NAME
from typing import Any

import pytest


def roles(permission: str, obj: Any) -> set[str]:
    """Return the roles granted a permission on an object."""
    return set(rolesForPermissionOn(permission, obj))


class TestCertificateWorkflow:
    @pytest.fixture(autouse=True)
    def _setup(self, portal) -> None:
        self.portal = portal
        with api.env.adopt_roles(["Manager"]):
            self.certificate = api.content.create(
                container=portal, type="Certificate", id="certificate"
            )
        for userid, role in (("editor", "Editor"), ("siteadmin", "Site Administrator")):
            api.user.create(email=f"{userid}@example.org", username=userid)
            api.user.grant_roles(username=userid, roles=[role])

    def found(self) -> int:
        return len(api.content.find(portal_type="Certificate"))

    def test_state(self):
        assert api.content.get_state(self.certificate) == "issued"

    @pytest.mark.parametrize("permission", ["View", "Access contents information"])
    def test_anonymous_views(self, permission: str):
        """Anyone with the address can view a certificate."""
        assert "Anonymous" in roles(permission, self.certificate)

    @pytest.mark.parametrize("permission", ["Modify portal content", "Delete objects"])
    def test_only_admins_change(self, permission: str):
        """An issued certificate is changed by site administrators only."""
        assert roles(permission, self.certificate) == {"Manager", "Site Administrator"}

    def test_anonymous_traverses(self):
        logout()
        path = "/".join(self.certificate.getPhysicalPath())
        assert self.portal.restrictedTraverse(path) == self.certificate

    def test_indexed_for_managers_only(self):
        assert certificate_allowed_roles_and_users(self.certificate)() == ["Manager"]

    def test_manager_lists(self):
        login(self.portal.aq_parent, SITE_OWNER_NAME)
        assert self.found() == 1

    @pytest.mark.parametrize("userid", ["editor", "siteadmin"])
    def test_others_do_not_list(self, userid: str):
        login(self.portal, userid)
        assert self.found() == 0

    def test_anonymous_does_not_list(self):
        logout()
        assert self.found() == 0


class TestTemplateWorkflow:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, create_template) -> None:
        self.portal = portal
        self.template = create_template(portal)

    def test_state(self):
        assert api.content.get_state(self.template) == "internal"

    @pytest.mark.parametrize(
        "permission", ["View", "Access contents information", "List folder contents"]
    )
    def test_private(self, permission: str):
        """Only the people who manage templates see them."""
        assert roles(permission, self.template) == {
            "Manager",
            "Site Administrator",
            "Owner",
            "Editor",
            "Reader",
            "Contributor",
        }

    def test_modify(self):
        assert roles("Modify portal content", self.template) == {
            "Manager",
            "Site Administrator",
            "Owner",
            "Editor",
        }

    def test_images_inherit(self):
        """The template's images are as private as the template."""
        assert "Anonymous" not in roles("View", self.template["signature"])

    def test_anonymous_does_not_list(self):
        logout()
        assert len(api.content.find(portal_type="CertificateTemplate")) == 0
