from . import INTER
from collective.certificates.fonts import registry
from fontTools.ttLib import TTFont

import pytest


class TestSlugify:
    @pytest.mark.parametrize(
        "name,expected",
        [
            ("Inter", "inter"),
            ("My Font Bold", "my-font-bold"),
            ("  Weird__Name!! ", "weird-name"),
            ("___", ""),
            ("a" * 80, "a" * 64),
        ],
    )
    def test_slugify(self, name: str, expected: str):
        assert registry.slugify(name) == expected


class TestBundled:
    def test_tokens(self):
        assert list(registry.BUNDLED) == [
            "inter",
            "inter-bold",
            "eb-garamond",
            "eb-garamond-bold",
            "caveat",
        ]

    @pytest.mark.parametrize("token", list(registry.BUNDLED))
    def test_file_exists(self, token: str):
        assert registry.BUNDLED[token].path.is_file()

    @pytest.mark.parametrize("token", list(registry.BUNDLED))
    def test_license_beside(self, token: str):
        """Every bundled font has its OFL next to it."""
        license_file = registry.BUNDLED[token].path.parent / "OFL.txt"
        assert "SIL OPEN FONT LICENSE Version 1.1" in license_file.read_text()

    @pytest.mark.parametrize("token", list(registry.BUNDLED))
    def test_static(self, token: str):
        """Bundled fonts are static instances, not variable fonts."""
        assert "fvar" not in TTFont(registry.BUNDLED[token].path)


class TestExtraFonts:
    def test_unset(self, portal):
        assert registry.extra_dir() is None
        assert registry.extra_fonts() == {}

    def test_not_a_directory(self, portal, set_extra_dir, tmp_path):
        set_extra_dir(str(tmp_path / "missing"))
        assert registry.extra_dir() is None

    def test_blank(self, portal, set_extra_dir):
        set_extra_dir("   ")
        assert registry.extra_dir() is None

    def test_found(self, portal, set_extra_dir, extra_font_dir):
        set_extra_dir(str(extra_font_dir))
        assert registry.extra_dir() == extra_font_dir
        found = registry.extra_fonts()
        assert list(found) == ["broken", "my-font"]
        assert found["my-font"].title == "Inter Regular"
        assert found["broken"].title == "broken"

    def test_explicit_directory(self, extra_font_dir):
        assert list(registry.extra_fonts(extra_font_dir)) == ["broken", "my-font"]

    def test_duplicate_token(self, extra_font_dir):
        """Two files slugifying to the same token: the first one wins."""
        (extra_font_dir / "my_font.ttf").write_bytes(INTER.read_bytes())
        found = registry.extra_fonts(extra_font_dir)
        assert found["my-font"].path.name == "My Font.ttf"

    def test_all_fonts(self, portal, set_extra_dir, extra_font_dir):
        set_extra_dir(str(extra_font_dir))
        assert list(registry.all_fonts()) == [*registry.BUNDLED, "broken", "my-font"]

    def test_get_font(self, portal):
        assert registry.get_font("caveat") == registry.BUNDLED["caveat"]
        assert registry.get_font("nope") is None

    def test_vocabulary_includes_extra(
        self, portal, set_extra_dir, extra_font_dir, get_vocabulary
    ):
        set_extra_dir(str(extra_font_dir))
        vocab = get_vocabulary("collective.certificates.Fonts", portal)
        assert vocab.getTermByToken("my-font").title == "Inter Regular"


class TestRenderCopy:
    def test_renamed(self, tmp_path):
        path = registry.render_copy(registry.BUNDLED["inter-bold"], tmp_path)
        font = TTFont(path)
        name = font["name"]
        assert name.getDebugName(1) == "inter-bold"
        assert name.getDebugName(2) == "Regular"
        assert name.getDebugName(4) == "inter-bold"
        assert name.getDebugName(16) is None
        assert font["OS/2"].usWeightClass == 400
        assert font["OS/2"].fsSelection & 0b1100001 == 0b1000000
        assert font["head"].macStyle == 0

    def test_cached(self, tmp_path):
        first = registry.render_copy(registry.BUNDLED["inter"], tmp_path)
        mtime = first.stat().st_mtime_ns
        second = registry.render_copy(registry.BUNDLED["inter"], tmp_path)
        assert first == second
        assert second.stat().st_mtime_ns == mtime

    def test_default_cache(self):
        path = registry.render_copy(registry.BUNDLED["caveat"])
        assert path.parent.name == "collective.certificates-fonts"

    def test_render_files(self, portal, tmp_path):
        files = registry.render_files({"inter", "caveat", "unknown"}, tmp_path)
        assert [p.split("/")[-1].rsplit("-", 1)[0] for p in files] == [
            "caveat",
            "inter",
        ]
