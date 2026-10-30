from .. import load_json
from . import FIELDS
from collective.certificates.blueprint import fields

import pytest


class TestFields:
    def test_order(self):
        """FIELDS keeps the documented order."""
        assert [f.token for f in fields.FIELDS] == [token for token, _, _ in FIELDS]

    @pytest.mark.parametrize("token,title,kind", FIELDS)
    def test_spec(self, token: str, title: str, kind: str):
        spec = fields.FIELDS_BY_TOKEN[token]
        assert spec.title.default == title
        assert spec.title.domain == "collective.certificates"
        assert spec.kind == kind

    @pytest.mark.parametrize("token,_title,kind", FIELDS)
    def test_field_kind(self, token: str, _title: str, kind: str):
        assert fields.field_kind(token) == kind

    def test_field_kind_unknown(self):
        assert fields.field_kind("email") is None

    def test_sample_data_matches_fixture(self):
        """The shared sample-data fixture is the constant's samples."""
        assert fields.sample_data() == load_json("sample/sample-data.json")

    def test_sample_data_is_fresh(self):
        """Each call returns a new dictionary."""
        first = fields.sample_data()
        first["full_name"] = "Changed"
        assert fields.sample_data()["full_name"] == "Patrick Stewart"


class TestMissingFields:
    def test_sorted(self):
        error = fields.MissingFields({"total_hours", "full_name"})
        assert error.missing == ["full_name", "total_hours"]
        assert str(error) == "Missing certificate fields: full_name, total_hours"

    def test_is_value_error(self):
        assert issubclass(fields.MissingFields, ValueError)
