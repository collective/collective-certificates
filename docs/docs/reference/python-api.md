---
myst:
  html_meta:
    "description": "Python API of Attendance Certificates for Plone: create_certificate and its helpers."
    "property=og:description": "Python API of Attendance Certificates for Plone: create_certificate and its helpers."
    "property=og:title": "Python API"
    "keywords": "Plone, Attendance Certificates for Plone, Python, API, create_certificate, reference"
---

(reference-python-api)=

# Python API

The public functions live in `collective.certificates.api`.
Other add-ons import them from there.
<!-- source: backend/src/collective/certificates/api/__init__.py -->

```python
from collective.certificates.api import create_certificate
```

## `create_certificate`

```python
create_certificate(template, data, path, *, format="pdf", filename=None)
```

Renders a certificate and stores it as a `Certificate` item.

:param template: The {term}`template <certificate template>`, a `CertificateTemplate` object.
:param data: Field values by {term}`token`.
    Every token the blueprint uses must be present, except the computed ones.
:param path: The container: a Plone path, site-relative (`/certificates`) or absolute (`/plone/certificates`), or the container object itself.
    The site root is accepted too.
:param format: `pdf` (default) or `png`.
:param filename: The file name.
    Defaults to `<template id>-<normalized full name>.<format>`, or `<template id>.<format>` when there is no full name.
:returns: The created `Certificate`.

Behaviour:

- The item is created first, so its UID can be printed on the certificate as `{{ certificate_uid }}` or inside `{{ verification_url }}`.
- Data is checked before anything is created.
  A missing value or a value that cannot be rendered leaves the container unchanged.
- The title is `<event name> — <full name>` when both are present, else the file name.
- The item's `data` holds the values, and its `template_uid` the UID of the template.
- Everything runs with the caller's permissions, so the caller must hold **collective.certificates: Add Certificate** in the container.
- The function does not commit the transaction.
  Committing is the caller's responsibility.

<!-- source: backend/src/collective/certificates/api/__init__.py -->
<!-- source: backend/tests/api/test_create_certificate.py -->

Exceptions:

- `ValueError` for an unknown `format`.
- `MissingFields` when data lacks tokens the blueprint uses.
  It is a `ValueError` subclass, with a `missing` attribute listing the tokens in sorted order.
- `TemplateRenderError` (from `collective.certificates.blueprint.template`) for a value that cannot be rendered, such as a malformed date.
- `ContainerNotFound` when the path does not resolve.
- `AccessControl.Unauthorized` when the caller does not hold the Add Certificate permission in the container.

<!-- source: backend/src/collective/certificates/api/__init__.py -->

## `render_certificate`

```python
render_certificate(template, data, format="pdf")
```

Returns the file contents of a certificate without storing it.
Computed fields absent from `data` get sample values.
The result of this function cannot be verified, because the printed ID is the sample ID.
<!-- source: backend/src/collective/certificates/api/__init__.py -->

Returns `bytes`.
Raises `ValueError` for an unknown format and `MissingFields` for missing values.

## `default_filename` and `default_title`

```python
default_filename(template, data, ext)
default_title(data, filename)
```

`default_filename` returns `<template id>-<normalized full name>.<ext>`, or `<template id>.<ext>` without a full name.
`default_title` returns `<event name> — <full name>` when both are present, or `filename` otherwise.
<!-- source: backend/src/collective/certificates/api/__init__.py -->

## `resolve_container`

```python
resolve_container(path)
```

Resolves a path, or returns the object it is given.
The path may be site-relative or start with the site path.
An empty path or the site path resolves to the site.
Raises `ContainerNotFound` when nothing exists at the path.
<!-- source: backend/src/collective/certificates/api/__init__.py -->
<!-- source: backend/tests/api/test_create_certificate.py -->

## Constants

`CONTENT_TYPES` maps each format to its MIME type: `pdf` to `application/pdf`, and `png` to `image/png`.
<!-- source: backend/src/collective/certificates/api/__init__.py -->

## Example from another add-on

```python
from collective.certificates.api import create_certificate
from plone import api

template = api.content.get(path="/plone/certificate-templates/event")
certificate = create_certificate(
    template,
    {
        "full_name": "Benjamin Sisko",
        "event_name": "Star Trek: Deep Space Nine",
        "event_start_date": "2026-09-01",
        "event_end_date": "2026-09-03",
        "responsible_person": "Jean-Luc Picard",
        "total_hours": "24",
    },
    "/plone/events/deep-space-nine/certificates",
)
```

The `certificates` folder must exist, and the caller must hold the Add Certificate permission in it.
Commit the transaction afterwards.
<!-- source: backend/src/collective/certificates/api/__init__.py -->

## Related

- [Create certificates from Python](../how-to-guides/create-certificates-from-python.md), for scripts and the Plone console.
- [Use with another add-on](../how-to-guides/use-with-another-add-on.md), to call the API from your own add-on.
