---
myst:
  html_meta:
    "description": "REST services of Attendance Certificates for Plone: preview, render, validate, create and verify."
    "property=og:description": "REST services of Attendance Certificates for Plone: preview, render, validate, create and verify."
    "property=og:title": "REST API"
    "keywords": "Plone, Attendance Certificates for Plone, REST, plone.restapi, reference"
---

(reference-rest-api)=

# REST API

The add-on adds services to `plone.restapi`.
The examples below follow the functional tests, which assert the status codes, headers and bodies shown.
<!-- source: backend/tests/services/test_services.py -->
<!-- source: backend/tests/services/test_verification.py -->

Services on a template are called on the template's URL, such as `https://example.org/plone/template/@render`.
Errors use the `plone.restapi` format, `{"error": {"type": ..., "message": ...}}`.
<!-- source: backend/src/collective/certificates/services/base.py -->

## Summary

| Service | Method | Permission | Anonymous | Success |
| --- | --- | --- | --- | --- |
| `@preview` | GET | Modify portal content | 401 | 200, PNG or SVG |
| `@render` | POST | Modify portal content | 401 | 200, PDF or PNG, not stored |
| `@validate-blueprint` | POST | Modify portal content | not tested | 200, validity and errors |
| `@create-certificate` | POST | Modify portal content, and Add Certificate in the container | not tested | 201, the new item |
| `@certificates-csv` | GET | Modify portal content | 401 | 200, a CSV file to fill in |
| `@create-certificates` | POST | Modify portal content, and Add Certificate in each container | 401 | 201, the new items |
| `@certificate-verification/<uid>` | GET | View (site root) | 200 for a known UID | 200, the certificate summary |

<!-- source: backend/src/collective/certificates/services/configure.zcml -->

`@create-certificate` also needs the **collective.certificates: Add Certificate** permission in the target folder.
An editor who may edit the template but does not hold that permission there gets 401.
See [install](../how-to-guides/install.md) for granting it.
<!-- source: backend/tests/services/test_services.py -->
<!-- source: backend/src/collective/certificates/permissions.zcml -->

The verification service is public.
Anyone holding the UID gets the summary, whatever the workflow state of the certificate.
The verification page of the frontend, `/verify/<uid>`, reads this service.
<!-- source: backend/src/collective/certificates/services/configure.zcml -->
<!-- source: backend/src/collective/certificates/utils/verification.py -->

## GET `@preview`

Shows the stored blueprint filled with sample data.
The template must be valid, or the request fails.

Query parameter `format`: `png` (default) or `svg`.

```text
GET /plone/template/@preview?format=png
```

Response, `200`:

```text
Content-Type: image/png
Content-Disposition: inline; filename="template-preview.png"
Cache-Control: private, no-store
```

Other responses:

- `400` with `Unknown format: gif` for an unknown `format`.
- `400` with `Invalid blueprint` and an `errors` list when the blueprint does not validate.
- `400` when the sample data cannot be rendered, such as a date that is not ISO.

<!-- source: backend/tests/services/test_services.py -->
<!-- source: backend/src/collective/certificates/services/preview/get.py -->

## POST `@render`

Renders a certificate without storing it.
Computed fields that the request does not provide get sample values, so the file prints the sample certificate ID and the sample verification URL.
Do not use this output as a certificate that can be verified.
<!-- source: backend/src/collective/certificates/utils/rendering.py -->

Request body:

```json
{
  "data": {
    "full_name": "Patrick Stewart",
    "event_name": "Star Trek: Picard",
    "event_start_date": "2026-05-26",
    "event_end_date": "2026-06-09",
    "responsible_person": "Jean-Luc Picard",
    "total_hours": "47"
  },
  "format": "pdf"
}
```

`format` is `pdf` (default) or `png`.

Response, `200` for a PDF:

```text
Content-Type: application/pdf
Content-Disposition: attachment; filename="template-patrick-stewart.pdf"
```

The body starts with `%PDF`.
For `png`, the content type is `image/png` and the body starts with the PNG signature.

Other responses:

- `400` with a `missing` list when data lacks values the blueprint uses.
  The list is sorted by token:

    ```json
    {"error": {"type": "BadRequest", "message": "Missing certificate fields: event_end_date, event_name, event_start_date, responsible_person, total_hours", "missing": ["event_end_date", "event_name", "event_start_date", "responsible_person", "total_hours"]}}
    ```

- `400` for an unknown `format`, an invalid blueprint, or a date that does not parse.
- `401` for anonymous requests.

<!-- source: backend/tests/services/test_services.py -->
<!-- source: backend/src/collective/certificates/services/render/post.py -->

## POST `@validate-blueprint`

Checks a blueprint against the template: the schema, the fonts, the field tokens, the filters and the image fields.
Nothing is saved.
This is what the designer's Apply button calls.
<!-- source: backend/src/collective/certificates/services/validate_blueprint/post.py -->
<!-- source: frontend/packages/volto-certificates/src/actions/certificates.ts -->

Request body:

```json
{"blueprint": {"version": 1, "page": {"width": 3508, "height": 2480}, "elements": []}}
```

Response, `200`:

```json
{"errors": [], "valid": true}
```

An invalid blueprint is still `200`, with `"valid": false` and one entry per problem:

```json
{
  "errors": [
    {
      "element": "name",
      "path": "/elements/0/font",
      "message": "name: unknown font comic-sans."
    }
  ],
  "valid": false
}
```

A body without `blueprint` gets `400`.
<!-- source: backend/tests/services/test_services.py -->

## POST `@create-certificate`

Creates a `Certificate` item in a folder and stores the rendered file.
It is the REST counterpart of [`create_certificate()`](python-api.md).
<!-- source: backend/src/collective/certificates/services/create_certificate/post.py -->

Request body:

```json
{
  "data": {
    "full_name": "Patrick Stewart",
    "event_name": "Star Trek: Picard",
    "event_start_date": "2026-05-26",
    "event_end_date": "2026-06-09",
    "responsible_person": "Jean-Luc Picard",
    "total_hours": "47"
  },
  "path": "/certificates",
  "format": "pdf",
  "filename": "optional-name.pdf"
}
```

`path` is required and resolves like the Python API does.
`format` is `pdf` (default) or `png`.
`filename` is optional.
<!-- source: backend/src/collective/certificates/services/create_certificate/post.py -->

Response, `201`: the summary of the new item, with `@type` set to `Certificate`, its `@id` and its `title`, for example `Star Trek: Picard — Patrick Stewart`.
The `@id` ends with `/certificates/template-patrick-stewart` for the request above.
<!-- source: backend/tests/services/test_services.py -->

Errors, all `400` unless noted:

- `Missing path` when `path` is absent or empty.
- `No container at /nowhere` when the path does not resolve.
- `Unknown format: gif`.
- `Not an ISO date (YYYY-MM-DD): 'x'` and other rendering errors.
- A `missing` list when values are absent.
- `401` when the caller lacks the Add Certificate permission in the folder.

<!-- source: backend/tests/services/test_services.py -->

## GET `@certificates-csv`

Returns a CSV file to fill in with one certificate per row.
<!-- source: backend/src/collective/certificates/services/certificates_csv/get.py -->

Response, `200`:

```json
{
  "filename": "template.csv",
  "csv": "parent_container,full_name,event_name,event_start_date,event_end_date,responsible_person,total_hours\r\n/,Patrick Stewart,Star Trek: Picard,2026-05-26,2026-06-09,Jean-Luc Picard,47\r\n"
}
```

The columns are `parent_container`, the site-relative path of the folder, and every certificate field except the computed ones.
The example row holds the template's sample data and the template's folder.
<!-- source: backend/src/collective/certificates/api/batch.py -->
<!-- source: backend/tests/services/test_batch.py -->

## POST `@create-certificates`

Creates one `Certificate` per row of a CSV file, or none.
<!-- source: backend/src/collective/certificates/services/create_certificates/post.py -->

Request body:

```json
{
  "csv": "parent_container,full_name,event_name,event_start_date,event_end_date,responsible_person,total_hours\n/certificates,Patrick Stewart,Star Trek: Picard,2026-05-26,2026-06-09,Jean-Luc Picard,47\n",
  "format": "pdf"
}
```

`csv` is required: the file's text, comma or semicolon separated, with a header row.
`format` is `pdf` (default) or `png`.
<!-- source: backend/src/collective/certificates/api/batch.py -->

Response, `201`:

```json
{
  "items": [
    {"@id": "https://example.org/plone/certificates/template-patrick-stewart", "@type": "Certificate", "title": "Star Trek: Picard — Patrick Stewart"}
  ],
  "items_total": 1
}
```

Every row is checked before anything is created.
When any row is invalid, the response is `400` with the message `Invalid CSV` and every issue, and no certificate is created:
<!-- source: backend/tests/services/test_batch.py -->

```json
{
  "error": {
    "type": "BadRequest",
    "message": "Invalid CSV",
    "errors": [
      {"row": 3, "column": "parent_container", "message": "No container at /nowhere."}
    ]
  }
}
```

`row` is the line in the file, the header being line 1, or `0` for a problem with the whole file, such as a file without rows.
`column` names the column, or is `null`.
The messages are translated.
Issues include unknown or repeated columns, a missing `parent_container` column or value, a folder that does not exist or where the caller cannot add certificates, missing values and dates that cannot be rendered.
<!-- source: backend/src/collective/certificates/api/batch.py -->

Other errors, all `400`:

- `Missing csv` when `csv` is absent or not text.
- `Unknown format: gif`.
- `Invalid blueprint`, with the blueprint's issues, when the template's design is not valid.

<!-- source: backend/tests/services/test_batch.py -->

## GET `@certificate-verification/<uid>`

Public.
Returns what a certificate says about itself.
The verification page reads this service.
<!-- source: backend/src/collective/certificates/services/certificate_verification/get.py -->

```text
GET /plone/@certificate-verification/257e08fdcd07ff6fa3d1bc14f6aec321
```

Response, `200`:

```json
{
  "uid": "257e08fdcd07ff6fa3d1bc14f6aec321",
  "title": "Star Trek: Picard — Patrick Stewart",
  "issued": "2026-06-10T12:00:00+00:00",
  "data": {
    "full_name": "Patrick Stewart",
    "event_name": "Star Trek: Picard"
  },
  "fields": [
    {"token": "full_name", "title": "Full name", "kind": "text", "value": "Patrick Stewart"},
    {"token": "event_name", "title": "Event name", "kind": "text", "value": "Star Trek: Picard"}
  ],
  "template": {"uid": "8d8f6d3c2b1a4e5f9a0b7c6d5e4f3a2b", "title": "Starfleet Academy Certificate"},
  "file": {
    "download": "https://example.org/plone/@@certificate-file/257e08fdcd07ff6fa3d1bc14f6aec321",
    "filename": "template-patrick-stewart.pdf",
    "content-type": "application/pdf",
    "size": 12345
  }
}
```

The `issued` value is the creation date of the item, in ISO 8601 format.
The `data` object holds the field values the certificate was rendered with, keyed by token.
The `fields` list holds the same values, one entry per field, with the token, the title translated into the request's language, the kind (`text` or `date`), and the value.
`template` is `null` when the template no longer exists.
<!-- source: backend/src/collective/certificates/utils/verification.py -->

The example above is illustrative: the keys and their types are from the code, and the values are placeholders.

Responses:

- `404` for a malformed UID, an unknown UID, a UID of another type, or an extra path segment.
- `404` when no UID is given.

<!-- source: backend/tests/services/test_verification.py -->
<!-- source: backend/tests/verification/test_verification.py -->

## GET `@@certificate-file/<uid>`

Public.
Streams the file of a certificate.

```text
GET /plone/@@certificate-file/257e08fdcd07ff6fa3d1bc14f6aec321
```

Response, `200`:

```text
Content-Type: application/pdf
Content-Disposition: inline; filename="template-patrick-stewart.pdf"
```

Unknown UIDs and extra path segments get `404`.
<!-- source: backend/src/collective/certificates/browser/file.py -->
<!-- source: backend/tests/services/test_verification.py -->

## Related

- [Create certificates over REST](../how-to-guides/create-certificates-over-rest.md), for the services in use.
- [Verify a certificate](../how-to-guides/verify-a-certificate.md), for the verification page and the public services.
