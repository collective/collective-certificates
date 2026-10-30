# Attendance Certificates for Plone (@plone-collective/volto-certificates)

Generate and store participation certificates for events.

[![npm](https://img.shields.io/npm/v/@plone-collective/volto-certificates)](https://www.npmjs.com/package/@plone-collective/volto-certificates)
[![](https://img.shields.io/badge/-Storybook-ff4785?logo=Storybook&logoColor=white&style=flat-square)](https://collective.github.io/collective-certificates/storybook/)
[![CI](https://github.com/collective/collective-certificates/actions/workflows/main.yml/badge.svg)](https://github.com/collective/collective-certificates/actions/workflows/main.yml)

This Volto add-on is the frontend of the certificates system.
It needs the backend package [`collective.certificates`](https://pypi.org/project/collective.certificates/), which provides the content types and the REST services it talks to.
The documentation is at https://collective.github.io/collective-certificates/.

## ✨ Features

- **Designer widget** (`certificate_blueprint`): a full-screen editor in the certificate template's edit form.
  It places text, image and QR code elements on the background, with drag and resize, snapping guides, undo and redo, keyboard shortcuts and the server's preview.
  An image element shows the background or an Image item inside the template, such as a signature or a logo.
- **Template view**: the view of a `CertificateTemplate`, which draws the certificate with its sample data and lists the template's images.
- **Verification page** (`/verify/<uid>`): the address printed on each certificate.
  It shows whether the certificate is valid, its title, issue date and values, and a link to download it.
- **Sample data widget** (`certificate_sample_data`): edits the sample field values used by the designer and the preview.
- **`certificates` reducer**: holds the fonts, fields, field kinds and QR error correction levels from the backend's vocabularies, the result of the last blueprint validation, and the last certificate verification.
- **Designer settings**: `settings.certificates.designer`, described below.

The widgets are registered under the names the backend's `CertificateTemplate` schema uses.
The stage draws the same SVG the server renders.

## 🔧 Installation

This add-on works with Volto 19 and a Plone backend with `collective.certificates` installed.

Add the add-on to your project's policy package, the package under `packages/` that holds your project's Volto configuration.
Add `@plone-collective/volto-certificates` to its `dependencies`, and to the `addons` array of its `package.json`.

```json
"dependencies": {
    "@plone-collective/volto-certificates": "*"
},
"addons": [
    "@plone-collective/volto-certificates"
]
```

Install the dependencies and start Volto with your project's make targets.

```shell
make install
make start
```

The add-on does not provide a Volto theme.

## ⚙️ Settings

The designer reads its settings from `config.settings.certificates.designer`.
Values the project already sets are kept, and the others get these defaults.

| Setting | Default | Meaning |
| --- | --- | --- |
| `zoomSteps` | `[0.1, 0.15, 0.2, 0.25, 0.33, 0.5, 0.75, 1]` | Zoom levels the + and - keys step through |
| `nudgeStep` | `1` | Page pixels an arrow key moves the selection; shift moves ten times as far |
| `snapTolerance` | `10` | Distance in page pixels at which a moved element snaps |

## 🛠️ Development

The add-on is developed in a pnpm workspace inside this monorepo, with the latest `mrs-developer` and Volto 19.6.0.
Only pnpm is supported.
The repository's [README](https://github.com/collective/collective-certificates/blob/main/README.md) describes the whole monorepo.

### Prerequisites ✅

-   An [operating system](https://6.docs.plone.org/install/create-project-cookieplone.html#prerequisites-for-installation) that runs all the requirements mentioned.
-   [nvm](https://6.docs.plone.org/install/create-project-cookieplone.html#nvm)
-   [Node.js and pnpm](https://6.docs.plone.org/install/create-project.html#node-js) 24
-   [Make](https://6.docs.plone.org/install/create-project-cookieplone.html#make)
-   [Git](https://6.docs.plone.org/install/create-project-cookieplone.html#git)
-   [Docker](https://docs.docker.com/get-started/get-docker/) (optional)

### Installation 🔧

1.  Clone this repository, then change your working directory.

    ```shell
    git clone git@github.com:collective/collective-certificates.git
    cd collective-certificates/frontend
    ```

2.  Install this code base.

    ```shell
    make install
    ```

### 🧭 Make commands

Run `make help` to list the available commands.
The ones used most often are these.

| Command | What it does |
| --- | --- |
| `make install` | Fetch Volto and the workspace packages, then install dependencies |
| `make start` | Start Volto with the add-on loaded |
| `make build` | Build a production bundle |
| `make lint` | Run ESLint, Prettier, Stylelint and the TypeScript check |
| `make format` | Fix what ESLint, Prettier and Stylelint can fix |
| `make test` | Run the unit tests (Vitest) |
| `make i18n` | Extract the messages to the locale files |
| `make fixtures` | Copy the blueprint schema and the shared test fixtures from the backend |
| `make storybook-start` | Start Storybook on port 6006 |
| `make backend-docker-start` | Start a Docker-based Plone backend on port 8080 |

### 🚀 Start developing

Start the backend, then, in a separate terminal session, start the frontend.

```shell
make backend-docker-start
make start
```

### 🔗 Shared contract with the backend

The blueprint schema and the test vectors are owned by the backend.
After a change in `backend/`, run `make fixtures` here so the frontend copies them, then run `make test`.

### 🧪 Cypress tests

Run each of these steps in separate terminal sessions.

In the first session, start the frontend in development mode.

```shell
make acceptance-frontend-dev-start
```

In the second session, start the backend acceptance server.

```shell
make acceptance-backend-start
```

In the third session, start the Cypress interactive test runner.

```shell
make acceptance-test
```

## 📄 License

The project is licensed under the MIT license.
