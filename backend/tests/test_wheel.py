"""The wheel carries the data files the add-on needs at runtime."""

from pathlib import Path

import pytest
import shutil
import subprocess
import zipfile


BACKEND = Path(__file__).parent.parent

REQUIRED: tuple[str, ...] = (
    "collective/certificates/py.typed",
    "collective/certificates/blueprint/schema.json",
    "collective/certificates/fonts/files/inter/inter.ttf",
    "collective/certificates/fonts/files/inter/inter-bold.ttf",
    "collective/certificates/fonts/files/inter/OFL.txt",
    "collective/certificates/fonts/files/ebgaramond/eb-garamond.ttf",
    "collective/certificates/fonts/files/ebgaramond/eb-garamond-bold.ttf",
    "collective/certificates/fonts/files/ebgaramond/OFL.txt",
    "collective/certificates/fonts/files/caveat/caveat.ttf",
    "collective/certificates/fonts/files/caveat/OFL.txt",
    "collective/certificates/profiles/default/types/CertificateTemplate.xml",
    "collective/certificates/profiles/default/types/Certificate.xml",
)


@pytest.fixture(scope="module")
def wheel_names(tmp_path_factory) -> set[str]:
    """Build the wheel once and return its member names."""
    uv = shutil.which("uv")
    assert uv is not None, "uv is needed to build the wheel"
    out = tmp_path_factory.mktemp("dist")
    subprocess.run(  # noqa: S603 - fixed command, no user input
        [uv, "build", "--wheel", "--out-dir", str(out), str(BACKEND)],
        check=True,
        capture_output=True,
    )
    (wheel,) = out.glob("*.whl")
    with zipfile.ZipFile(wheel) as archive:
        return set(archive.namelist())


@pytest.mark.parametrize("member", REQUIRED)
def test_member(wheel_names: set[str], member: str):
    assert member in wheel_names
