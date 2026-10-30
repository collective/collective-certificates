---
myst:
  html_meta:
    "description": "Keyboard shortcuts of the certificate designer."
    "property=og:description": "Keyboard shortcuts of the certificate designer."
    "property=og:title": "Keyboard shortcuts"
    "keywords": "Plone, Attendance Certificates for Plone, designer, keyboard, shortcuts, reference"
---

(reference-keyboard-shortcuts)=

# Keyboard shortcuts

The [designer](../tutorials/your-first-certificate-template.md) listens to these keys while it is open.
On macOS, `Cmd` works where `Ctrl` is listed.
<!-- source: frontend/packages/volto-certificates/src/helpers/keyboard.ts -->

| Keys | Action |
| --- | --- |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+D` | Duplicate the selected element |
| `Delete` or `Backspace` | Delete the selected element |
| `Escape` | Close the designer. Asks for confirmation when there are unsaved changes. |
| `+` or `=` | Zoom in |
| `-` | Zoom out |
| Arrow keys | Move the selected element by 1 page pixel |
| `Shift` + arrow keys | Move the selected element by 10 page pixels |

<!-- source: frontend/packages/volto-certificates/src/helpers/keyboard.ts -->
<!-- source: frontend/packages/volto-certificates/src/components/Designer/Designer.tsx -->

Notes:

- Keys typed into a field, such as the content of a text element, are not taken by the designer.
- Movement and deletion act on the selected element.
  Without a selection, arrow keys do nothing.
- The zoom levels the `+` and `-` keys step through, and the snapping distance, come from the designer settings: `zoomSteps`, `nudgeStep` (1 by default) and `snapTolerance` (10 by default).
  They are read from the frontend configuration at `config.settings.certificates.designer`.
<!-- source: frontend/packages/volto-certificates/src/config/settings.ts -->

## Related

- [Your first certificate template](../tutorials/your-first-certificate-template.md), for the designer in use.
- [Blueprint](blueprint.md), for the properties the designer edits.
