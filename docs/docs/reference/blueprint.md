---
myst:
  html_meta:
    "description": "Reference of the certificate blueprint: its elements and their properties."
    "property=og:description": "Reference of the certificate blueprint: its elements and their properties."
    "property=og:title": "Blueprint reference"
    "keywords": "Plone, Attendance Certificates for Plone, blueprint, element, reference"
---

(reference-blueprint)=

# Blueprint

A {term}`blueprint` is a JSON document that places {term}`elements <element>` on the page of a certificate template.
<!-- source: backend/src/collective/certificates/blueprint/schema.json -->

The normative definition is the JSON Schema in `backend/src/collective/certificates/blueprint/schema.json`, also shipped as `packages/volto-certificates/src/blueprint/schema.json` in the frontend.
Both copies are byte-identical.
<!-- source: backend/src/collective/certificates/blueprint/schema.json -->

The schema defines no default values.
Where a property is optional, the last column says what happens when it is absent.

## Document

| Property | Type | Constraints | Default |
| --- | --- | --- | --- |
| `version` | integer | Required. Must be `1`. | None; required |
| `page` | object | Required. See [page](#page). | None; required |
| `elements` | array | Required. At most 100 items, each an [element](#elements). Drawn in order, so later elements are on top. | None; required |

No other top-level property is allowed.
<!-- source: backend/src/collective/certificates/blueprint/schema.json -->

A new template starts with the page size of an A4 landscape sheet at 300 dpi, `3508` by `2480`, and no elements.
<!-- source: backend/src/collective/certificates/blueprint/model.py -->

(page)=

## Page

| Property | Type | Constraints | Default |
| --- | --- | --- | --- |
| `width` | integer | Required. From 1 to 20000 pixels. | None; required |
| `height` | integer | Required. From 1 to 20000 pixels. | None; required |

The page size equals the pixel size of the background image.
Saving a template with a new background resets the page to match it, and element positions are left alone.
<!-- source: backend/src/collective/certificates/subscribers/page_sync.py -->

(elements)=

## Elements

Every element has an `id`, a `type`, and the properties of its type.
Ids are unique within a blueprint.

| Property | Type | Constraints | Default |
| --- | --- | --- | --- |
| `id` | string | Required. Matches `^[a-z][a-z0-9_-]{0,31}$`. Unique in the blueprint. | None; required |
| `type` | string | Required. One of `text`, `image`, `qrcode`. | None; required |

<!-- source: backend/src/collective/certificates/blueprint/schema.json -->

### Text elements

A text element draws one line of text.
Its `(x, y)` is the anchor point, so `anchor` and `baseline` decide where the text sits around it.

| Property | Type | Constraints | Default |
| --- | --- | --- | --- |
| `id` | string | Required. See [elements](#elements). | None; required |
| `type` | string | Required. Must be `text`. | None; required |
| `x` | integer | Required. From 0 to 20000. | None; required |
| `y` | integer | Required. From 0 to 20000. | None; required |
| `anchor` | string | Required. `start`, `middle` or `end`. | None; required |
| `baseline` | string | Required. `alphabetic`, `middle` or `hanging`. | None; required |
| `font` | string | Required. A font token, matching `^[a-z0-9][a-z0-9-]{0,63}$`. Must be in the Fonts vocabulary. | None; required |
| `size` | integer | Required. Font size in page pixels, from 1 to 2000. | None; required |
| `color` | string | Required. `#` followed by six lowercase hexadecimal digits, such as `#1b1b1b`. | None; required |
| `content` | string | Required. From 1 to 500 characters. May hold [placeholders](placeholder-language.md). | None; required |
| `max_width` | integer | Optional. From 1 to 20000 pixels. | Not set: no width limit |
| `fit` | string | Optional. `none` or `shrink`. | Not set: behaves as `none` |
| `rotation` | integer | Optional. Must be `0`. | Not set |

With `fit` set to `shrink` and `max_width` set, the size is lowered until the rendered text is at most `max_width` wide.
The size never goes above `size`.
Without `max_width`, `shrink` changes nothing.
<!-- source: backend/src/collective/certificates/utils/rendering.py -->
<!-- source: backend/src/collective/certificates/blueprint/metrics.py -->

### Image elements

An image element draws one of the template's images, fitted inside its box: the background, or an **Image** item inside the template.

| Property | Type | Constraints | Default |
| --- | --- | --- | --- |
| `id` | string | Required. See [elements](#elements). | None; required |
| `type` | string | Required. Must be `image`. | None; required |
| `x` | integer | Required. From 0 to 20000. | None; required |
| `y` | integer | Required. From 0 to 20000. | None; required |
| `width` | integer | Required. From 1 to 20000 pixels. | None; required |
| `height` | integer | Required. From 1 to 20000 pixels. | None; required |
| `asset` | string | Required. `background`, or the short name of an **Image** item inside the template. Letters, digits, `.`, `_` and `-`, starting with a letter or a digit, up to 100 characters. | None; required |
| `rotation` | integer | Optional. Must be `0`. | Not set |

The image is drawn with `preserveAspectRatio="xMidYMid meet"`, so it keeps its proportions inside the box.
<!-- source: backend/src/collective/certificates/blueprint/svg.py -->

An image element whose `asset` names no image is not drawn when rendering.
Validation reports it as an error ("the template has no ... image") when the template is checked against its images: by the designer's {guilabel}`Apply`, `@validate-blueprint`, `@preview`, `@render` and `@create-certificate`.
Saving the template checks only `background`, because a template is saved before anything can be added inside it.
<!-- source: backend/src/collective/certificates/blueprint/validate.py -->
<!-- source: backend/src/collective/certificates/content/template.py -->

### QR code elements

A QR code element draws a square QR code that encodes its `content` after placeholders are filled in.

| Property | Type | Constraints | Default |
| --- | --- | --- | --- |
| `id` | string | Required. See [elements](#elements). | None; required |
| `type` | string | Required. Must be `qrcode`. | None; required |
| `x` | integer | Required. From 0 to 20000. | None; required |
| `y` | integer | Required. From 0 to 20000. | None; required |
| `size` | integer | Required. Side of the square, from 1 to 20000 pixels. | None; required |
| `content` | string | Required. From 1 to 500 characters. May hold [placeholders](placeholder-language.md). | None; required |
| `ec` | string | Required. Error correction: `L`, `M`, `Q` or `H`. | None; required |
| `fg` | string | Required. Dark modules, as a `#rrggbb` color. | None; required |
| `bg` | string | Required. Background of the square, as a `#rrggbb` color. | None; required |
| `rotation` | integer | Optional. Must be `0`. | Not set |

The encoder uses byte mode in UTF-8 and keeps the requested error correction level, without raising it when a larger symbol would fit.
<!-- source: backend/src/collective/certificates/blueprint/qrcode.py -->

## Rotation

`rotation` appears in the schema on every element, but only `0` is valid.
Version 1 does not support rotation.
<!-- source: backend/src/collective/certificates/blueprint/schema.json -->

## Related

- [Placeholder language](placeholder-language.md), for the text and QR content of elements.
- [Fields](fields.md), for the tokens a placeholder can use.
- [Your first certificate template](../tutorials/your-first-certificate-template.md), to build a blueprint with the designer.
