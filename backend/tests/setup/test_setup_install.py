from . import ADD_PERMISSIONS
from . import RECORDS
from . import VOCABULARIES
from collective.certificates import PACKAGE_NAME
from plone import api
from zope.component import queryUtility
from zope.schema.interfaces import IVocabularyFactory

import pytest


class TestSetupInstall:
    @pytest.fixture(autouse=True)
    def _setup(self, portal) -> None:
        self.portal = portal

    def test_addon_installed(self):
        """The add-on is installed, with no upgrade pending."""
        assert api.addon.get(PACKAGE_NAME).flags == ["installed"]

    def test_browserlayer(self, browser_layers):
        """IBrowserLayer is registered."""
        from collective.certificates.interfaces import IBrowserLayer

        assert IBrowserLayer in browser_layers

    def test_latest_version(self, profile_last_version):
        """Latest version of the default profile."""
        assert profile_last_version(f"{PACKAGE_NAME}:default") == "1000"

    @pytest.mark.parametrize("name,default", RECORDS)
    def test_registry_record(self, name: str, default):
        """Registry records exist with their defaults."""
        assert api.portal.get_registry_record(name) == default

    @pytest.mark.parametrize("permission", ADD_PERMISSIONS)
    def test_add_permission_no_role(self, permission: str):
        """The install profile grants the add permissions to no role."""
        setup = self.portal.portal_setup
        setup.runImportStepFromProfile(f"profile-{PACKAGE_NAME}:default", "rolemap")
        roles = [
            role["name"]
            for role in self.portal.rolesOfPermission(permission)
            if role["selected"]
        ]
        assert roles == []
        assert not self.portal.acquiredRolesAreUsedBy(permission)

    @pytest.mark.parametrize("name", VOCABULARIES)
    def test_vocabulary_registered(self, name: str):
        """Every vocabulary is registered."""
        assert queryUtility(IVocabularyFactory, name=name) is not None

    def test_workflow(self):
        """Templates use the simple publication workflow."""
        wftool = api.portal.get_tool("portal_workflow")
        for portal_type in ("Certificate", "CertificateTemplate"):
            assert wftool.getChainForPortalType(portal_type) == (
                "simple_publication_workflow",
            )

    def test_font_view(self):
        """The font view is registered on the site root."""
        view = api.content.get_view(
            "certificate-font", self.portal, self.portal.REQUEST
        )
        assert view is not None
