# Third-party notices

This repository bundles two third-party components.
Everything else the packages use is installed from PyPI or npm and listed in `backend/pyproject.toml` and `frontend/packages/volto-certificates/package.json`; none of it is copied into this repository.

## Bundled fonts

The backend ships five font files, used by the renderer and by the designer's font picker.
They live in `backend/src/collective/certificates/fonts/files/`.

| Family | Files | Tokens | Version (name table) | Copyright notice |
| --- | --- | --- | --- | --- |
| Inter | `inter/inter.ttf`, `inter/inter-bold.ttf` | `inter`, `inter-bold` | 4.001;git-66647c0bb | Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter) |
| EB Garamond | `ebgaramond/eb-garamond.ttf`, `ebgaramond/eb-garamond-bold.ttf` | `eb-garamond`, `eb-garamond-bold` | 1.003 | Copyright 2017 The EB Garamond Project Authors (https://github.com/octaviopardo/EBGaramond12) |
| Caveat | `caveat/caveat.ttf` | `caveat` | 2.000 | Copyright 2014 The Caveat Project Authors (https://github.com/googlefonts/caveat) |

The copyright notices above are the ones at the top of each family's `OFL.txt`.
The name table of the Inter files reads "Copyright 2016" instead, which is worth knowing if the notice is copied from the font metadata.

**License:** SIL Open Font License, Version 1.1.
The full text of each license is in the `OFL.txt` file next to the font files (`inter/OFL.txt`, `ebgaramond/OFL.txt`, `caveat/OFL.txt`).

**Modified versions.**
These are not the upstream files.
Google Fonts publishes variable fonts only, so `backend/scripts/build_fonts.py` creates one static instance per token with fontTools' `instancer`, at the axis values listed below, and rewrites the font names.
The result is a Modified Version under the OFL.
None of the bundled `OFL.txt` files declares a Reserved Font Name, so the modified files may keep the family names.

| Token | Source file | Axis values |
| --- | --- | --- |
| `inter` | `Inter[opsz,wght].ttf` | `wght` 400, `opsz` 14 |
| `inter-bold` | `Inter[opsz,wght].ttf` | `wght` 700, `opsz` 14 |
| `eb-garamond` | `EBGaramond[wght].ttf` | `wght` 400 |
| `eb-garamond-bold` | `EBGaramond[wght].ttf` | `wght` 700 |
| `caveat` | `Caveat[wght].ttf` | `wght` 400 |

**Upstream source.**
The variable fonts come from the `ofl/` directory of [google/fonts](https://github.com/google/fonts) at commit `6157dfaa640ca5738b4d1a7070fe389c3036d7fc`, which `build_fonts.py` pins so that the output is reproducible.

## Vendored QR code encoder

`frontend/packages/volto-certificates/src/blueprint/qrcode.ts` is a port of the QR Code generator library by Project Nayuki.

- **Upstream:** [github.com/nayuki/QR-Code-generator](https://github.com/nayuki/QR-Code-generator), TypeScript library, commit `3c6d0b3cefb4e049dc337e82237c9644399716a8`.
- **Copyright:** Copyright (c) Project Nayuki.
- **License:** MIT.
  The license text is in the header comment of `qrcode.ts`, which is part of the vendored file.

**Changes from upstream.**
The port keeps byte mode with UTF-8 input and drops the error correction boost and the namespaced classes, in favor of plain functions.
Two further changes make it draw the same symbol as the backend encoder, which is `segno` (1.6.6 in the backend development environment), with `mode="byte"` and `boost_error=False`.
Any QR decoder reads the result the same way:

- **Padding.**
  When the bit stream is already byte-aligned after the terminator, a whole zero byte is added, as segno does.
- **Mask selection.**
  The mask is chosen with segno's penalty score, evaluated before the format and version information are drawn.
  Penalty rule N3 counts one hit per 1:1:3:1:1 pattern, and rule N4 is truncated as segno truncates it.

The backend does not vendor a QR encoder: `backend/src/collective/certificates/blueprint/qrcode.py` uses `segno` directly.
