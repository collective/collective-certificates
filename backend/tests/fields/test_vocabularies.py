from . import DATE_FORMATS
from . import FIELDS
from . import FONTS
from . import QR_LEVELS
from plone import api
from zope.schema.vocabulary import SimpleTerm
from zope.schema.vocabulary import SimpleVocabulary

import pytest


class TestFieldsVocabulary:
    name: str = "collective.certificates.Fields"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_vocabulary):
        self.vocab = get_vocabulary(self.name, portal)

    def test_vocabulary_type(self):
        assert isinstance(self.vocab, SimpleVocabulary)

    def test_order(self):
        assert [t.token for t in self.vocab] == [token for token, _, _ in FIELDS]

    @pytest.mark.parametrize("token,title,_kind", FIELDS)
    def test_terms(self, token: str, title: str, _kind: str):
        term = self.vocab.getTermByToken(token)
        assert isinstance(term, SimpleTerm)
        assert term.title.default == title
        assert term.value == token


class TestFieldKindsVocabulary:
    name: str = "collective.certificates.FieldKinds"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_vocabulary):
        self.vocab = get_vocabulary(self.name, portal)

    @pytest.mark.parametrize("token,_title,kind", FIELDS)
    def test_terms(self, token: str, _title: str, kind: str):
        term = self.vocab.getTermByToken(token)
        assert term.title == kind

    def test_length(self):
        assert len(self.vocab) == len(FIELDS)


class TestFontsVocabulary:
    name: str = "collective.certificates.Fonts"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_vocabulary):
        self.vocab = get_vocabulary(self.name, portal)

    def test_bundled(self):
        """Without an extra directory, the vocabulary is the bundled fonts."""
        assert [(t.token, t.title) for t in self.vocab] == list(FONTS)


class TestDateFormatsVocabulary:
    name: str = "collective.certificates.DateFormats"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_vocabulary):
        self.portal = portal
        self.get_vocabulary = get_vocabulary

    def test_terms(self):
        """Each title is an example date written in the format."""
        vocab = self.get_vocabulary(self.name, self.portal)
        assert [(t.token, t.title) for t in vocab] == list(DATE_FORMATS)
        assert [t.value for t in vocab] == [token for token, _ in DATE_FORMATS]

    def test_site_language(self):
        """Month names follow the site's default language."""
        api.portal.set_registry_record("plone.default_language", "pt-br")
        vocab = self.get_vocabulary(self.name, self.portal)
        assert vocab.getTermByToken("long-day-first").title == "31 dezembro 2026"


class TestQrVocabulary:
    name: str = "collective.certificates.QrErrorCorrection"

    @pytest.fixture(autouse=True)
    def _setup(self, portal, get_vocabulary):
        self.vocab = get_vocabulary(self.name, portal)

    @pytest.mark.parametrize("token,title", QR_LEVELS)
    def test_terms(self, token: str, title: str):
        term = self.vocab.getTermByToken(token)
        assert term.title.default == title

    def test_order(self):
        assert [t.token for t in self.vocab] == [token for token, _ in QR_LEVELS]
