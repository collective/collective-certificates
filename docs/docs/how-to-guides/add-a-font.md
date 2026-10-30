---
myst:
  html_meta:
    "description": "Add your own fonts to certificate templates with an extra font directory."
    "property=og:description": "Add your own fonts to certificate templates with an extra font directory."
    "property=og:title": "Add a font"
    "keywords": "Plone, Attendance Certificates for Plone, fonts, registry, how-to"
---

(how-to-add-a-font)=

# Add a font

Certificates can use the bundled fonts, and any `.ttf` or `.otf` file in an extra font directory.
This guide adds such a directory.
<!-- source: backend/src/collective/certificates/fonts/registry.py -->

The bundled fonts are Inter and Inter Bold, EB Garamond and EB Garamond Bold, and Caveat.
<!-- source: backend/src/collective/certificates/fonts/registry.py -->

## 1. Put the font files in a directory

Create a directory that the Plone server can read, and copy the font files into it.
Use a static font for each style and weight, because each file becomes one token and a token has one weight and one style.
<!-- source: backend/src/collective/certificates/fonts/registry.py -->

## 2. Set the registry record

Set the record `collective.certificates.extra_font_dir` to the absolute path of the directory.
The record is an absolute path, not a relative one, and it is ignored when it is empty or is not a directory.
<!-- source: backend/src/collective/certificates/interfaces.py -->
<!-- source: backend/src/collective/certificates/fonts/registry.py -->

Records of this add-on are stored in the Plone registry under the prefix `collective.certificates`.
Set the value in the registry of your site, for example with a GenericSetup registry file in your own add-on.

## 3. Use the font

Each file gets a token made from its file name, without the extension, in lowercase, with runs of other characters replaced by dashes.
For example, `Display Bold.otf` gets the token `display-bold`.
The title shown in the designer is the font's full name from its `name` table, or the file name when the font cannot be read.
<!-- source: backend/src/collective/certificates/fonts/registry.py -->

A file is skipped when its token is already used by a bundled font, or by another file of the directory.
When two files give the same token, the first one in sorted file name order is kept.
<!-- source: backend/src/collective/certificates/fonts/registry.py -->

The fonts list is read each time it is needed, so you do not need to restart the server after adding a file.
<!-- source: backend/src/collective/certificates/fonts/registry.py -->

In the designer, the font appears in the **Font** list of a text element.
A blueprint that names a font token which does not exist fails validation with an unknown font message.
<!-- source: backend/src/collective/certificates/blueprint/validate.py -->

## How the font reaches the browser and the renderer

The designer loads each font through the `@@certificate-font/<token>` view, which serves only files inside the bundled directory or the extra directory.
<!-- source: backend/src/collective/certificates/fonts/view.py -->

When rendering, the add-on copies each font, renames its family to the token, and caches the copy in the temporary directory of the server.
The renderer uses only the fonts it is given, not the fonts installed on the system.
<!-- source: backend/src/collective/certificates/fonts/registry.py -->
<!-- source: backend/src/collective/certificates/blueprint/raster.py -->

## Related

- [Blueprint](../reference/blueprint.md), for the `font` property of text elements.
- [How rendering works](../concepts/how-rendering-works.md), for where the designer and the server can differ.
