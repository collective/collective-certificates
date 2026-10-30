---
myst:
  html_meta:
    "description": "Attendance Certificates for Plone how-to guides"
    "property=og:description": "Attendance Certificates for Plone how-to guides"
    "property=og:title": "Attendance Certificates for Plone how-to guides"
    "keywords": "Plone, Attendance Certificates for Plone, how-to, guides"
---

(how-to-guides-index)=

# How-to guides

This part of the documentation contains how-to guides, including installation and usage.

> How-to guides are directions that guide the reader through a problem or towards a result.
> How-to guides are goal-oriented.

````{grid} 1 1 2 2
:gutter: 3

```{grid-item-card} 📦 Install
:link: install
:link-type: doc

Add the add-on to a Plone 6 backend and a Volto 19 frontend, and grant the permissions to add certificates.
```

```{grid-item-card} 🔤 Add a font
:link: add-a-font
:link-type: doc

Use your own fonts in templates, from an extra font directory.
```

```{grid-item-card} 🐍 Create certificates from Python
:link: create-certificates-from-python
:link-type: doc

Issue certificates with `create_certificate`, from a script or the Plone console.
```

```{grid-item-card} 📄 Create certificates from a CSV file
:link: create-certificates-from-csv
:link-type: doc

Issue the certificates of a whole event at once, from a spreadsheet with one participant per row.
```

```{grid-item-card} 🌐 Create certificates over REST
:link: create-certificates-over-rest
:link-type: doc

Preview a template, validate a blueprint, and create or render certificates over HTTP.
```

```{grid-item-card} ✅ Verify a certificate
:link: verify-a-certificate
:link-type: doc

Check an issued certificate on its verification page, and set the site URL its QR code points to.
```

```{grid-item-card} 🧩 Use with another add-on
:link: use-with-another-add-on
:link-type: doc

Issue certificates automatically from your own add-on, such as an event add-on.
```

````

```{toctree}
:maxdepth: 1
:hidden: true

install
add-a-font
create-certificates-from-python
create-certificates-from-csv
create-certificates-over-rest
verify-a-certificate
use-with-another-add-on
```
