"""``GET @certificate-verification/<uid>``: verify an issued certificate."""

from collective.certificates.utils.verification import find_certificate
from collective.certificates.utils.verification import summary
from plone.restapi.services import Service
from typing import Any
from zExceptions import NotFound
from zope.interface import implementer
from zope.publisher.interfaces import IPublishTraverse


@implementer(IPublishTraverse)
class VerificationGet(Service):
    """Answer whether a certificate exists, and what it certifies."""

    uid: str | None = None

    def publishTraverse(self, request: Any, name: str) -> "VerificationGet":
        """Consume the UID path segment.

        :param request: Current request.
        :param name: Path segment after the service name.
        :returns: This service.
        :raises NotFound: For a second segment.
        """
        if self.uid is not None:
            raise NotFound(name)
        self.uid = name
        return self

    def reply(self) -> dict[str, Any]:
        """Describe the certificate.

        :returns: Its public summary.
        :raises NotFound: When no certificate has this UID.
        """
        certificate = find_certificate(self.uid or "")
        if certificate is None:
            raise NotFound(self.uid or "")
        return summary(certificate)
