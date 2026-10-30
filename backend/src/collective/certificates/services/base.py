"""Shared behaviour of the certificate services."""

from collective.certificates.blueprint.model import ValidationIssue
from plone.restapi.deserializer import json_body
from plone.restapi.services import Service
from typing import Any
from zope.i18n import translate

import json


class CertificateService(Service):
    """A service that may answer with a file instead of JSON.

    ``reply`` returns ``bytes`` (after setting its own headers) or a JSON
    serializable value.
    """

    def render(self) -> Any:
        """Render the reply.

        :returns: Bytes as they are, anything else as JSON.
        """
        self.check_permission()
        content = self.reply()
        if isinstance(content, bytes):
            return content
        self.request.response.setHeader("Content-Type", "application/json")
        return json.dumps(content, indent=2, sort_keys=True, separators=(", ", ": "))

    def body(self) -> dict[str, Any]:
        """Return the JSON request body.

        plone.restapi's ``json_body`` already rejects bodies that are not
        JSON objects.

        :returns: The decoded object; empty for an empty body.
        """
        return json_body(self.request)

    def issues(self, issues: list[ValidationIssue]) -> list[dict[str, Any]]:
        """Translate validation issues for the response.

        :param issues: Issues from the validator.
        :returns: Issues with translated messages.
        """
        return [
            {
                "element": issue["element"],
                "path": issue["path"],
                "message": translate(issue["message"], context=self.request),
            }
            for issue in issues
        ]

    def bad_request(self, message: str, **extra: Any) -> dict[str, Any]:
        """Answer 400 in plone.restapi's error format.

        :param message: Human readable message.
        :param extra: Additional keys of the ``error`` object.
        :returns: The response body.
        """
        self.request.response.setStatus(400)
        return {"error": {"type": "BadRequest", "message": message, **extra}}

    def file(
        self, body: bytes, content_type: str, filename: str, inline: bool
    ) -> bytes:
        """Answer with a file.

        :param body: File contents.
        :param content_type: MIME type.
        :param filename: Suggested file name.
        :param inline: Display inline rather than download.
        :returns: ``body``.
        """
        response = self.request.response
        response.setHeader("Content-Type", content_type)
        disposition = "inline" if inline else "attachment"
        response.setHeader(
            "Content-Disposition", f'{disposition}; filename="{filename}"'
        )
        return body
