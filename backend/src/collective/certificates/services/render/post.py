"""``POST @render``: a certificate file, without storing it."""

from collective.certificates.api import CONTENT_TYPES
from collective.certificates.api import default_filename
from collective.certificates.api import render_certificate
from collective.certificates.blueprint.fields import MissingFields
from collective.certificates.blueprint.template import TemplateRenderError
from collective.certificates.services.base import CertificateService
from typing import Any


class RenderPost(CertificateService):
    """``POST @render`` with ``{"data": {...}, "format": "pdf"}``."""

    def reply(self) -> Any:
        """Render a certificate.

        :returns: The file, or a 400 body.
        """
        template = self.context
        body = self.body()
        data = body.get("data") or {}
        fmt = body.get("format", "pdf")
        if fmt not in CONTENT_TYPES:
            return self.bad_request(f"Unknown format: {fmt}")
        issues = template.validate_blueprint()
        if issues:
            return self.bad_request("Invalid blueprint", errors=self.issues(issues))
        try:
            content = render_certificate(template, data, fmt)
        except MissingFields as exc:
            return self.bad_request(str(exc), missing=exc.missing)
        except TemplateRenderError as exc:
            return self.bad_request(str(exc))
        filename = default_filename(template, data, fmt)
        return self.file(content, CONTENT_TYPES[fmt], filename, False)
