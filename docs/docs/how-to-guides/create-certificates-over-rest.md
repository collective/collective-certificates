---
myst:
  html_meta:
    "description": "Create, preview and render certificates over the REST API of a Plone site."
    "property=og:description": "Create, preview and render certificates over the REST API of a Plone site."
    "property=og:title": "Create certificates over REST"
    "keywords": "Plone, Attendance Certificates for Plone, REST, plone.restapi, how-to"
---

(how-to-create-over-rest)=

# Create certificates over REST

Use this guide when a client outside Plone, such as a script or a form, creates certificates.
The services are described in [the REST API reference](../reference/rest-api.md).
<!-- source: backend/src/collective/certificates/services/configure.zcml -->

## Before you start

- Know the URL of the template, such as `https://example.org/plone/template`.
- Have credentials for a user who may edit the template and holds the Add Certificate permission in the target folder.
  The examples use HTTP basic authentication.
  [Install](install.md) explains how to grant the permission.
- Know the folder path where the certificates go, such as `/certificates`.

## Preview the template

Download a preview of the stored blueprint filled with sample data.
It needs a valid blueprint, and the user must be able to modify the template.

```shell
curl -u editor:secret -o preview.png "https://example.org/plone/template/@preview?format=png"
```

<!-- source: backend/src/collective/certificates/services/preview/get.py -->
<!-- source: backend/tests/services/test_services.py -->

## Validate a blueprint before saving it

```shell
curl -u editor:secret -H "Content-Type: application/json" \
  -d @blueprint-request.json \
  https://example.org/plone/template/@validate-blueprint
```

The file `blueprint-request.json` holds `{"blueprint": {...}}`.
The response says whether the blueprint is valid, and lists the problems when it is not.
Nothing is saved.
<!-- source: backend/src/collective/certificates/services/validate_blueprint/post.py -->

## Create a certificate

Write the request body to a file, `certificate-request.json`:

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
  "format": "pdf"
}
```

Send it:

```shell
curl -u editor:secret -H "Content-Type: application/json" \
  -d @certificate-request.json \
  https://example.org/plone/template/@create-certificate
```

A successful request returns `201` and the summary of the new certificate item.
<!-- source: backend/tests/services/test_services.py -->

Read the `error` object when the status is `400`.
It names the problem, and for missing values it lists them in a `missing` field.
A `401` means the user does not hold the Add Certificate permission in the folder.
<!-- source: backend/tests/services/test_services.py -->

## Render without storing

`@render` returns the file in the response and stores nothing.
Use it to check how data looks.
The printed certificate ID is the sample ID, so this output cannot be verified later.
<!-- source: backend/src/collective/certificates/utils/rendering.py -->

```shell
curl -u editor:secret -H "Content-Type: application/json" \
  -d @certificate-request.json \
  -o check.pdf \
  https://example.org/plone/template/@render
```

## Related

- [REST API](../reference/rest-api.md), for every service, its parameters and its responses.
- [Verify a certificate](verify-a-certificate.md), to check a certificate after you create it.
- [Blueprint](../reference/blueprint.md), for the document that `@validate-blueprint` checks.
