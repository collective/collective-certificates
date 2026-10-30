from . import load_blueprint
from . import RESOURCES
from collections.abc import Callable
from collective.certificates.testing import ACCEPTANCE_TESTING
from collective.certificates.testing import FUNCTIONAL_TESTING
from collective.certificates.testing import INTEGRATION_TESTING
from plone import api
from plone.namedfile.file import NamedBlobImage
from pytest_plone import fixtures_factory
from typing import Any

import os
import pytest


# Compile .po files when the layers register translations, so tests see the
# catalogs as edited rather than a stale .mo.
os.environ.setdefault("zope_i18n_compile_mo_files", "true")

pytest_plugins = ["pytest_plone"]


globals().update(
    fixtures_factory((
        (ACCEPTANCE_TESTING, "acceptance"),
        (FUNCTIONAL_TESTING, "functional"),
        (INTEGRATION_TESTING, "integration"),
    ))
)


@pytest.fixture(scope="session")
def sample_image() -> Callable[[str], NamedBlobImage]:
    """Return a factory of NamedBlobImage values from the sample images.

    :returns: Callable taking ``"background"`` or ``"signature"``.
    """

    def func(name: str) -> NamedBlobImage:
        data = (RESOURCES / "sample" / f"{name}.png").read_bytes()
        return NamedBlobImage(data=data, filename=f"{name}.png")

    return func


@pytest.fixture(scope="session")
def create_template(sample_image) -> Callable[..., Any]:
    """Return a factory creating a CertificateTemplate.

    Keyword arguments override the defaults: the ``sample`` blueprint and
    the sample background. The sample signature is added as an Image item
    with the id ``signature``; pass ``signature=None`` for a template
    without one.

    :returns: Callable taking a container and keyword overrides.
    """

    def func(container: Any, signature: Any = True, **kwargs: Any) -> Any:
        values: dict[str, Any] = {
            "type": "CertificateTemplate",
            "id": "template",
            "title": "Sample template",
            "background": sample_image("background"),
            "blueprint": load_blueprint("sample"),
        }
        values.update(kwargs)
        with api.env.adopt_roles(["Manager"]):
            template = api.content.create(container=container, **values)
            if signature:
                api.content.create(
                    container=template,
                    type="Image",
                    id="signature",
                    title="Signature",
                    image=sample_image("signature"),
                )
        return template

    return func
