---
myst:
  html_meta:
    "description": "Reference of the placeholder language used in certificate text and QR content."
    "property=og:description": "Reference of the placeholder language used in certificate text and QR content."
    "property=og:title": "Placeholder language"
    "keywords": "Plone, Attendance Certificates for Plone, placeholder, token, filter, reference"
---

(reference-placeholder-language)=

# Placeholder language

The `content` of a text element and of a QR code element can hold {term}`placeholders <placeholder>`.
A placeholder is written between double braces and names a {term}`token`, optionally followed by a {term}`filter`.
<!-- source: backend/src/collective/certificates/blueprint/template.py -->

## Syntax

| Form | Meaning |
| --- | --- |
| `{{ token }}` | Inserts the value of the field named `token`. |
| `{{ token\|filter }}` | Applies `filter` to the value, then inserts it. |

Spaces around the token, the vertical bar and the filter are allowed.
Text outside the braces is literal.
An opening `{{` without a closing `}}` is literal text too.
<!-- source: backend/src/collective/certificates/blueprint/template.py -->

A complete placeholder that does not follow this grammar is a syntax error.
Examples are an empty placeholder, a token starting with a digit, or two filters.
The validation message names the element and the placeholder.
<!-- source: backend/src/collective/certificates/blueprint/template.py -->

A token must be a field of the [fields](fields.md) table.
A filter must be one of the filters below.
Validation reports unknown tokens and unknown filters, and names the element.
<!-- source: backend/src/collective/certificates/blueprint/validate.py -->

## Tokens

The tokens are the fields listed in [fields](fields.md).
Computed fields are filled in when a certificate is created, so templates can use them without callers providing values.
<!-- source: backend/src/collective/certificates/blueprint/fields.py -->

## Filters

| Filter | Applies to | Effect |
| --- | --- | --- |
| `upper` | Any field | Converts the value to uppercase. |
| `lower` | Any field | Converts the value to lowercase. |
| `date` | Date fields only | Formats an ISO date (`YYYY-MM-DD`) with the template's [date format](#date-format). |

The `date` filter on a field that is not a date field is a validation error.
<!-- source: backend/src/collective/certificates/blueprint/template.py -->
<!-- source: backend/src/collective/certificates/blueprint/validate.py -->

(date-format)=

## Date format

The `date` filter writes the date in the template's **Date format**.
You choose the format from a list of five when you edit the template, and the field defaults to day-month-year.
The table shows how each format writes the date `2026-12-31`.
<!-- source: backend/src/collective/certificates/content/template.py -->
<!-- source: backend/src/collective/certificates/vocabularies/certificates.py -->

| Format | Token | Example |
| --- | --- | --- |
| Day-month-year (default) | `day-month-year` | `31/12/2026` |
| Month-day-year | `month-day-year` | `12/31/2026` |
| ISO | `iso` | `2026-12-31` |
| Long | `long` | `December 31, 2026` |
| Long, day first | `long-day-first` | `31 December 2026` |

<!-- source: backend/src/collective/certificates/blueprint/dateformats.py -->

The token is what the REST API and the Python code store in the template's `date_format` field.
Month names follow the site's default language.
Dates are formatted by the add-on, not by the system locale, so the output does not depend on the server's locale settings.
<!-- source: backend/src/collective/certificates/blueprint/dateformats.py -->
<!-- source: backend/src/collective/certificates/utils/rendering.py -->

A value that is not a valid ISO date makes rendering fail with a 400 error from the REST API, or a `TemplateRenderError` from Python.
<!-- source: backend/src/collective/certificates/blueprint/template.py -->
<!-- source: backend/tests/services/test_services.py -->

## Examples

```text
{{ full_name }}
{{ full_name|upper }}
from {{ event_start_date|date }} to {{ event_end_date|date }}
{{ verification_url }}
```

## Related

- [Fields](fields.md), for every token.
- [Blueprint](blueprint.md), for the elements that hold placeholders.
