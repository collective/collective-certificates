"""``GET @certificates-csv``: a CSV file to fill in and upload."""

from collective.certificates.api.batch import csv_template
from collective.certificates.services.base import CertificateService
from typing import Any


class CertificatesCsvGet(CertificateService):
    """``GET @certificates-csv``: the columns and one example row."""

    def reply(self) -> Any:
        """Build the file.

        :returns: ``{"filename": "<template id>.csv", "csv": "<text>"}``.
        """
        return {
            "filename": f"{self.context.getId()}.csv",
            "csv": csv_template(self.context),
        }
