"""``POST @create-certificates``: one certificate per row of a CSV file."""

from collective.certificates.api.batch import create_certificates
from collective.certificates.api.batch import InvalidCsv
from collective.certificates.services.base import CertificateService
from plone.protect.interfaces import IDisableCSRFProtection
from plone.restapi.interfaces import ISerializeToJsonSummary
from typing import Any
from zope.component import getMultiAdapter
from zope.i18n import translate
from zope.interface import alsoProvides


class CreateCertificatesPost(CertificateService):
    """``POST @create-certificates`` with ``{"csv": "<text>", "format": "pdf"}``."""

    def reply(self) -> Any:
        """Create the certificates, all of them or none.

        :returns: The new items' summaries, with status 201, or a 400 body
            listing every issue by line and column.
        """
        alsoProvides(self.request, IDisableCSRFProtection)
        template = self.context
        body = self.body()
        text = body.get("csv")
        if not isinstance(text, str):
            return self.bad_request("Missing csv")
        fmt = body.get("format", "pdf")
        if fmt not in ("pdf", "png"):
            return self.bad_request(f"Unknown format: {fmt}")
        issues = template.validate_blueprint()
        if issues:
            return self.bad_request("Invalid blueprint", errors=self.issues(issues))
        try:
            items = create_certificates(template, text, format=fmt)
        except InvalidCsv as exc:
            errors = [
                {
                    "row": issue.row,
                    "column": issue.column,
                    "message": translate(issue.message, context=self.request),
                }
                for issue in exc.issues
            ]
            return self.bad_request("Invalid CSV", errors=errors)
        self.request.response.setStatus(201)
        return {
            "items": [
                getMultiAdapter((item, self.request), ISerializeToJsonSummary)()
                for item in items
            ],
            "items_total": len(items),
        }
