"""``@@certificate-file/<uid>``: download an issued certificate publicly."""

from collective.certificates.utils.verification import find_certificate
from Products.Five.browser import BrowserView
from typing import Any
from zExceptions import NotFound
from zope.interface import implementer
from zope.publisher.interfaces import IPublishTraverse


@implementer(IPublishTraverse)
class CertificateFileView(BrowserView):
    """Stream a certificate's file to whoever holds its UID."""

    uid: str | None = None

    def publishTraverse(self, request: Any, name: str) -> "CertificateFileView":
        """Consume the UID path segment.

        :param request: Current request.
        :param name: Path segment after the view name.
        :returns: This view.
        :raises NotFound: For a second segment.
        """
        if self.uid is not None:
            raise NotFound(name)
        self.uid = name
        return self

    def __call__(self) -> bytes:
        """Return the file.

        :returns: File contents.
        :raises NotFound: When no certificate has this UID.
        """
        certificate = find_certificate(self.uid or "")
        if certificate is None:
            raise NotFound(self.uid or "")
        file = certificate.file
        response = self.request.response
        response.setHeader("Content-Type", file.contentType)
        response.setHeader("Content-Disposition", f'inline; filename="{file.filename}"')
        return file.data
