---
myst:
  html_meta:
    "description": "Terms and definitions used throughout the Attendance Certificates for Plone documentation."
    "property=og:description": "Terms and definitions used throughout the Attendance Certificates for Plone documentation."
    "property=og:title": "Glossary"
    "keywords": "Plone, Attendance Certificates for Plone, glossary, term, definition"
---

(glossary-label)=

# Glossary

This glossary defines the terms used in the **Attendance Certificates for Plone** documentation.

```{glossary}
:sorted: true

blueprint
    The layout of a certificate: a JSON document with the page size and the list of {term}`elements <element>` drawn over the background, in order.
    The format is defined by a JSON Schema, see the [blueprint reference](reference/blueprint.md).

certificate
    An issued certificate: a `Certificate` item that stores the rendered file, the values it was rendered with, and the UID of the template it came from.
    Its UID is printed on it through the {term}`verification URL`.

certificate template
    A `CertificateTemplate` item: a background image, a {term}`blueprint`, sample data and a date format.
    The images its design shows, such as a signature or a logo, are **Image** items inside it.
    Certificates are created from a template.

element
    One item of a {term}`blueprint`.
    An element is a text line, an image, or a QR code, and has a position on the page.

filter
    A transformation applied to a field value inside a {term}`placeholder`, written after a vertical bar, such as `upper`, `lower` or `date`.

placeholder
    Text between double braces, `{{ token }}` or `{{ token|filter }}`, that is replaced by a field value when a certificate is rendered.

token
    The name of a certificate field, as used in a {term}`placeholder`, such as `full_name`.
    A font is also known by a token, its file name made into a short identifier.

verification URL
    The address encoded in the QR code of a certificate: the site URL followed by `/verify/<uid>`, with the certificate's UID.
    The site URL is the `VOLTO_FRONTEND_DOMAIN` environment variable when it is set, and the URL of the Plone site otherwise.

Plone
    [Plone](https://plone.org/) is an open-source content management system that is used to create, edit, and manage digital content, like websites, intranets and custom solutions.
    It comes with over 20 years of growth, optimizations, and refinements.
    The result is a system trusted by governments, universities, businesses, and other organizations all over the world.

add-on
    An add-on in Plone extends its functionality.
    It is code that is released as a package to make it easier to install.

    In Volto, an add-on is a JavaScript package.

    In Plone core, an add-on is a Python package.

    -   [Plone core add-ons](https://github.com/collective/awesome-plone#readme)
    -   [Volto add-ons](https://github.com/collective/awesome-volto#readme)
    -   [Add-ons tagged with the trove classifier `Framework :: Plone` on PyPI](https://pypi.org/search/?c=Framework+%3A%3A+Plone)

```
