"""``POST @create-certificate``: render and store a certificate."""

from collective.certificates.api import ContainerNotFound
from collective.certificates.api import create_certificate
from collective.certificates.blueprint.fields import MissingFields
from collective.certificates.blueprint.template import TemplateRenderError
from collective.certificates.services.base import CertificateService
from plone.protect.interfaces import IDisableCSRFProtection
from plone.restapi.interfaces import ISerializeToJsonSummary
from typing import Any
from zope.component import getMultiAdapter
from zope.interface import alsoProvides


class CreateCertificatePost(CertificateService):
    """``POST @create-certificate`` with ``{"data", "path", "format"}``."""

    def reply(self) -> Any:
        """Create a certificate item.

        :returns: The new item's summary, with status 201, or a 400 body.
        """
        alsoProvides(self.request, IDisableCSRFProtection)
        template = self.context
        body = self.body()
        path = body.get("path")
        if not isinstance(path, str) or not path:
            return self.bad_request("Missing path")
        issues = template.validate_blueprint()
        if issues:
            return self.bad_request("Invalid blueprint", errors=self.issues(issues))
        try:
            item = create_certificate(
                template,
                body.get("data") or {},
                path,
                format=body.get("format", "pdf"),
                filename=body.get("filename"),
            )
        except MissingFields as exc:
            return self.bad_request(str(exc), missing=exc.missing)
        except (ContainerNotFound, TemplateRenderError, ValueError) as exc:
            return self.bad_request(str(exc))
        self.request.response.setStatus(201)
        return getMultiAdapter((item, self.request), ISerializeToJsonSummary)()
