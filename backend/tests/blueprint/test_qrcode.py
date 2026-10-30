from .. import load_json
from collective.certificates.blueprint import qrcode

import pytest


VECTORS = load_json("qr-vectors.json")["cases"]


class TestMatrix:
    @pytest.mark.parametrize(
        "case", VECTORS, ids=[f"{c['ec']}:{c['content']}" for c in VECTORS]
    )
    def test_vector(self, case: dict):
        matrix = qrcode.qr_matrix(case["content"], case["ec"])
        assert len(matrix) == case["modules"]
        assert ["".join("1" if m else "0" for m in row) for row in matrix] == case[
            "matrix"
        ]

    def test_no_boost(self):
        """The requested level is kept even when a higher one would fit."""
        low = qrcode.qr_matrix("HELLO", "L")
        high = qrcode.qr_matrix("HELLO", "H")
        assert low != high


class TestPath:
    def test_runs(self):
        matrix = [
            [True, True, False, True],
            [False, False, False, False],
            [False, True, True, True],
        ]
        assert qrcode.qr_path(matrix, 0) == "M0 0h2v1h-2zM3 0h1v1h-1zM1 2h3v1h-3z"

    def test_offset(self):
        assert qrcode.qr_path([[True]]) == "M4 4h1v1h-1z"

    def test_empty(self):
        assert qrcode.qr_path([[False, False]]) == ""
