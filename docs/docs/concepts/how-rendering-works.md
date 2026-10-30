---
myst:
  html_meta:
    "description": "How a certificate is drawn: the SVG shared by the designer and the server, the fidelity limits, and why verification uses a capability URL."
    "property=og:description": "How a certificate is drawn: the SVG shared by the designer and the server, the fidelity limits, and why verification uses a capability URL."
    "property=og:title": "How rendering works"
    "keywords": "Plone, Attendance Certificates for Plone, rendering, SVG, fidelity, verification, concepts"
---

(concepts-how-rendering-works)=

# How rendering works

A certificate is the result of three steps: a {term}`blueprint` is turned into SVG, the SVG is turned into a PNG image, and the PNG is either kept as it is or wrapped in a one-page PDF.
<!-- source: backend/src/collective/certificates/utils/rendering.py -->

```{mermaid}
flowchart LR
    B[Blueprint and field values] --> S[SVG]
    S --> P[PNG, rendered by resvg]
    P -->|format png| R[PNG file]
    P -->|format pdf| D[PDF with one page]
```

## One SVG, two renderers

The server and the designer both produce the same SVG from the same blueprint.
The format is fixed: one element per line, every number an integer, attributes in a fixed order, and text escaped.
This is what makes the designer's preview a faithful picture of the certificate.
<!-- source: backend/src/collective/certificates/blueprint/svg.py -->
<!-- source: frontend/packages/volto-certificates/src/blueprint/svg.ts -->

The two sides are tested against the same fixtures.
The SVG output is compared with the same expected files, and the QR code encoder is checked against the same test vectors, so both sides draw the same QR symbol for the same text.
<!-- source: backend/tests/_resources/expected-svg -->
<!-- source: backend/tests/_resources/qr-vectors.json -->
<!-- source: frontend/packages/volto-certificates/__fixtures__/qr-vectors.json -->

The server turns the SVG into a PNG with `resvg`, and loads only the fonts it is given, so the output does not depend on the fonts installed on the machine.
<!-- source: backend/src/collective/certificates/blueprint/raster.py -->

## Where the two sides differ

Text size is the one place where the designer and the server measure differently.

- The server measures text with the advance widths of the font file, read with `fontTools`.
  Kerning and shaping are not applied.
- The designer measures text with the browser's canvas, once the font has loaded.

For text with `fit` set to `shrink`, the two measurements can give slightly different sizes.
The size the server computes is the one that ends up in the certificate, so the server preview is the one to trust.
<!-- source: backend/src/collective/certificates/blueprint/metrics.py -->
<!-- source: frontend/packages/volto-certificates/src/blueprint/metrics.ts -->

## Fidelity limits

These limits follow from the model, not from a bug.

- **No kerning control.** Glyphs are placed by their advance widths, so pairs of letters are not kerned.
  The schema has no property for kerning.
- **One line per text element.** A text element draws one line.
  Long text is shrunk with `fit` or wrapped by you, into several elements.
- **No rotation.** `rotation` must be `0` in version 1.
- **The PDF holds a picture.** The PDF embeds the PNG as its only page, so text is not vector.
  Its resolution is set in dots per inch by the `pdf_dpi` registry record, which defaults to 300.
- **Fonts are the files you give.** Only the bundled fonts and the extra font directory are used.
<!-- source: backend/src/collective/certificates/blueprint/schema.json -->
<!-- source: backend/src/collective/certificates/blueprint/raster.py -->
<!-- source: backend/src/collective/certificates/interfaces.py -->

## Images and the page

The background is drawn stretched to the page, because the page takes the size of the background.
Image elements keep their proportions inside their boxes.
<!-- source: backend/src/collective/certificates/blueprint/svg.py -->

## Computed values

Two values are computed when a certificate is created: its UID, and the verification address, which is the site URL followed by `/verify/<uid>`.
The UID is created with the item, and only then is the file rendered, so the printed UID is the one the certificate has.
<!-- source: backend/src/collective/certificates/api/__init__.py -->

Previews and `@render` use sample values for them instead, so their output cannot be checked against a stored certificate.
<!-- source: backend/src/collective/certificates/utils/rendering.py -->

## Why verification is a capability URL

A certificate's UID is 128 random bits.
Holding the UID is what grants access to the certificate's summary and file, whatever the workflow state of the item.
The verification service does not check permissions, and the file view does not either.
<!-- source: backend/src/collective/certificates/utils/verification.py -->
<!-- source: backend/src/collective/certificates/services/certificate_verification/get.py -->
<!-- source: backend/src/collective/certificates/browser/file.py -->

This is a deliberate trade-off.
A certificate has to be verifiable by anyone who scans it, including people with no account on the site, so there is no login to ask for.
The price is that the UID is a secret in the same way a link is: whoever has the UID can see the certificate and its values, and the add-on has no way to revoke access yet.
<!-- source: backend/src/collective/certificates/utils/verification.py -->

## Related

- [Blueprint](../reference/blueprint.md), for the document both renderers read.
- [Add a font](../how-to-guides/add-a-font.md), for how fonts reach the designer and the server.
- [Verify a certificate](../how-to-guides/verify-a-certificate.md), for the verification URL in practice.
