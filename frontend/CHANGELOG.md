# Changelog

<!-- You should *NOT* be adding new change log entries to this file.
     You should create a file in the news directory instead.
     For helpful instructions, please see:
     https://6.docs.plone.org/contributing/index.html#contributing-change-log-label
-->

<!-- towncrier release notes start -->

## 1.0.0-alpha.1 (2026-11-19)


### Feature

- Improved the certificate designer: the toolbar now uses icon buttons, the properties panel is built from Volto's own form widgets, laid out like a block sidebar, and the elements list is reordered by dragging. Choosing a field in "Insert field" now inserts it right away. The template's sample data is now shown as a table and edited in a dialog with Volto's widgets. @ericof [#1](https://github.com/collective/collective-certificates/issues/1)
- Added a view for certificates, made for the person who receives one: a card with the issue date, a button to download the file, with its type and size, and a button to check that the certificate is valid; a table of the values printed on the certificate; and the file's SHA-256 fingerprint, with a button to copy it. The verification page now has the same layout and also shows the fingerprint. Certificates and certificate templates also got icons, shown wherever Volto lists content, such as the contents view, the object browser and relation fields. @ericof [#3](https://github.com/collective/collective-certificates/issues/3)
- Added CSV tools to the certificate template view, for users who can edit the template: a button downloads a CSV file with a row per certificate to fill in, and another button creates a certificate for each row of a CSV file, listing the certificates created, with links that open them inside the site, or the problems found in the file. A file with any problem creates no certificates. Files saved by spreadsheets in Windows-1252 keep their accented letters, and the downloaded file opens in Excel as UTF-8. @ericof 
- Added a view for certificate templates: it draws the certificate with the template's sample data and lists the images inside the template. In the designer, an image element now shows the background or any Image item inside the template, such as a signature or a logo. @ericof 
- Added the certificate designer: a full-screen editor in the template's edit form to place texts, images and the verification QR code on the background, with drag and resize, snapping guides, undo and redo, keyboard shortcuts, field placeholders, sample data and the server's preview. The blueprint is validated against the same rules as the server, and the stage draws the same SVG the server renders. A widget for the template's sample data is included, with translations in Brazilian Portuguese. @ericof 
- Added the certificate verification page at `/verify/<uid>`, the address printed on each certificate: it shows whether the certificate is valid, its title, issue date and values, and a link to download it. The designer and the template view now read the template's date format from its token. @ericof 


### Documentation

- Described the add-on's installation, widgets and designer settings in the frontend README, with links to the documentation and to the add-on's Storybook at https://collective.github.io/collective-certificates/storybook/. @ericof
