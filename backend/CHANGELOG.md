# Changelog

<!--
   You should *NOT* be adding new change log entries to this file.
   You should create a file in the news directory instead.
   For helpful instructions, please see:
   https://github.com/plone/plone.releaser/blob/master/ADD-A-NEWS-ITEM.rst
-->

<!-- towncrier release notes start -->

## 1.0.0a1 (2026-11-19)


### Feature

- Added a single-state workflow for each content type: anyone with a certificate's address can view it, while search, navigation and listings show certificates to Managers only; certificate templates and their images are visible only to the people who manage them. @ericof [#2](https://github.com/collective/collective-certificates/issues/2)
- Stored the SHA-256 of each certificate's file when it is issued, in the new read-only `file_hash` field. The REST API gives it with the certificate, and `@certificate-verification` gives it as `file.sha256`; certificates issued before this change get the hash of their current file. @ericof [#3](https://github.com/collective/collective-certificates/issues/3)
- Added `create_certificate()` to render a certificate as PDF or PNG and store it at a Plone path, and the `@preview`, `@render`, `@validate-blueprint` and `@create-certificate` REST API services. @ericof 
- Added a configured certificate template, Starfleet Academy Certificate, to the example content profile: a Plone-branded background, a signature as an Image inside it, a design with the participant's name, the event, its dates and hours, the signer and the verification QR code, and sample data to preview it. @ericof 
- Added the Certificate Template content type: a folder with a background image and a design placing text, images and QR codes on the page, where the images, such as a signature or a logo, are Image items inside the template, with the bundled fonts Inter, EB Garamond and Caveat, and a date format chosen from the `collective.certificates.DateFormats` vocabulary. Saving a template checks its design against its fonts, fields and background, so a template can be created or imported with a design that uses images added inside it afterwards; those images are checked before a preview or a certificate. @ericof 
- Added the Certificate content type: `create_certificate()` now stores each issued certificate with the values it was rendered with, prints its own ID and verification URL (`{{ certificate_uid }}`, `{{ verification_url }}`, the site's `/verify/<uid>`), and anyone holding that ID can verify it through `@certificate-verification/<uid>` and download it from `@@certificate-file/<uid>`. @ericof 
- Added the `@certificates-csv` and `@create-certificates` REST services and `collective.certificates.api.batch.create_certificates()`: a CSV file with a `parent_container` column and one column per field creates one certificate per row, or none when any row is invalid, every issue listed by line and column; text damaged by a wrong encoding is refused. @ericof 
- Added the permissions `collective.certificates: Add CertificateTemplate` and `collective.certificates: Add Certificate`. No role has them after installing the add-on; the example content profile grants them to Manager. @ericof 


### Documentation

- Described the package's features, supported versions and Python API in its README, with an English example and a link to the documentation at https://collective.github.io/collective-certificates/. @ericof 


### Tests

- Added `contract-context.json` to the shared test fixtures: the fonts, fields, page and text sizes the frontend needs to reproduce the golden SVGs and the validation cases. @ericof
