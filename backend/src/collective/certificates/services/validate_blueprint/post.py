"""``POST @validate-blueprint``: check a blueprint against a template."""

from collective.certificates.services.base import CertificateService
from typing import Any


class ValidateBlueprintPost(CertificateService):
    """``POST @validate-blueprint`` with ``{"blueprint": {...}}``."""

    def reply(self) -> Any:
        """Validate a blueprint against this template.

        :returns: ``{"valid": bool, "errors": [...]}``.
        """
        body = self.body()
        if "blueprint" not in body:
            return self.bad_request("Missing blueprint")
        issues = self.context.validate_blueprint(body["blueprint"])
        return {"valid": not issues, "errors": self.issues(issues)}
