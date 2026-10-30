"""Certificate fields and the vocabularies."""

#: (token, English title, kind) in vocabulary order.
FIELDS: tuple[tuple[str, str, str], ...] = (
    ("full_name", "Full name", "text"),
    ("event_name", "Event name", "text"),
    ("event_start_date", "Event start date", "date"),
    ("event_end_date", "Event end date", "date"),
    ("responsible_person", "Responsible person", "text"),
    ("total_hours", "Total hours", "text"),
    ("certificate_uid", "Certificate ID", "computed"),
    ("verification_url", "Verification URL", "computed"),
)

FONTS: tuple[tuple[str, str], ...] = (
    ("inter", "Inter"),
    ("inter-bold", "Inter Bold"),
    ("eb-garamond", "EB Garamond"),
    ("eb-garamond-bold", "EB Garamond Bold"),
    ("caveat", "Caveat"),
)

#: (token, title in English) of the date formats, in vocabulary order.
DATE_FORMATS: tuple[tuple[str, str], ...] = (
    ("day-month-year", "31/12/2026"),
    ("month-day-year", "12/31/2026"),
    ("iso", "2026-12-31"),
    ("long", "December 31, 2026"),
    ("long-day-first", "31 December 2026"),
)

QR_LEVELS: tuple[tuple[str, str], ...] = (
    ("L", "Low (7%)"),
    ("M", "Medium (15%)"),
    ("Q", "Quartile (25%)"),
    ("H", "High (30%)"),
)
