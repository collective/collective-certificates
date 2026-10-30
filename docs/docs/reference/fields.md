---
myst:
  html_meta:
    "description": "Reference of the certificate fields a template's placeholders can use."
    "property=og:description": "Reference of the certificate fields a template's placeholders can use."
    "property=og:title": "Fields"
    "keywords": "Plone, Attendance Certificates for Plone, fields, tokens, reference"
---

(reference-fields)=

# Fields

A {term}`token` names a field of a certificate.
The fields are fixed in version 1.0: the list is defined in one place in the add-on, so a new field needs a code change.
<!-- source: backend/src/collective/certificates/blueprint/fields.py -->

Each field has a kind.
A field of kind **text** takes any string, **date** takes an ISO date (`YYYY-MM-DD`), and **computed** is filled in by the system when a certificate is created.
Callers never provide computed fields, and a template's sample data cannot set them.
<!-- source: backend/src/collective/certificates/blueprint/fields.py -->

| Token | Title | Kind | Sample value |
| --- | --- | --- | --- |
| `full_name` | Full name | text | `Patrick Stewart` |
| `event_name` | Event name | text | `Star Trek: Picard` |
| `event_start_date` | Event start date | date | 2026-05-26 |
| `event_end_date` | Event end date | date | 2026-06-09 |
| `responsible_person` | Responsible person | text | `Jean-Luc Picard` |
| `total_hours` | Total hours | text | 47 |
| `certificate_uid` | Certificate ID | computed | `257e08fdcd07ff6fa3d1bc14f6aec321` |
| `verification_url` | Verification URL | computed | `https://example.org/verify/257e08fdcd07ff6fa3d1bc14f6aec321` |

<!-- source: backend/src/collective/certificates/blueprint/fields.py -->

The sample values are the ones the designer and the server preview use when the template has no sample data of its own.
The sample verification URL is illustrative: a real one is the verification page of the site, with the certificate's UID.
<!-- source: backend/src/collective/certificates/blueprint/fields.py -->
<!-- source: backend/src/collective/certificates/blueprint/model.py -->

## Computed fields

`certificate_uid` is the UID of the new certificate item.
`verification_url` is the address of the certificate's verification page, `<site URL>/verify/<uid>`.
The site URL comes from the `VOLTO_FRONTEND_DOMAIN` environment variable when it is set, and from the URL of the Plone site otherwise.
See [verify a certificate](../how-to-guides/verify-a-certificate.md) for how to set it.
<!-- source: backend/src/collective/certificates/content/template.py -->
<!-- source: backend/src/collective/certificates/utils/verification.py -->

## Requiring a field

A template requires every non-computed field its blueprint uses.
Rendering or creating a certificate without a value for one of them fails with the list of missing tokens.
<!-- source: backend/src/collective/certificates/utils/rendering.py -->

## Related

- [Placeholder language](placeholder-language.md), for how a field is written in a template.
- [Verify a certificate](../how-to-guides/verify-a-certificate.md), for the verification page and its address.
- [Python API](python-api.md), for passing field values from code.
