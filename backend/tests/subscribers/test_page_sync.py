from .. import load_blueprint
from .. import PAGE
from collective.certificates.subscribers.page_sync import sync_page
from PIL import Image
from plone.namedfile.file import NamedBlobImage
from zope.event import notify
from zope.lifecycleevent import ObjectModifiedEvent

import io
import pytest


def png(width: int, height: int) -> NamedBlobImage:
    buffer = io.BytesIO()
    Image.new("RGB", (width, height), (255, 255, 255)).save(buffer, format="PNG")
    return NamedBlobImage(data=buffer.getvalue(), filename="bg.png")


class TestPageSync:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, create_template):
        self.portal = portal
        self.create = create_template

    def test_added_syncs(self):
        """A template created with a mismatched page gets the background's size."""
        bp = load_blueprint("minimal")
        bp["page"] = {"width": 10, "height": 10}
        template = self.create(self.portal, blueprint=bp)
        assert template.blueprint["page"] == {"width": PAGE[0], "height": PAGE[1]}

    def test_modified_syncs_page_only(self):
        template = self.create(self.portal)
        elements = template.blueprint["elements"]
        template.background = png(800, 600)
        notify(ObjectModifiedEvent(template))
        assert template.blueprint["page"] == {"width": 800, "height": 600}
        assert template.blueprint["elements"] == elements

    def test_matching_is_noop(self):
        template = self.create(self.portal)
        before = template.blueprint
        notify(ObjectModifiedEvent(template))
        assert template.blueprint is before

    def test_no_background(self):
        template = self.create(self.portal)
        template.background = None
        before = template.blueprint
        sync_page(template, None)
        assert template.blueprint is before

    def test_no_blueprint(self):
        template = self.create(self.portal)
        template.blueprint = None
        sync_page(template, None)
        assert template.blueprint is None
