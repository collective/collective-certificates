"""Catalog indexers for the add-on's content types."""

from collective.certificates.content.certificate import ICertificate
from plone.indexer import indexer


@indexer(ICertificate)
def certificate_allowed_roles_and_users(obj: ICertificate) -> list[str]:
    """Index a certificate as visible to Managers only.

    The certificate workflow lets anyone view a certificate at its address,
    so the default indexer would list it to Anonymous. Indexing only
    ``Manager`` keeps certificates out of search, navigation and folder
    listings for everyone else, while the address keeps working.

    :param obj: An issued certificate.
    :returns: ``["Manager"]``.
    """
    return ["Manager"]
