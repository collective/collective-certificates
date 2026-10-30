# collective.certificates

Generate and store participation certificates for events, on Plone.

A certificate template is a background image with a design on top: text, image and QR code elements placed on the page.
Rendering the template with a participant's values produces a PDF or PNG certificate, which is stored with the values it was rendered with.
Each certificate prints its own UID and a verification URL, so anyone holding it can check it.

## ✨ Features

- **Certificate templates**: a background image sets the page size, and a JSON blueprint places text, image and QR code elements.
  The images, such as a signature or a logo, are Image items inside the template.
- **Rendering**: PDF or PNG output, from SVG rasterized with resvg, with the bundled fonts Inter, EB Garamond and Caveat.
  Extra fonts can be read from a directory set in the Plone registry.
- **Stored certificates**: each issued certificate keeps its file, the values it was rendered with and its template's UID.
- **Public verification**: certificates print the site's `/verify/<uid>`, a page of the Volto add-on.
  Behind it, `@certificate-verification/<uid>` describes a certificate and `@@certificate-file/<uid>` downloads it.
- **Permissions**: `collective.certificates: Add CertificateTemplate` and `collective.certificates: Add Certificate`, granted to no role by the install profile and to Manager by the example content profile.
- **Python API**: `collective.certificates.api.create_certificate()` issues a certificate from other add-ons.
- **REST API**: `@preview`, `@render`, `@validate-blueprint` and `@create-certificate` services on each template.
- **Volto integration**: the companion package `@plone-collective/volto-certificates` provides a designer for templates.
  Its widgets are registered under the names this package's schema uses.

## 🔧 Installation

Add `collective.certificates` to the dependencies in your project's `backend/pyproject.toml`, then install the backend with your project's make target.

```shell
make install
```

Then install the add-on in your Plone site, from the Add-ons control panel, using the profile "Attendance Certificates for Plone: Install".
Plone loads the package automatically, and the profile depends on `plone.volto`.

## 🧭 Supported versions

- Python 3.11, 3.12, 3.13 and 3.14.
- Plone 6.1 and 6.2.

## 🐍 Use from another add-on

```python
from collective.certificates.api import create_certificate

certificate = create_certificate(
    template,
    {"full_name": "Patrick Stewart", "event_name": "Star Trek: Picard"},
    "/events/plone-conference/certificates",
    format="pdf",
)
```

`template` is a `CertificateTemplate`.
The data must include every field token the blueprint uses, or `MissingFields` is raised.
The caller commits the transaction.

## 📚 Documentation and source

- [Documentation](https://collective.github.io/collective-certificates/)
- [Repository README](https://github.com/collective/collective-certificates/blob/main/README.md), for developers who want to contribute
- [Source code](https://github.com/collective/collective-certificates/)
- [Issue tracker](https://github.com/collective/collective-certificates/issues)

## 📄 License

The project is licensed under GPLv2.
See [LICENSE.md](https://github.com/collective/collective-certificates/blob/main/backend/LICENSE.md).

Bundled font licenses and third-party notices are listed in [THIRD_PARTY.md](https://github.com/collective/collective-certificates/blob/main/THIRD_PARTY.md).

## Credits and acknowledgements 🙏

Generated using [Cookieplone (2.0.2)](https://github.com/plone/cookieplone) and [cookieplone-templates (5443a7e)](https://github.com/plone/cookieplone-templates/commit/5443a7e62d92961adac49d7a705a18526b7e3037) on 2026-10-29 10:28:33.816739.
A special thanks to all contributors and supporters!
