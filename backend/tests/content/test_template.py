from .. import load_blueprint
from .. import PAGE
from . import BEHAVIORS
from . import FIELDS
from collective.certificates.blueprint.fields import sample_data
from collective.certificates.blueprint.model import empty_blueprint
from collective.certificates.content.template import CertificateTemplate
from collective.certificates.content.template import contained_images
from collective.certificates.content.template import ICertificateTemplate
from collective.certificates.content.template import image_size
from plone import api
from plone.dexterity.fti import DexterityFTI
from plone.restapi.interfaces import IDeserializeFromJson
from zExceptions import BadRequest
from zope.annotation.interfaces import IAnnotations
from zope.component import getMultiAdapter
from zope.interface import Invalid
from zope.schema import getFieldsInOrder

import pytest


class TestFTI:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_fti):
        self.fti: DexterityFTI = get_fti("CertificateTemplate")

    @pytest.mark.parametrize(
        "attr,expected",
        [
            ("title", "Certificate Template"),
            ("klass", "collective.certificates.content.template.CertificateTemplate"),
            ("schema", "collective.certificates.content.template.ICertificateTemplate"),
            ("global_allow", True),
            ("filter_content_types", True),
            ("allowed_content_types", ("Image",)),
            ("add_permission", "collective.certificates.AddCertificateTemplate"),
        ],
    )
    def test_fti(self, attr: str, expected):
        assert isinstance(self.fti, DexterityFTI)
        assert getattr(self.fti, attr) == expected

    @pytest.mark.parametrize("idx,behavior", list(enumerate(BEHAVIORS)))
    def test_behaviors(self, idx: int, behavior: str):
        assert self.fti.behaviors[idx] == behavior

    def test_behaviors_count(self):
        assert len(self.fti.behaviors) == len(BEHAVIORS)


class TestSchema:
    def test_fields(self):
        assert [name for name, _ in getFieldsInOrder(ICertificateTemplate)] == list(
            FIELDS
        )

    @pytest.mark.parametrize(
        "name,required",
        [
            ("background", True),
            ("blueprint", True),
            ("sample_data", False),
            ("date_format", True),
        ],
    )
    def test_required(self, name: str, required: bool):
        assert ICertificateTemplate[name].required is required

    @pytest.mark.parametrize(
        "name,widget",
        [
            ("blueprint", "certificate_blueprint"),
            ("sample_data", "certificate_sample_data"),
        ],
    )
    def test_widgets(self, name: str, widget: str):
        assert ICertificateTemplate[name].widget == widget

    def test_defaults(self):
        assert ICertificateTemplate["blueprint"].default == empty_blueprint()
        assert ICertificateTemplate["sample_data"].default == sample_data()
        assert ICertificateTemplate["date_format"].default == "day-month-year"

    def test_blueprint_field_rejects_invalid(self):
        """The JSONField validates against schema.json."""
        from zope.schema.interfaces import ValidationError

        field = ICertificateTemplate["blueprint"]
        with pytest.raises(ValidationError):
            field.validate({
                "version": 2,
                "page": {"width": 1, "height": 1},
                "elements": [],
            })

    def test_sample_data_field_rejects_non_strings(self):
        from zope.schema.interfaces import ValidationError

        with pytest.raises(ValidationError):
            ICertificateTemplate["sample_data"].validate({"full_name": 1})


class TestDateFormat:
    @pytest.fixture(autouse=True)
    def _setup(self, portal):
        """The vocabulary is a named utility, so binding needs a site."""
        self.field = ICertificateTemplate["date_format"].bind(portal)

    def test_vocabulary(self):
        assert self.field.vocabularyName == "collective.certificates.DateFormats"

    @pytest.mark.parametrize(
        "token", ["day-month-year", "month-day-year", "iso", "long", "long-day-first"]
    )
    def test_valid(self, token: str):
        self.field.validate(token)

    @pytest.mark.parametrize("value", ["%d/%m/%Y", "%-d de %B de %Y", "short"])
    def test_invalid(self, value: str):
        """A pattern is not a format: only the vocabulary's tokens are."""
        from zope.schema.interfaces import ValidationError

        with pytest.raises(ValidationError):
            self.field.validate(value)


class FakeData:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)


class TestInvariant:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, create_template):
        """Fonts come from the registry, so the checks need a site."""
        self.portal = portal
        self.template = create_template(portal)

    def run(self, **kwargs):
        ICertificateTemplate.validateInvariants(FakeData(**kwargs))

    def test_valid(self):
        """When editing, the template's Image items count as assets."""
        self.run(
            blueprint=load_blueprint("sample"),
            background=True,
            __context__=self.template,
        )

    def test_without_background(self):
        """An image element on the background needs the background."""
        bp = load_blueprint("minimal")
        bp["elements"].append({
            "id": "bg",
            "type": "image",
            "x": 0,
            "y": 0,
            "width": 10,
            "height": 10,
            "asset": "background",
        })
        with pytest.raises(Invalid):
            self.run(blueprint=bp, background=None)

    def test_no_blueprint(self):
        """Nothing to check when the blueprint is absent or not an object."""
        self.run(blueprint=None, background=True)

    def test_unknown_font(self):
        bp = load_blueprint("minimal")
        bp["elements"][0]["font"] = "comic-sans"
        with pytest.raises(Invalid):
            self.run(blueprint=bp, background=True)

    def test_image_items_not_checked(self):
        """A template being added or imported has no Image items yet."""
        self.run(blueprint=load_blueprint("sample"), background=True)

    @pytest.mark.parametrize(
        "elements",
        [
            {"not": "a list"},
            ["not an element"],
            [{"id": "a", "type": "image", "asset": ["not", "a", "string"]}],
        ],
    )
    def test_schema_invalid_elements(self, elements):
        """A malformed blueprint is reported by the schema check."""
        bp = load_blueprint("minimal")
        bp["elements"] = elements
        with pytest.raises(Invalid):
            self.run(blueprint=bp, background=True)

    def test_create_through_rest_api(self, http_request, sample_image):
        """plone.restapi validates a new template before its images exist."""
        with api.env.adopt_roles(["Manager"]):
            new = api.content.create(
                container=self.portal,
                type="CertificateTemplate",
                id="new",
                background=sample_image("background"),
            )
            deserializer = getMultiAdapter((new, http_request), IDeserializeFromJson)
            deserializer(
                data={"blueprint": load_blueprint("sample")},
                create=True,
                validate_all=False,
            )
        assert new.blueprint == load_blueprint("sample")

    def test_layout_not_checked(self):
        """Page size and bounds are not an invariant: the page follows the background."""
        bp = load_blueprint("minimal")
        bp["page"] = {"width": 10, "height": 10}
        self.run(blueprint=bp, background=True)


class TestImageSize:
    def test_none(self):
        assert image_size(None) is None

    def test_sample(self, sample_image):
        assert image_size(sample_image("background")) == PAGE

    def test_unknown_size(self):
        class Unknown:
            def getImageSize(self):
                return (-1, -1)

        assert image_size(Unknown()) is None


class TestContent:
    @pytest.fixture(autouse=True)
    def _setup(self, portal, create_template):
        self.portal = portal
        self.template = create_template(portal)

    def test_class(self):
        assert isinstance(self.template, CertificateTemplate)
        assert ICertificateTemplate.providedBy(self.template)

    def test_defaults_on_create(self, create_template):
        other = create_template(self.portal, id="other")
        assert other.sample_data == sample_data()
        assert other.date_format == "day-month-year"

    def test_assets(self):
        assert self.template.assets() == {"background", "signature"}

    def test_assets_without_signature(self, create_template):
        other = create_template(self.portal, id="other", signature=None)
        assert other.assets() == {"background"}

    def test_asset_images(self):
        images = self.template.asset_images()
        assert images["background"] is self.template.background
        assert images["signature"] is self.template["signature"].image

    def test_background_is_not_an_item_id(self, sample_image):
        """Plone reserves the field's name, so no item can shadow it."""
        with api.env.adopt_roles(["Manager"]), pytest.raises(BadRequest):
            api.content.create(
                container=self.template,
                type="Image",
                id="background",
                image=sample_image("signature"),
            )

    def test_assets_without_background(self):
        self.template.background = None
        assert self.template.assets() == {"signature"}

    def test_image_without_file(self):
        """An Image item with no image is not an asset."""
        with api.env.adopt_roles(["Manager"]):
            api.content.create(container=self.template, type="Image", id="empty")
        assert self.template.assets() == {"background", "signature"}

    def test_annotations_per_instance(self, create_template):
        """Each template keeps its own annotations, such as image scales."""
        other = create_template(self.portal, id="other", signature=None)
        IAnnotations(self.template)["probe"] = 1
        assert "probe" not in IAnnotations(other)

    @pytest.mark.parametrize("container", [None, object()])
    def test_contained_images_elsewhere(self, container):
        assert contained_images(container) == {}

    def test_page_size(self):
        assert self.template.page_size() == PAGE

    def test_required_fields(self):
        assert self.template.required_fields() == {
            "full_name",
            "event_name",
            "event_start_date",
            "event_end_date",
            "total_hours",
            "responsible_person",
            "verification_url",
        }

    def test_computed_values(self):
        """The verification URL is the site's verification page."""
        assert self.template.computed_values("abc") == {
            "certificate_uid": "abc",
            "verification_url": f"{self.portal.absolute_url()}/verify/abc",
        }

    def test_validate_stored(self):
        assert self.template.validate_blueprint() == []

    def test_validate_other(self):
        bp = load_blueprint("minimal")
        bp["page"] = {"width": 100, "height": 100}
        issues = self.template.validate_blueprint(bp)
        assert [i["path"] for i in issues] == ["/page", "/elements/0"]
