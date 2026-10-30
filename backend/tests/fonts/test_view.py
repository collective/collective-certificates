from . import INTER
from collective.certificates.fonts.view import FontView
from collective.certificates.fonts.view import is_inside
from zExceptions import NotFound

import pytest


@pytest.fixture
def font_view(portal, http_request):
    def func(*segments: str) -> FontView:
        view = FontView(portal, http_request)
        for segment in segments:
            view = view.publishTraverse(http_request, segment)
        return view

    return func


class TestFontView:
    def test_bundled(self, font_view, http_request):
        body = font_view("inter")()
        assert body == INTER.read_bytes()
        response = http_request.response
        assert response.getHeader("Content-Type") == "font/ttf"
        assert response.getHeader("Cache-Control") == "public, max-age=31536000"
        assert response.getHeader("Access-Control-Allow-Origin") == "*"

    def test_extra_otf(self, font_view, http_request, set_extra_dir, tmp_path):
        directory = tmp_path / "extra"
        directory.mkdir()
        (directory / "Display.otf").write_bytes(INTER.read_bytes())
        set_extra_dir(str(directory))
        assert font_view("display")() == INTER.read_bytes()
        assert http_request.response.getHeader("Content-Type") == "font/otf"

    def test_unknown(self, font_view):
        with pytest.raises(NotFound):
            font_view("comic-sans")()

    def test_no_token(self, font_view):
        with pytest.raises(NotFound):
            font_view()()

    def test_two_segments(self, font_view):
        with pytest.raises(NotFound):
            font_view("inter", "extra")

    def test_symlink_outside(self, font_view, set_extra_dir, tmp_path):
        """A link in the extra directory pointing elsewhere is refused."""
        outside = tmp_path / "outside"
        outside.mkdir()
        target = outside / "secret.ttf"
        target.write_bytes(INTER.read_bytes())
        directory = tmp_path / "extra"
        directory.mkdir()
        (directory / "linked.ttf").symlink_to(target)
        set_extra_dir(str(directory))
        with pytest.raises(NotFound):
            font_view("linked")()


class TestIsInside:
    def test_none(self, tmp_path):
        assert is_inside(tmp_path / "x", None) is False

    def test_inside(self, tmp_path):
        assert is_inside(tmp_path / "a" / "b", tmp_path) is True

    def test_outside(self, tmp_path):
        assert is_inside(tmp_path.parent, tmp_path) is False


class TestFontViewHTTP:
    def test_through_api(self, request_factory):
        """The view is reachable below ++api++, anonymously."""
        session = request_factory(role="Anonymous")
        response = session.get("@@certificate-font/caveat")
        assert response.status_code == 200
        assert response.headers["Content-Type"] == "font/ttf"
        assert response.content[:4] == b"\x00\x01\x00\x00"

    def test_not_found(self, request_factory):
        session = request_factory(role="Anonymous")
        assert session.get("@@certificate-font/nope").status_code == 404
