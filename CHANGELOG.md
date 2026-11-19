# Change log

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/contributing/index.html#contributing-change-log-label
-->

<!-- towncrier release notes start -->
## 1.0.0a1 (2026-11-19)

### Backend


#### Feature

- Added a single-state workflow for each content type: anyone with a certificate's address can view it, while search, navigation and listings show certificates to Managers only; certificate templates and their images are visible only to the people who manage them. @ericof [#2](https://github.com/collective/collective-certificates/issues/2)
- Stored the SHA-256 of each certificate's file when it is issued, in the new read-only `file_hash` field. The REST API gives it with the certificate, and `@certificate-verification` gives it as `file.sha256`; certificates issued before this change get the hash of their current file. @ericof [#3](https://github.com/collective/collective-certificates/issues/3)
- Added `create_certificate()` to render a certificate as PDF or PNG and store it at a Plone path, and the `@preview`, `@render`, `@validate-blueprint` and `@create-certificate` REST API services. @ericof 
- Added a configured certificate template, Starfleet Academy Certificate, to the example content profile: a Plone-branded background, a signature as an Image inside it, a design with the participant's name, the event, its dates and hours, the signer and the verification QR code, and sample data to preview it. @ericof 
- Added the Certificate Template content type: a folder with a background image and a design placing text, images and QR codes on the page, where the images, such as a signature or a logo, are Image items inside the template, with the bundled fonts Inter, EB Garamond and Caveat, and a date format chosen from the `collective.certificates.DateFormats` vocabulary. Saving a template checks its design against its fonts, fields and background, so a template can be created or imported with a design that uses images added inside it afterwards; those images are checked before a preview or a certificate. @ericof 
- Added the Certificate content type: `create_certificate()` now stores each issued certificate with the values it was rendered with, prints its own ID and verification URL (`{{ certificate_uid }}`, `{{ verification_url }}`, the site's `/verify/<uid>`), and anyone holding that ID can verify it through `@certificate-verification/<uid>` and download it from `@@certificate-file/<uid>`. @ericof 
- Added the `@certificates-csv` and `@create-certificates` REST services and `collective.certificates.api.batch.create_certificates()`: a CSV file with a `parent_container` column and one column per field creates one certificate per row, or none when any row is invalid, every issue listed by line and column; text damaged by a wrong encoding is refused. @ericof 
- Added the permissions `collective.certificates: Add CertificateTemplate` and `collective.certificates: Add Certificate`. No role has them after installing the add-on; the example content profile grants them to Manager. @ericof 


#### Documentation

- Described the package's features, supported versions and Python API in its README, with an English example and a link to the documentation at https://collective.github.io/collective-certificates/. @ericof 


#### Tests

- Added `contract-context.json` to the shared test fixtures: the fonts, fields, page and text sizes the frontend needs to reproduce the golden SVGs and the validation cases. @ericof 



### Frontend


#### Feature

- Improved the certificate designer: the toolbar now uses icon buttons, the properties panel is built from Volto's own form widgets, laid out like a block sidebar, and the elements list is reordered by dragging. Choosing a field in "Insert field" now inserts it right away. The template's sample data is now shown as a table and edited in a dialog with Volto's widgets. @ericof [#1](https://github.com/collective/collective-certificates/issues/1)
- Added a view for certificates, made for the person who receives one: a card with the issue date, a button to download the file, with its type and size, and a button to check that the certificate is valid; a table of the values printed on the certificate; and the file's SHA-256 fingerprint, with a button to copy it. The verification page now has the same layout and also shows the fingerprint. Certificates and certificate templates also got icons, shown wherever Volto lists content, such as the contents view, the object browser and relation fields. @ericof [#3](https://github.com/collective/collective-certificates/issues/3)
- Added CSV tools to the certificate template view, for users who can edit the template: a button downloads a CSV file with a row per certificate to fill in, and another button creates a certificate for each row of a CSV file, listing the certificates created, with links that open them inside the site, or the problems found in the file. A file with any problem creates no certificates. Files saved by spreadsheets in Windows-1252 keep their accented letters, and the downloaded file opens in Excel as UTF-8. @ericof 
- Added a view for certificate templates: it draws the certificate with the template's sample data and lists the images inside the template. In the designer, an image element now shows the background or any Image item inside the template, such as a signature or a logo. @ericof 
- Added the certificate designer: a full-screen editor in the template's edit form to place texts, images and the verification QR code on the background, with drag and resize, snapping guides, undo and redo, keyboard shortcuts, field placeholders, sample data and the server's preview. The blueprint is validated against the same rules as the server, and the stage draws the same SVG the server renders. A widget for the template's sample data is included, with translations in Brazilian Portuguese. @ericof 
- Added the certificate verification page at `/verify/<uid>`, the address printed on each certificate: it shows whether the certificate is valid, its title, issue date and values, and a link to download it. The designer and the template view now read the template's date format from its token. @ericof 


#### Documentation

- Described the add-on's installation, widgets and designer settings in the frontend README, with links to the documentation and to the add-on's Storybook at https://collective.github.io/collective-certificates/storybook/. @ericof 



### Project


#### Internal

- Listed the certificate workflows among the identifiers that agents and contributors must not rename. @ericof [#2](https://github.com/collective/collective-certificates/issues/2)
- Listed the certificate's `file_hash` field among the identifiers that agents and contributors must not rename. @ericof [#3](https://github.com/collective/collective-certificates/issues/3)
- Configured Dependabot to update the GitHub Actions and the documentation tools every week, with the labels that skip the changelog check. @ericof 
- Tested the backend on Python 3.11 to 3.14 with Plone 6.1 and 6.2, dropped Plone 6.0, and removed CI path filters for files that do not exist. @ericof 


#### Documentation

- Added a how-to guide for creating certificates from a CSV file, documented the two CSV services, and described which file encodings work. @ericof 
- Added the documentation: a tutorial for the first certificate template, how-to guides for installing, adding fonts, creating certificates from Python and over REST, verifying them and using the add-on from another add-on, reference pages for the blueprint (including when its images are checked), placeholder language, fields, REST and Python APIs and keyboard shortcuts, and an explanation of how rendering works. Added third-party notices for the bundled fonts and the vendored QR encoder, and contributor guidance in AGENTS.md. @ericof 
- Added the sample certificate, as PNG and PDF, to the documentation's static files; its QR code carries the certificate's verification URL. @ericof 
- Described the example certificate template in the installation guide, and added a step for the signature image to the tutorial. @ericof 
- Published the documentation on GitHub Pages at https://collective.github.io/collective-certificates/, with the add-on's Storybook under `storybook/` and the blueprint JSON Schema at the URL in its `$id`. @ericof 
- Rewrote the examples in English, in the docs and the READMEs, documented the verification page at /verify/<uid>, the date formats and the add permissions, and described the new backend layout in AGENTS.md. @ericof 



