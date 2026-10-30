---
myst:
  html_meta:
    "description": "Verify an issued certificate on its verification page, or over REST, and set the verification address printed in the QR code."
    "property=og:description": "Verify an issued certificate on its verification page, or over REST, and set the verification address printed in the QR code."
    "property=og:title": "Verify a certificate"
    "keywords": "Plone, Attendance Certificates for Plone, verification, QR code, how-to"
---

(how-to-verify)=

# Verify a certificate

Every certificate carries its own UID, which is 128 random bits written as 32 hexadecimal characters.
Holding the UID is what allows verification, so the UID is the only credential.
<!-- source: backend/src/collective/certificates/utils/verification.py -->

## Open the verification page

The QR code of a certificate leads to its verification page, at `<site URL>/verify/<uid>`.
The page is part of the Volto frontend, so the frontend must serve the site.
<!-- source: backend/src/collective/certificates/utils/verification.py -->
<!-- source: frontend/packages/volto-certificates/src/config/routes.ts -->

The page shows the title **Certificate verification** and whether the certificate is valid.
For a valid certificate, it shows the title, the issue date, the field values, and a button to download the file.
For an unknown UID, it shows a message that the certificate was not found.
<!-- source: frontend/packages/volto-certificates/src/components/VerifyCertificate/VerifyCertificate.tsx -->

Anyone holding the UID can open the page, whatever the workflow state of the certificate.
<!-- source: backend/src/collective/certificates/services/certificate_verification/get.py -->

## Verify from a script

The page reads the public verification service, `@certificate-verification/<uid>`, which returns JSON.
Use the service directly when a machine verifies certificates:

```shell
curl https://example.org/plone/@certificate-verification/257e08fdcd07ff6fa3d1bc14f6aec321
```

The summary has the UID, the title, the issue date, the field values, the template, and the file details, including a download link.
The field values come in two forms: `data`, a dictionary of values by token, and `fields`, a list of the same values with each field's token, translated title and kind.
<!-- source: backend/src/collective/certificates/services/certificate_verification/get.py -->
<!-- source: backend/src/collective/certificates/utils/verification.py -->

The file is at `@@certificate-file/<uid>` on the same site:

```shell
curl -o certificate.pdf https://example.org/plone/@@certificate-file/257e08fdcd07ff6fa3d1bc14f6aec321
```

<!-- source: backend/src/collective/certificates/browser/file.py -->

The service answers `404` for an unknown UID, a malformed UID or an extra path segment.
The file view does the same.
<!-- source: backend/tests/services/test_verification.py -->

## Put the UID on the certificate

The QR code of the sample blueprint encodes `{{ verification_url }}`, which is the verification page address with the UID in it.
To print the UID as text, add a text element with `{{ certificate_uid }}`.
<!-- source: backend/src/collective/certificates/blueprint/fields.py -->
<!-- source: backend/tests/_resources/blueprints/sample.json -->

## Set the site URL of the verification address

The address printed on a certificate is built from the site URL, not from the template.
The site URL is the value of the `VOLTO_FRONTEND_DOMAIN` environment variable when it is set.
Otherwise it is the URL of the Plone site.
<!-- source: backend/src/collective/certificates/utils/verification.py -->

Set `VOLTO_FRONTEND_DOMAIN` to the public address of the frontend, such as `https://example.org`, before you issue certificates.
A certificate created from a script or the Plone console uses the URL of the backend otherwise.
The backend does not serve `/verify`, so a QR code with that address does not open the page.
<!-- source: backend/src/collective/certificates/utils/verification.py -->

Changing the site URL does not change certificates already issued, because their QR codes are rendered when they are created.
<!-- source: backend/src/collective/certificates/api/__init__.py -->

## Revoke a certificate

The add-on has no revocation.
Anyone holding a UID can verify its certificate for as long as the certificate item exists.
<!-- source: backend/src/collective/certificates/utils/verification.py -->

## Related

- [REST API](../reference/rest-api.md), for the verification service and the file view.
- [Fields](../reference/fields.md), for the computed `certificate_uid` and `verification_url` fields.
- [How rendering works](../concepts/how-rendering-works.md), for why verification uses a capability URL.
