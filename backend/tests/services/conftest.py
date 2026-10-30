from . import TEMPLATES
from plone import api
from plone.app.testing import SITE_OWNER_NAME
from Products.CMFPlone.Portal import PloneSite

import pytest
import transaction


EDITOR = ("editor", "secret-editor-password")


@pytest.fixture
def portal(functional_portal, create_template) -> PloneSite:
    """The functional portal with a folder and the templates committed.

    Not the ``portal`` marker: the templates hold NamedBlobImage values,
    which need plone.namedfile's adapters and so cannot be built at import
    time, when marker arguments are evaluated.
    """
    with api.env.adopt_roles(["Manager"]):
        api.content.create(
            container=functional_portal,
            type="Document",
            id="certificates",
            title="Certificates",
        )
    for template_id, overrides in TEMPLATES.items():
        create_template(functional_portal, id=template_id, **overrides)
    transaction.commit()
    return functional_portal


@pytest.fixture
def editor(portal) -> tuple[str, str]:
    """A user who may edit the templates but not add to the folder.

    :returns: Basic-auth credentials.
    """
    with api.env.adopt_user(username=SITE_OWNER_NAME):
        api.user.create(
            email="editor@example.org", username=EDITOR[0], password=EDITOR[1]
        )
        for template_id in TEMPLATES:
            api.user.grant_roles(
                username=EDITOR[0], obj=portal[template_id], roles=["Editor"]
            )
    transaction.commit()
    return EDITOR
