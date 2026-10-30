"""Public verification of issued certificates."""

from .. import load_json


DATA = load_json("sample/sample-data.json")

#: Folder certificates are created in.
FOLDER = {"type": "Document", "id": "certificates", "title": "Certificates"}
