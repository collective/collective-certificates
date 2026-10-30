---
myst:
  html_meta:
    "description": "Call create_certificate from another Plone add-on, such as an event add-on, to issue certificates automatically."
    "property=og:description": "Call create_certificate from another Plone add-on, such as an event add-on, to issue certificates automatically."
    "property=og:title": "Use with another add-on"
    "keywords": "Plone, Attendance Certificates for Plone, event, integration, how-to"
---

(how-to-use-with-another-add-on)=

# Use with another add-on

Use this guide when another add-on, such as an event add-on, knows who attended and issues a certificate for each attendee.
The other add-on calls [`create_certificate()`](../reference/python-api.md) and passes the values it already has.
<!-- source: backend/src/collective/certificates/api/__init__.py -->

## What the other add-on provides

The other add-on needs three things:

- The template: a `CertificateTemplate` object, usually found by UID or path and stored in its own settings.
- The values: a dictionary with one entry per token the template uses, except the computed ones.
- The container: the folder where the certificates go, as a path or as the folder object.
<!-- source: backend/src/collective/certificates/api/__init__.py -->

## Call it when an attendance is confirmed

```python
from collective.certificates.api import create_certificate
from collective.certificates.api import ContainerNotFound
from collective.certificates.blueprint.fields import MissingFields
from plone import api


def issue_certificate(attendee, event):
    template = api.content.get(UID=event.certificate_template_uid)
    data = {
        "full_name": attendee.fullname,
        "event_name": event.title,
        "event_start_date": event.start.date().isoformat(),
        "event_end_date": event.end.date().isoformat(),
        "responsible_person": event.coordinator,
        "total_hours": str(event.hours),
    }
    try:
        return create_certificate(template, data, event.certificates_path)
    except (MissingFields, ContainerNotFound):
        # Report it to the organiser; the attendance itself stays valid.
        return None
```

The names `attendee`, `event` and their attributes are placeholders for the other add-on's objects.
<!-- source: backend/src/collective/certificates/api/__init__.py -->

Dates must be ISO strings (`YYYY-MM-DD`), because the `date` filter rejects anything else.
<!-- source: backend/src/collective/certificates/blueprint/template.py -->

## Permissions

`create_certificate()` uses the caller's permissions.
If the code runs for a user who does not hold the Add Certificate permission in the folder, the call raises `Unauthorized`.
The permission is granted as described in [install](install.md).
Run the call as a user with the right roles, or create the certificates in a block that adopts a suitable role.
<!-- source: backend/src/collective/certificates/api/__init__.py -->

## Transactions

The function does not commit.
Inside a request, Plone commits when the request succeeds.
In a script or a background job, commit after the loop.
<!-- source: backend/src/collective/certificates/api/__init__.py -->

## Store the template

Keep the template's UID in the other add-on's settings, not its path, because a path changes when content is moved and a UID does not.
<!-- source: backend/src/collective/certificates/api/__init__.py -->

## Related

- [Python API](../reference/python-api.md), for every argument and exception of `create_certificate`.
- [Create certificates from Python](create-certificates-from-python.md), for scripts and the Plone console.
- [Fields](../reference/fields.md), for the values the other add-on passes.
