---
myst:
  html_meta:
    "description": "Generate and store participation certificates for events."
    "property=og:description": "Generate and store participation certificates for events."
    "property=og:title": "Attendance Certificates for Plone"
    "keywords": "Attendance Certificates for Plone, documentation, Generate and store participation certificates for events."
---

# Attendance Certificates for Plone

Generate and store participation certificates for events.

Attendance Certificates for Plone lets you design a {term}`certificate template` over a background image, and then create a {term}`certificate` for each attendee.
Each certificate is stored in Plone with its file and its values, and carries a QR code that leads to its verification.

You design a template in a full-screen designer in Volto, by placing {term}`elements <element>` over the background.
Elements draw text with placeholders such as `{{ full_name }}`, images, and QR codes.
You can create certificates from the REST API, or from Python code in your own add-on.

The documentation is structured following the [Diátaxis](https://diataxis.fr/) documentation framework.

````{grid} 1 1 2 2
:gutter: 3

```{grid-item-card} 🎓 Tutorials
:link: tutorials/index
:link-type: doc

Design a template and create your first certificate.
```

```{grid-item-card} 🛠️ How-to guides
:link: how-to-guides/index
:link-type: doc

Install the add-on, add a font, create certificates, and verify them.
```

```{grid-item-card} 📚 Reference
:link: reference/index
:link-type: doc

The blueprint format, the placeholder language, the fields, the REST API, the Python API and the keyboard shortcuts.
```

```{grid-item-card} 💡 Concepts
:link: concepts/index
:link-type: doc

How a certificate is drawn, and how verification works.
```

````

```{toctree}
:caption: Tutorials
:maxdepth: 2
:hidden: true

tutorials/index
```

```{toctree}
:caption: How to guides
:maxdepth: 2
:hidden: true

how-to-guides/index
```

```{toctree}
:caption: Reference
:maxdepth: 2
:hidden: true

reference/index
```

```{toctree}
:caption: Concepts
:maxdepth: 2
:hidden: true

concepts/index
```

```{toctree}
:caption: Appendices
:maxdepth: 2
:hidden: true

glossary
genindex
```
