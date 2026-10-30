"""The CertificateTemplate content type."""

BEHAVIORS: tuple[str, ...] = (
    "plone.basic",
    "plone.namefromtitle",
    "plone.shortname",
    "plone.excludefromnavigation",
)

FIELDS: tuple[str, ...] = (
    "background",
    "blueprint",
    "sample_data",
    "date_format",
)
