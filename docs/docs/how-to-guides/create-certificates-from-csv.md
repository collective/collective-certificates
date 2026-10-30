---
myst:
  html_meta:
    "description": "Create many certificates at once from a CSV file, on the page of a certificate template."
    "property=og:description": "Create many certificates at once from a CSV file, on the page of a certificate template."
    "property=og:title": "Create certificates from a CSV file"
    "keywords": "Plone, Attendance Certificates for Plone, CSV, spreadsheet, how-to"
---

(how-to-create-from-csv)=

# Create certificates from a CSV file

Use this guide to issue the certificates of a whole event at once, from a spreadsheet with one participant per row.

## Before you start

- You need a certificate template with a valid design, and permission to edit it.
- You need the **collective.certificates: Add Certificate** permission in each folder the certificates go to.
  [Install](install.md) explains how to grant it.
<!-- source: backend/src/collective/certificates/services/create_certificates/configure.zcml -->
<!-- source: backend/src/collective/certificates/api/batch.py -->

## Download the CSV template

Open the template and click {guilabel}`Download CSV template`.
The buttons show only to users who can edit the template.
<!-- source: frontend/packages/volto-certificates/src/components/CertificateTemplateView/CertificateTemplateView.tsx -->

The file has one column per certificate field, headed by the field's token, and a `parent_container` column first.
Its example row holds the template's sample data, and its `parent_container` is the folder of the template.
<!-- source: backend/src/collective/certificates/api/batch.py -->

## Fill it in

Write one row per certificate:

`parent_container`
:   The path of the folder the certificate goes to, from the site root, such as `/events/2026/certificates`.
    Use `/` for the site root.

`full_name`, `event_name`, `responsible_person`, `total_hours`
:   Text, as the certificate prints it.

`event_start_date`, `event_end_date`
:   Dates written as `YYYY-MM-DD`, such as `2026-05-26`.
    The template's date format decides how the certificate prints them.

Every field the template's design prints needs a value.
A value for a field the design does not print is stored with the certificate, but never shown.
Empty rows are skipped.
<!-- source: backend/src/collective/certificates/api/batch.py -->

Save the file as CSV.
UTF-8 is best, but the page also reads the Windows-1252 encoding that many spreadsheets use for CSV, so accented names arrive intact.
Comma and semicolon separators both work, so a spreadsheet saved with either is fine.
<!-- source: backend/src/collective/certificates/api/batch.py -->
<!-- source: frontend/packages/volto-certificates/src/helpers/csv.ts -->

The downloaded template starts with a byte order mark, so Excel opens it as UTF-8.
A file whose text was already damaged by a wrong encoding, with `�` in place of letters, is refused with a message asking you to save it as UTF-8.
<!-- source: frontend/packages/volto-certificates/src/helpers/csv.ts -->

## Upload it

Open the template again, click {guilabel}`Create certificates from CSV`, and choose the file.
<!-- source: frontend/packages/volto-certificates/src/components/CertificateTemplateView/CertificateTemplateView.tsx -->

Every row is checked before any certificate is created.
When all rows are valid, the page lists the new certificates.
When any row is not, no certificate is created, and the page lists each problem with its line in the file and its column, for example a missing value, a date that does not exist, or a folder that does not exist or where you cannot add certificates.
Fix the file and upload it again; nothing is duplicated, because nothing was created.
<!-- source: backend/src/collective/certificates/api/batch.py -->
<!-- source: backend/tests/api/test_batch.py -->

The certificates are rendered while you wait, so a large file takes a while.

## From a script

The same file works over REST, with `@create-certificates`, and from Python, with `collective.certificates.api.batch.create_certificates`.
See [the REST API reference](../reference/rest-api.md).
<!-- source: backend/src/collective/certificates/services/create_certificates/post.py -->
