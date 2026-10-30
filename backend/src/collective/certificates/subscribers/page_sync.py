"""Keep a template's page the size of its background."""

from collective.certificates.blueprint.model import Blueprint
from collective.certificates.content.template import CertificateTemplate
from typing import Any
from typing import cast


def sync_page(template: CertificateTemplate, event: Any) -> None:
    """Rewrite ``page`` when it no longer matches the background.

    Element positions are left alone: the designer shows what moved off the
    page, and the author decides.

    :param template: The modified template.
    :param event: An ``IObjectModifiedEvent`` (or added event).
    """
    size = template.page_size()
    blueprint = getattr(template, "blueprint", None)
    if size is None or not isinstance(blueprint, dict):
        return
    page = {"width": size[0], "height": size[1]}
    if blueprint.get("page") == page:
        return
    template.blueprint = cast(Blueprint, {**blueprint, "page": page})
