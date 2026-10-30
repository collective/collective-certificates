"""Create certificates in bulk from a CSV file.

The file has a ``parent_container`` column, the site-relative path of the
folder each certificate goes to, and one column per certificate field,
headed by the field's token. Every row is checked before anything is
created, so a file either creates all its certificates or none::

    from collective.certificates.api.batch import create_certificates

    certificates = create_certificates(template, csv_text)
"""

from AccessControl import Unauthorized
from Acquisition import aq_parent
from collective.certificates import _
from collective.certificates.api import ContainerNotFound
from collective.certificates.api import create_certificate
from collective.certificates.api import resolve_container
from collective.certificates.blueprint.fields import FIELDS
from collective.certificates.blueprint.fields import MissingFields
from collective.certificates.blueprint.fields import sample_data
from collective.certificates.blueprint.template import TemplateRenderError
from collective.certificates.content.certificate import Certificate
from collective.certificates.content.template import CertificateTemplate
from dataclasses import dataclass
from plone import api
from typing import Any
from zope.i18nmessageid import Message

import csv
import io


#: The column naming the folder a row's certificate goes to.
PARENT_COLUMN: str = "parent_container"

#: Columns of a CSV file, in the order of the downloadable template.
COLUMNS: tuple[str, ...] = (
    PARENT_COLUMN,
    *(field.token for field in FIELDS if field.kind != "computed"),
)


@dataclass(frozen=True)
class RowIssue:
    """A problem with one row, or with the whole file."""

    #: Line in the file, the header being line 1; ``0`` for the whole file.
    row: int
    column: str | None
    message: Message | str


class InvalidCsv(ValueError):
    """Raised when a CSV file cannot create its certificates."""

    def __init__(self, issues: list[RowIssue]) -> None:
        self.issues = issues
        super().__init__(f"Invalid CSV: {len(issues)} issue(s)")


def container_path(obj: Any) -> str:
    """Return the site-relative path of an object.

    :param obj: Content in the site, or the site itself.
    :returns: ``/events/2026``, or ``/`` for the site.
    """
    portal_depth = len(api.portal.get().getPhysicalPath())
    return "/" + "/".join(obj.getPhysicalPath()[portal_depth:])


def can_add_certificate(container: Any) -> bool:
    """Tell whether the current user may add a certificate to a container.

    :param container: Any object.
    :returns: ``True`` when the container allows ``Certificate`` items and
        the user has the add permission there.
    """
    allowed = getattr(container, "allowedContentTypes", None)
    return allowed is not None and "Certificate" in {fti.getId() for fti in allowed()}


def csv_template(template: CertificateTemplate) -> str:
    """Return a CSV file to fill in, with one example row.

    :param template: The certificate template.
    :returns: The header and a row with the template's sample data, its
        certificates going to the template's own folder.
    """
    values = {
        **sample_data(),
        **(template.sample_data or {}),
        PARENT_COLUMN: container_path(aq_parent(template)),
    }
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(COLUMNS)
    writer.writerow([values.get(column, "") for column in COLUMNS])
    return out.getvalue()


def read_rows(text: str) -> list[tuple[int, dict[str, str]]]:
    """Parse a CSV file, comma or semicolon separated.

    :param text: File contents; a leading byte order mark is ignored.
    :returns: ``(line, values)`` for each row with a value, values stripped
        and keyed by column name; columns without a name are dropped.
    :raises InvalidCsv: For text damaged by a wrong encoding, a file without
        rows, a file that is not CSV,
        and unknown, duplicated or missing columns.
    """
    text = text.removeprefix("\ufeff")
    if "\ufffd" in text:
        # What a decoder leaves for bytes that are not valid in its encoding,
        # such as a Windows-1252 file read as UTF-8: the values are damaged.
        raise InvalidCsv([
            RowIssue(
                0,
                None,
                _(
                    "error_csv_encoding",
                    default=(
                        "The file has characters that could not be read. "
                        "Save it as CSV in UTF-8 and upload it again."
                    ),
                ),
            )
        ])
    try:
        dialect: Any = csv.Sniffer().sniff(text.split("\n", 1)[0], delimiters=",;")
    except csv.Error:
        dialect = csv.excel
    reader = csv.reader(io.StringIO(text), dialect)
    try:
        header = [name.strip() for name in next(reader, [])]
        raw = [(reader.line_num, row) for row in reader]
    except csv.Error as exc:
        raise InvalidCsv([RowIssue(0, None, str(exc))]) from exc
    issues = [
        RowIssue(
            1,
            name,
            _(
                "error_csv_unknown_column",
                default="Unknown column ${column}.",
                mapping={"column": name},
            ),
        )
        for name in header
        if name and name not in COLUMNS
    ]
    issues += [
        RowIssue(
            1,
            name,
            _(
                "error_csv_duplicate_column",
                default="Column ${column} appears more than once.",
                mapping={"column": name},
            ),
        )
        for name in sorted({name for name in header if name and header.count(name) > 1})
    ]
    if header and PARENT_COLUMN not in header:
        issues.append(
            RowIssue(
                1,
                PARENT_COLUMN,
                _(
                    "error_csv_no_container_column",
                    default="The file has no ${column} column.",
                    mapping={"column": PARENT_COLUMN},
                ),
            )
        )
    rows = [
        (
            line,
            {
                name: value.strip()
                for name, value in zip(header, row, strict=False)
                if name
            },
        )
        for line, row in raw
    ]
    rows = [(line, values) for line, values in rows if any(values.values())]
    if not rows and not issues:
        issues.append(
            RowIssue(0, None, _("error_csv_empty", default="The file has no rows."))
        )
    if issues:
        raise InvalidCsv(issues)
    return rows


def check_row(
    template: CertificateTemplate, line: int, values: dict[str, str]
) -> tuple[Any, dict[str, str], list[RowIssue]]:
    """Check one row without creating anything.

    :param template: The certificate template.
    :param line: The row's line in the file.
    :param values: The row's values by column.
    :returns: The container (``None`` when invalid), the field data and the
        row's issues.
    """
    issues: list[RowIssue] = []
    path = values.get(PARENT_COLUMN, "")
    container = None
    if not path:
        issues.append(
            RowIssue(
                line,
                PARENT_COLUMN,
                _("error_csv_no_container", default="No parent container."),
            )
        )
    else:
        try:
            container = resolve_container(path)
        except Unauthorized:
            issues.append(
                RowIssue(
                    line,
                    PARENT_COLUMN,
                    _(
                        "error_csv_cannot_add",
                        default="You cannot add certificates to ${path}.",
                        mapping={"path": path},
                    ),
                )
            )
        except ContainerNotFound:
            issues.append(
                RowIssue(
                    line,
                    PARENT_COLUMN,
                    _(
                        "error_csv_container_not_found",
                        default="No container at ${path}.",
                        mapping={"path": path},
                    ),
                )
            )
        else:
            if not can_add_certificate(container):
                issues.append(
                    RowIssue(
                        line,
                        PARENT_COLUMN,
                        _(
                            "error_csv_cannot_add",
                            default="You cannot add certificates to ${path}.",
                            mapping={"path": path},
                        ),
                    )
                )
                container = None
    data = {
        name: value for name, value in values.items() if name != PARENT_COLUMN and value
    }
    try:
        template.svg(data, assets={})
    except MissingFields as exc:
        issues += [
            RowIssue(
                line,
                token,
                _(
                    "error_csv_missing_value",
                    default="Missing value for ${field}.",
                    mapping={"field": token},
                ),
            )
            for token in exc.missing
        ]
    except TemplateRenderError as exc:
        issues.append(RowIssue(line, None, str(exc)))
    return container, data, issues


def create_certificates(
    template: CertificateTemplate, text: str, *, format: str = "pdf"
) -> list[Certificate]:
    """Create one certificate per row of a CSV file, or none.

    :param template: The certificate template.
    :param text: The CSV file's contents.
    :param format: ``pdf`` or ``png``.
    :returns: The created certificates, in the order of the rows.
    :raises InvalidCsv: With every issue found; nothing is created then.
    """
    checked = [check_row(template, line, values) for line, values in read_rows(text)]
    issues = [
        issue for _container, _data, row_issues in checked for issue in row_issues
    ]
    if issues:
        raise InvalidCsv(issues)
    return [
        create_certificate(template, data, container, format=format)
        for container, data, _issues in checked
    ]
