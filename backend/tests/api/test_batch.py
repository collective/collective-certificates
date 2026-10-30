from .. import load_json
from . import FOLDER
from collective.certificates.api import batch
from collective.certificates.content.certificate import Certificate
from plone import api

import pytest


DATA = load_json("sample/sample-data.json")
HEADER = ",".join(batch.COLUMNS)


def row(container: str = "/certificates", sep: str = ",", **overrides: str) -> str:
    """Return one CSV line with the sample data."""
    values = {**DATA, batch.PARENT_COLUMN: container, **overrides}
    return sep.join(values.get(column, "") for column in batch.COLUMNS)


def messages(exc: pytest.ExceptionInfo) -> list[tuple[int, str | None, str]]:
    """Return ``(row, column, default message)`` of each issue."""
    return [
        (issue.row, issue.column, getattr(issue.message, "default", issue.message))
        for issue in exc.value.issues
    ]


class TestColumns:
    def test_order(self):
        assert batch.COLUMNS == (
            "parent_container",
            "full_name",
            "event_name",
            "event_start_date",
            "event_end_date",
            "responsible_person",
            "total_hours",
        )


@pytest.mark.portal(content=[FOLDER], roles=["Manager"])
class TestTemplate:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, create_template):
        self.portal = portal
        self.template = create_template(portal)

    def test_container_path(self):
        assert batch.container_path(self.portal) == "/"
        assert batch.container_path(self.portal["certificates"]) == "/certificates"

    def test_csv_template(self):
        """The header and one row: the sample data, the template's folder."""
        lines = batch.csv_template(self.template).splitlines()
        assert lines == [HEADER, row("/")]

    def test_csv_template_sample_data(self, create_template):
        """The template's own sample data wins over the defaults."""
        other = create_template(
            self.portal["certificates"], id="other", sample_data={"full_name": "Q"}
        )
        lines = batch.csv_template(other).splitlines()
        assert lines[1] == row("/certificates", full_name="Q")


class TestReadRows:
    @pytest.mark.parametrize("sep", [",", ";"])
    def test_separators(self, sep: str):
        text = f"{sep.join(batch.COLUMNS)}\n{row(sep=sep)}\n"
        assert batch.read_rows(text) == [
            (2, {"parent_container": "/certificates", **DATA})
        ]

    def test_bom_spaces_and_blank_rows(self):
        text = f"\ufeff{HEADER}\n,,,,,,\n\n {row()} \n"
        rows = batch.read_rows(text)
        assert [line for line, _values in rows] == [4]
        assert rows[0][1]["parent_container"] == "/certificates"

    def test_nameless_columns_dropped(self):
        """Spreadsheets often add an empty trailing column."""
        text = f"{HEADER},\n{row()},\n"
        assert "" not in batch.read_rows(text)[0][1]

    def test_unknown_and_duplicate_columns(self):
        text = f"{HEADER},email,full_name,certificate_uid\n{row()},a,b,c\n"
        with pytest.raises(batch.InvalidCsv) as exc:
            batch.read_rows(text)
        assert messages(exc) == [
            (1, "email", "Unknown column ${column}."),
            (1, "certificate_uid", "Unknown column ${column}."),
            (1, "full_name", "Column ${column} appears more than once."),
        ]

    def test_no_container_column(self):
        text = "full_name,event_name\nA,B\n"
        with pytest.raises(batch.InvalidCsv) as exc:
            batch.read_rows(text)
        assert messages(exc) == [
            (1, "parent_container", "The file has no ${column} column.")
        ]

    @pytest.mark.parametrize("text", ["", f"{HEADER}\n", f"{HEADER}\n,,,,,,\n"])
    def test_no_rows(self, text: str):
        with pytest.raises(batch.InvalidCsv) as exc:
            batch.read_rows(text)
        assert messages(exc) == [(0, None, "The file has no rows.")]

    def test_one_column(self):
        """A header the sniffer cannot split is read as comma separated."""
        assert batch.read_rows("parent_container\n/certificates\n") == [
            (2, {"parent_container": "/certificates"})
        ]

    def test_replacement_character(self):
        """Text decoded with the wrong encoding is refused, not stored."""
        damaged = "\ufffdrico Andrei"
        text = f"{HEADER}\n{row(full_name=damaged)}\n"
        with pytest.raises(batch.InvalidCsv) as exc:
            batch.read_rows(text)
        assert [(issue.row, issue.column) for issue in exc.value.issues] == [(0, None)]
        assert exc.value.issues[0].message.default.startswith(
            "The file has characters that could not be read."
        )

    def test_not_csv(self):
        """A field over the csv module's size limit is not a CSV file."""
        with pytest.raises(batch.InvalidCsv) as exc:
            batch.read_rows(f"{HEADER}\n{'x' * 200_000}\n")
        assert exc.value.issues[0].row == 0


@pytest.mark.portal(content=[FOLDER], roles=["Manager"])
class TestCreateCertificates:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, create_template):
        self.portal = portal
        self.template = create_template(portal)
        self.folder = portal["certificates"]

    def test_created(self):
        text = f"{HEADER}\n{row()}\n{row('/', full_name='William Riker')}\n"
        items = batch.create_certificates(self.template, text)
        assert len(items) == 2
        assert all(isinstance(item, Certificate) for item in items)
        assert items[0].aq_parent == self.folder
        assert items[1].aq_parent == self.portal
        assert items[1].data["full_name"] == "William Riker"
        assert items[0].file.contentType == "application/pdf"

    def test_png(self):
        items = batch.create_certificates(
            self.template, f"{HEADER}\n{row()}\n", format="png"
        )
        assert items[0].file.contentType == "image/png"

    def test_all_or_nothing(self):
        """One bad row: nothing is created, and every issue is listed."""
        text = "\n".join([
            HEADER,
            row(),
            row(""),
            row("/nowhere"),
            row("/template"),
            row(full_name=""),
            row(event_start_date="2026-02-30"),
        ])
        with pytest.raises(batch.InvalidCsv) as exc:
            batch.create_certificates(self.template, text)
        assert messages(exc) == [
            (3, "parent_container", "No parent container."),
            (4, "parent_container", "No container at ${path}."),
            (5, "parent_container", "You cannot add certificates to ${path}."),
            (6, "full_name", "Missing value for ${field}."),
            (7, None, "Not a valid date: '2026-02-30'"),
        ]
        assert self.folder.objectIds() == []

    @pytest.mark.parametrize("container", [None, object()])
    def test_can_add_elsewhere(self, container):
        """Something that is not a container never takes a certificate."""
        assert batch.can_add_certificate(container) is False

    def test_cannot_add(self):
        """Without the add permission in the container, the row is refused."""
        self.folder.manage_permission(
            "collective.certificates: Add Certificate", [], acquire=False
        )
        with pytest.raises(batch.InvalidCsv) as exc:
            batch.create_certificates(self.template, f"{HEADER}\n{row()}\n")
        assert messages(exc) == [
            (2, "parent_container", "You cannot add certificates to ${path}.")
        ]

    def test_header_issues_first(self):
        """Column problems stop the file before any row is checked."""
        with pytest.raises(batch.InvalidCsv) as exc:
            batch.create_certificates(self.template, "full_name\nA\n")
        assert messages(exc)[0][0] == 1
        assert len(api.content.find(portal_type="Certificate")) == 0
