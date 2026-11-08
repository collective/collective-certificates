# Guidance for coding agents and contributors

This repository is a monorepo with two packages that must stay in step:

- `backend/`: the Python package `collective.certificates`, a Plone 6 add-on (Plone 6.1 and 6.2, Python 3.11 to 3.14).
- `frontend/packages/volto-certificates/`: the Volto 19 add-on `@plone-collective/volto-certificates`.

`frontend/` also holds a development Volto project.
`frontend/core/` is a checkout of Volto itself, fetched by `make install`, git-ignored, and not ours: do not edit it, format it or send changes to it.

`docs/` is maintained separately; do not change it as part of other work.

## The shared contract

The backend is the source of truth for everything the two sides must agree on: the blueprint schema, the golden SVGs, the QR and template vectors, and the contract context the frontend needs to reproduce the renderer.

To change the contract:

1. Edit the schema in the backend first: `backend/src/collective/certificates/blueprint/schema.json`.
2. Regenerate the fixtures from the backend.
   From `backend/`, run `.venv/bin/python scripts/update_fixtures.py` and review the diff.
   The script rewrites `backend/tests/_resources/` and also writes `docs/docs/_static/sample.png` and `sample.pdf`.
3. Copy the fixtures into the frontend.
   From `frontend/`, run `make fixtures`.
   It copies the schema to `frontend/packages/volto-certificates/src/blueprint/schema.json` and the test vectors to `frontend/packages/volto-certificates/__fixtures__/`.
4. Run both suites (`make test` at the repository root).
   Both must pass.

Never edit the copied files in the frontend by hand; they are overwritten by `make fixtures`.

## Frozen identifiers

These names are part of the contract between the packages and with existing sites.
Renaming one is a breaking change, so treat it as one (see [News fragments](#news-fragments)).

Backend (Plone):

- Portal types: `CertificateTemplate` and `Certificate`.
- Content schemas: `ICertificateTemplate` and `ICertificate`.
- Blueprint widgets named in the schema: `certificate_blueprint` and `certificate_sample_data`.
- REST services on a template: `@preview`, `@render`, `@validate-blueprint`, `@create-certificate`, `@certificates-csv`, `@create-certificates`.
- CSV column `parent_container` (`collective/certificates/api/batch.py`); the other columns are the field tokens.
  Public service: `@certificate-verification`.
- Browser views: `@@certificate-file` (download by UID) and `@@certificate-font` (font files for `@font-face`).
- Vocabularies: `collective.certificates.Fonts`, `collective.certificates.Fields`, `collective.certificates.FieldKinds`, `collective.certificates.DateFormats`, `collective.certificates.QrErrorCorrection`.
- Date format tokens (`collective/certificates/blueprint/dateformats.py`), stored in a template's `date_format`: `day-month-year`, `month-day-year`, `iso`, `long`, `long-day-first`.
- Workflows: `certificate_workflow` (state `issued`) for `Certificate` and `certificate_template_workflow` (state `internal`) for `CertificateTemplate`.
  The catalog indexes a certificate for Manager only (`collective/certificates/content/indexers.py`), so anyone can view one at its address but only Managers find it in listings.
- Add permissions: `collective.certificates.AddCertificateTemplate` and `collective.certificates.AddCertificate`.
  The install profile grants them to no role; the example content profile grants them to Manager.
- Registry prefix `collective.certificates`, with the records `extra_font_dir` and `pdf_dpi`.
- Field tokens (`collective/certificates/blueprint/fields.py`): `full_name`, `event_name`, `event_start_date`, `event_end_date`, `responsible_person`, `total_hours`, and the computed `certificate_uid` and `verification_url`.
- Font tokens (`fonts/registry.py`): `inter`, `inter-bold`, `eb-garamond`, `eb-garamond-bold`, `caveat`.
- Python API: `collective.certificates.api.create_certificate` and `collective.certificates.api.batch.create_certificates`.
- Verification URL: `<site URL>/verify/<uid>`, printed as `{{ verification_url }}` (`collective/certificates/utils/verification.py`).
- Profiles: `collective.certificates:default` and `collective.certificates:initial` (example content).

Frontend:

- Widgets (`src/config/widgets.ts`): `certificate_blueprint` and `certificate_sample_data`.
- Redux slice: `certificates` (`src/config/reducers.ts`), with the action types `GET_CERTIFICATE_VOCABULARIES`, `VALIDATE_BLUEPRINT` and `GET_CERTIFICATE_VERIFICATION` (`src/actions/certificates.ts`).
- Route: `/verify/:uid` (`src/config/routes.ts`), the verification page printed on certificates.
- Date formats (`src/blueprint/dateFormats.ts`): the same tokens and patterns as the backend, checked against the contract context.
- Settings: `config.settings.certificates.designer` (`src/config/settings.ts`).
- Package name: `@plone-collective/volto-certificates`; entry point `src/index.ts`, which exports `applyConfig`.

## Dependencies and sources

- Backend Python dependencies are declared in `backend/pyproject.toml`.
  The backend Makefile installs them with uv and mxdev, from `mx.ini` and the Plone constraints file.
- Frontend packages use pnpm only (`preinstall` enforces it).
  The Volto version is pinned in `frontend/mrs.developer.json`.
- Bundled fonts and the vendored QR encoder have their own licenses and notices.
  Read [THIRD_PARTY.md](THIRD_PARTY.md) before changing either.

## Make targets

Run these from the repository root unless noted.
Use the make targets; do not call the underlying tools directly.

| Task | Root | Backend (`backend/`) | Frontend (`frontend/`) |
| --- | --- | --- | --- |
| Install | `make install` | `make install` | `make install` |
| Start | `make backend-start`, `make frontend-start` | `make start` | `make start` |
| Lint | `make lint` | `make lint`, `make typecheck`, `make check-pragmas` | `make lint` |
| Format | `make format` | `make format` | `make format` |
| Test | `make test` | `make test`, `make test-coverage` | `make test` |
| Translations | `make i18n` | `make i18n` | `make i18n` |
| Shared fixtures | | | `make fixtures` |

`make check` at the root runs `make format` and `make lint`.

Backend tests run with coverage enforced at 100 percent, branch coverage included.
Every coverage pragma needs a reason on the same line, which `make check-pragmas` checks.

## Code conventions

- Backend modules live in subpackages of `collective/certificates/`; do not add Python modules to the package root beyond `__init__.py`, `interfaces.py` and `testing.py`.
  Each REST service has its own folder under `services/`, with its `configure.zcml` and a `get.py` or `post.py`.
  Do not keep empty boilerplate packages.
- Backend Python has type hints on every function (mypy runs with `disallow_untyped_defs`).
  Docstrings use reStructuredText (`:param:`, `:returns:`, `:raises:`).
- User-facing strings are translated with `_()` in the backend and with the message catalogs in the frontend.
  Identifiers are in English.
- Locales are generated with `make i18n`; the message catalogs are in `backend/src/collective/certificates/locales/` and `frontend/packages/volto-certificates/locales/`.

## News fragments

Each package has its own towncrier configuration and news folder.
CI checks each one when its files change, so a change to a package needs a fragment in that package's folder:

- `news/`: the repository (`towncrier.toml` at the root).
- `backend/news/`: the backend (`backend/pyproject.toml`).
- `frontend/packages/volto-certificates/news/`: the frontend (`frontend/packages/volto-certificates/towncrier.toml`).

Name a fragment `+<short-slug>.<type>`.
The `+` prefix means there is no issue number.
Types are `breaking`, `feature`, `bugfix`, `internal`, `documentation` and `tests`.
Write the text for the user of the add-on, in the past tense, and end it with the author's handle.

A change to a frozen identifier or to the shared contract is a `breaking` change.
