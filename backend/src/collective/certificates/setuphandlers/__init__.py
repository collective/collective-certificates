from plone.base.interfaces.installable import INonInstallable
from zope.interface import implementer


@implementer(INonInstallable)
class HiddenProfiles:
    def getNonInstallableProfiles(self) -> list[str]:
        """Hide uninstall profile from site-creation and quickinstaller."""
        return [
            "collective.certificates:uninstall",
        ]

    def getNonInstallableProducts(self) -> list[str]:
        """Hide no product from site-creation and quickinstaller."""
        return []
