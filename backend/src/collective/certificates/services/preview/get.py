"""``GET @preview``: the stored blueprint drawn with the sample data."""

from collective.certificates.blueprint.fields import sample_data
from collective.certificates.blueprint.template import TemplateRenderError
from collective.certificates.services.base import CertificateService
from typing import Any


class PreviewGet(CertificateService):
    """``GET @preview?format=png|svg``: the stored blueprint with sample data."""

    def reply(self) -> Any:
        """Render the preview.

        :returns: PNG or SVG bytes, or a 400 body.
        """
        template = self.context
        fmt = self.request.form.get("format", "png")
        if fmt not in ("png", "svg"):
            return self.bad_request(f"Unknown format: {fmt}")
        issues = template.validate_blueprint()
        if issues:
            return self.bad_request("Invalid blueprint", errors=self.issues(issues))
        data = {**sample_data(), **(template.sample_data or {})}
        self.request.response.setHeader("Cache-Control", "private, no-store")
        filename = f"{template.getId()}-preview.{fmt}"
        try:
            if fmt == "svg":
                body = template.svg(data).encode("utf-8")
                return self.file(body, "image/svg+xml", filename, True)
            return self.file(template.render(data, "png"), "image/png", filename, True)
        except TemplateRenderError as exc:
            return self.bad_request(str(exc))
