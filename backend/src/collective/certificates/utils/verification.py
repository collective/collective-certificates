"""Public verification of issued certificates.

A certificate's UID is printed on it. The UID is 128 random bits, so
holding it is what grants access: verification looks the certificate up
without checking permissions, whatever its workflow state.
"""

from collective.certificates.blueprint.fields import FIELDS
from collective.certificates.content.certificate import Certificate
from plone import api
from typing import Any
from zope.globalrequest import getRequest
from zope.i18n import translate

import os
import re


_UID = re.compile(r"^[0-9a-f]{32}$")

#: Path of the verification page below the site root, served by the frontend.
VERIFY_PATH: str = "verify"


def site_url() -> str:
    """Return the public URL of the site root.

    :returns: ``VOLTO_FRONTEND_DOMAIN`` when set, as plone.volto reads it;
        else the portal's URL, which is the frontend's when the request
        came through it.
    """
    url = os.environ.get("VOLTO_FRONTEND_DOMAIN") or api.portal.get().absolute_url()
    return url.rstrip("/")


def verification_url(uid: str) -> str:
    """Return the address printed on a certificate to verify it.

    :param uid: The certificate's UID.
    :returns: ``<site URL>/verify/<uid>``.
    """
    return f"{site_url()}/{VERIFY_PATH}/{uid}"


def find_certificate(uid: str) -> Certificate | None:
    """Find a certificate by UID, ignoring permissions.

    :param uid: 32 lowercase hexadecimal characters.
    :returns: The certificate, or ``None`` for a malformed or unknown UID
        and for a UID that belongs to something else.
    """
    if not _UID.match(uid):
        return None
    catalog = api.portal.get_tool("portal_catalog")
    brains = catalog.unrestrictedSearchResults(UID=uid, portal_type="Certificate")
    return brains[0]._unrestrictedGetObject() if brains else None


def download_url(uid: str) -> str:
    """Return the public download URL of a certificate's file.

    :param uid: The certificate's UID.
    :returns: ``<site URL>/@@certificate-file/<uid>``.
    """
    return f"{api.portal.get().absolute_url()}/@@certificate-file/{uid}"


def summary(certificate: Certificate) -> dict[str, Any]:
    """Describe a certificate for public verification.

    :param certificate: An issued certificate.
    :returns: Its UID, title, issue date, field values (as ``data``, and as
        ``fields`` with each field's translated title and kind), template
        and file.
    """
    data = dict(certificate.data or {})
    request = getRequest()
    fields = [
        {
            "token": field.token,
            "title": translate(field.title, context=request),
            "kind": field.kind,
            "value": data[field.token],
        }
        for field in FIELDS
        if field.token in data
    ]
    uid = api.content.get_uuid(certificate)
    catalog = api.portal.get_tool("portal_catalog")
    templates = catalog.unrestrictedSearchResults(UID=certificate.template_uid or "")
    template = (
        {"uid": templates[0].UID, "title": templates[0].Title} if templates else None
    )
    file = certificate.file
    return {
        "uid": uid,
        "title": certificate.title,
        "issued": certificate.created().ISO8601(),
        "data": data,
        "fields": fields,
        "template": template,
        "file": {
            "download": download_url(uid),
            "filename": file.filename,
            "content-type": file.contentType,
            "size": file.getSize(),
        },
    }
