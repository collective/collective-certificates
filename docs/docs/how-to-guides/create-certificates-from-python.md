---
myst:
  html_meta:
    "description": "Create certificates from Python code with create_certificate, from a script or from another add-on."
    "property=og:description": "Create certificates from Python code with create_certificate, from a script or from another add-on."
    "property=og:title": "Create certificates from Python"
    "keywords": "Plone, Attendance Certificates for Plone, Python, create_certificate, how-to"
---

(how-to-create-from-python)=

# Create certificates from Python

Use this guide when your code creates certificates: a script, a migration, or another add-on.
The function is `create_certificate()`, described in [the Python API reference](../reference/python-api.md).
<!-- source: backend/src/collective/certificates/api/__init__.py -->

## Before you start

- A `CertificateTemplate` exists in the site, and it has a valid blueprint.
- A folder exists where the certificates go, such as `/certificates`.
- The code runs as a user who holds the Add Certificate permission in that folder.
  The function uses the caller's permissions, and [install](install.md) explains how to grant it.
  <!-- source: backend/src/collective/certificates/api/__init__.py -->

## Create one certificate

```python
from collective.certificates.api import create_certificate
from plone import api

template = api.content.get(path="/plone/template")
certificate = create_certificate(
    template,
    {
        "full_name": "Patrick Stewart",
        "event_name": "Star Trek: Picard",
        "event_start_date": "2026-05-26",
        "event_end_date": "2026-06-09",
        "responsible_person": "Jean-Luc Picard",
        "total_hours": "47",
    },
    "/plone/certificates",
)
api.content.get_uuid(certificate)
```

Provide a value for every token the template's blueprint uses, except `certificate_uid` and `verification_url`, which the function fills in.
If you miss one, the function raises `MissingFields` and creates nothing.
<!-- source: backend/src/collective/certificates/api/__init__.py -->
<!-- source: backend/tests/api/test_create_certificate.py -->

## Choose the format and the file name

Pass `format="png"` for a PNG instead of a PDF, and `filename="name.png"` to set the file name.
<!-- source: backend/src/collective/certificates/api/__init__.py -->

## Handle errors

```python
from collective.certificates.api import ContainerNotFound
from collective.certificates.api import create_certificate
from collective.certificates.blueprint.template import TemplateRenderError
from collective.certificates.blueprint.fields import MissingFields

try:
    certificate = create_certificate(template, data, path)
except MissingFields as exc:
    print("Missing:", exc.missing)
except ContainerNotFound:
    print("No folder at", path)
except TemplateRenderError as exc:
    print("Cannot render:", exc)
```

<!-- source: backend/src/collective/certificates/api/__init__.py -->

## Commit the transaction

The function does not commit.
In a script, call `transaction.commit()` after the last certificate.
In a request handler, the request commits when it finishes successfully.
<!-- source: backend/src/collective/certificates/api/__init__.py -->

## Run it from the Plone console

The backend of this repository has a console target.
From the `backend` directory, run:

```shell
make console
```

Inside the console, set the site and a user who has the Manager role, then create the certificate:

```python
import transaction
from collective.certificates.api import create_certificate
from plone import api
from zope.component.hooks import setSite

site = app.Plone
setSite(site)
with api.env.adopt_user(username="admin"):
    with api.env.adopt_roles(["Manager"]):
        template = api.content.get(path="/template")
        create_certificate(template, data, "/certificates")
transaction.commit()
```

Replace `data` with the dictionary of values.
Create the `certificates` folder first, because the console does not create one.
<!-- source: backend/Makefile -->
<!-- source: backend/scripts/create_site.py -->

The `admin` user and its password come from the instance configuration in `backend/instance.yaml`.
<!-- source: backend/instance.yaml -->

## Related

- [Python API](../reference/python-api.md), for every argument and exception of `create_certificate`.
- [Use with another add-on](use-with-another-add-on.md), to issue certificates from your own add-on.
- [Fields](../reference/fields.md), for the values a certificate takes.
