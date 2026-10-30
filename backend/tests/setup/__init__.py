"""Install, uninstall and site configuration."""

#: Registry records and their defaults.
RECORDS: tuple[tuple[str, object], ...] = (
    ("collective.certificates.extra_font_dir", ""),
    ("collective.certificates.pdf_dpi", 300),
)

VOCABULARIES: tuple[str, ...] = (
    "collective.certificates.Fonts",
    "collective.certificates.Fields",
    "collective.certificates.FieldKinds",
    "collective.certificates.DateFormats",
    "collective.certificates.QrErrorCorrection",
)

#: Add permissions, by Zope title.
ADD_PERMISSIONS: tuple[str, ...] = (
    "collective.certificates: Add CertificateTemplate",
    "collective.certificates: Add Certificate",
)
