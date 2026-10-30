"""Python API: render certificates and store them as content.

This is what other add-ons call::

    from collective.certificates.api import create_certificate

    certificate = create_certificate(
        template,
        {"full_name": "Patrick Stewart", "event_name": "Star Trek: Picard", ...},
        "/events/plone-conference/certificates",
    )

The result is a ``Certificate`` whose own UID is printed on it, so anyone
holding the certificate can verify it. Everything runs with the caller's
permissions; committing the transaction is the caller's business.
"""

from collective.certificates.blueprint.fields import MissingFields
from collective.certificates.content.certificate import Certificate
from collective.certificates.content.template import CertificateTemplate
from plone import api
from plone.dexterity.content import DexterityContent
from plone.i18n.normalizer.interfaces import IIDNormalizer
from plone.namedfile.file import NamedBlobFile
from typing import Any
from zope.component import getUtility
from zope.lifecycleevent import modified


__all__ = [
    "ContainerNotFound",
    "MissingFields",
    "create_certificate",
    "render_certificate",
]

CONTENT_TYPES: dict[str, str] = {"pdf": "application/pdf", "png": "image/png"}


class ContainerNotFound(ValueError):
    """Raised when a path does not resolve to a container."""


def resolve_container(path: str | DexterityContent) -> Any:
    """Resolve a Plone path, site-relative or absolute, to an object.

    :param path: ``/events/x``, ``/Plone/events/x``, or an object.
    :returns: The object.
    :raises ContainerNotFound: When nothing exists at the path.
    """
    if not isinstance(path, str):
        return path
    portal = api.portal.get()
    portal_path = "/".join(portal.getPhysicalPath())
    relative = path.rstrip("/")
    if relative == portal_path or relative.startswith(portal_path + "/"):
        relative = relative[len(portal_path) :]
    if not relative:
        return portal
    container = api.content.get(path=relative)
    if container is None:
        raise ContainerNotFound(f"No container at {path}")
    return container


def render_certificate(
    template: CertificateTemplate, data: dict[str, str], format: str = "pdf"
) -> bytes:
    """Render a certificate without storing it.

    Computed fields absent from ``data`` get sample values.

    :param template: The certificate template.
    :param data: Field values by token.
    :param format: ``pdf`` or ``png``.
    :returns: The file contents.
    :raises ValueError: For an unknown format.
    :raises MissingFields: When data lacks tokens the blueprint uses.
    """
    return template.render(data, format)


def default_filename(
    template: CertificateTemplate, data: dict[str, str], ext: str
) -> str:
    """Build the default file name.

    :param template: The certificate template.
    :param data: Field values by token.
    :param ext: File extension, without the dot.
    :returns: ``<template id>-<normalized full name>.<ext>``, or
        ``<template id>.<ext>`` without a full name.
    """
    name = data.get("full_name", "").strip()
    stem = template.getId()
    if name:
        stem = f"{stem}-{getUtility(IIDNormalizer).normalize(name)}"
    return f"{stem}.{ext}"


def default_title(data: dict[str, str], filename: str) -> str:
    """Build the default title.

    :param data: Field values by token.
    :param filename: Fallback.
    :returns: ``"<event name> — <full name>"`` when both are present, else
        the file name.
    """
    event = data.get("event_name", "").strip()
    name = data.get("full_name", "").strip()
    return f"{event} — {name}" if event and name else filename


def create_certificate(
    template: CertificateTemplate,
    data: dict[str, str],
    path: str | DexterityContent,
    *,
    format: str = "pdf",
    filename: str | None = None,
) -> Certificate:
    """Render a certificate and store it as a ``Certificate``.

    The item is created first so that its UID can be printed on the
    certificate, as ``{{ certificate_uid }}`` and inside
    ``{{ verification_url }}``.

    :param template: The certificate template.
    :param data: Field values by token; every token the blueprint uses must
        be present, except the computed ones.
    :param path: Container: a Plone path (site-relative or absolute) or the
        container object itself.
    :param format: ``pdf`` or ``png``.
    :param filename: File name; defaults to
        ``<template id>-<normalized full name>.<format>``.
    :returns: The created certificate.
    :raises ValueError: For an unknown format.
    :raises MissingFields: When data lacks tokens the blueprint uses.
    :raises collective.certificates.blueprint.template.TemplateRenderError:
        When a value cannot be rendered, such as a malformed date.
    :raises ContainerNotFound: When the path does not resolve.
    :raises AccessControl.Unauthorized: When the caller may not add content
        to the container.
    """
    if format not in CONTENT_TYPES:
        raise ValueError(f"Unknown format: {format}")
    container = resolve_container(path)
    # Fail on bad data before anything is created.
    template.svg(data, assets={})
    filename = filename or default_filename(template, data, format)
    certificate = api.content.create(
        container=container,
        type="Certificate",
        id=filename.rsplit(".", 1)[0],
        title=default_title(data, filename),
        safe_id=True,
        data=dict(data),
        template_uid=api.content.get_uuid(template),
    )
    values = {**data, **template.computed_values(api.content.get_uuid(certificate))}
    certificate.file = NamedBlobFile(
        data=template.render(values, format),
        filename=filename,
        contentType=CONTENT_TYPES[format],
    )
    modified(certificate)
    return certificate
