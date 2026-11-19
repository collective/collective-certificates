"""Serialize a certificate with the SHA-256 of its file."""

from collective.certificates.content.certificate import ICertificate
from collective.certificates.interfaces import IBrowserLayer
from collective.certificates.utils.verification import file_hash
from plone.restapi.interfaces import ISerializeToJson
from plone.restapi.serializer.dxcontent import SerializeToJson
from typing import Any
from zope.component import adapter
from zope.interface import implementer


@implementer(ISerializeToJson)
@adapter(ICertificate, IBrowserLayer)
class CertificateSerializeToJson(SerializeToJson):
    """Fill in ``file_hash`` for certificates issued before it was stored."""

    def __call__(self, *args: Any, **kwargs: Any) -> dict[str, Any]:
        """Serialize the certificate.

        :returns: The default serialization, with ``file_hash`` set.
        """
        result: dict[str, Any] = super().__call__(*args, **kwargs)
        result["file_hash"] = file_hash(self.context)
        return result
