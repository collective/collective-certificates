# Attendance Certificates for Plone 🚀

[![Built with Cookieplone](https://img.shields.io/badge/built%20with-Cookieplone-0083be.svg?logo=cookiecutter)](https://github.com/plone/cookieplone-templates/)
[![Black code style](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![CI](https://github.com/collective/collective-certificates/actions/workflows/main.yml/badge.svg)](https://github.com/collective/collective-certificates/actions/workflows/main.yml)

Generate and store participation certificates for events.

The documentation is at https://collective.github.io/collective-certificates/.

## Features ✨

- **Certificate templates**: a background image sets the page size, and a design places text, image and QR code elements on the page.
  Dates are written in a format chosen from a list, such as `31/12/2026` or `December 31, 2026`.
  The images, such as a signature or a logo, are Image items inside the template.
- **Designer**: a full-screen Volto editor in the template's edit form, with drag and resize, snapping guides, undo and redo, keyboard shortcuts and sample data.
- **Validation**: a blueprint is checked on the server (`@validate-blueprint`) against the same rules the designer applies.
- **Rendering**: certificates are produced as PDF or PNG, from SVG rasterized with resvg.
- **Stored certificates**: each issued certificate keeps its file, the values it was rendered with and its template's UID.
  It prints its own UID and its verification address, the site's `/verify/<uid>`.
- **Public verification**: anyone holding a certificate opens `/verify/<uid>`, a Volto page that shows whether it is valid, what it certifies and a download link.
  Behind it, `@certificate-verification/<uid>` describes the certificate and `@@certificate-file/<uid>` downloads it.
- **Permissions**: adding templates and certificates needs dedicated permissions, which no role has until the site grants them.
- **Fields**: full name, event name, event start and end dates, responsible person and total hours, plus the computed certificate UID and verification URL.
- **Fonts**: Inter, EB Garamond and Caveat ship with the backend.
  More fonts can be read from a directory set in the Plone registry.
- **REST API**: `@preview`, `@render`, `@validate-blueprint` and `@create-certificate` services on each template.

## Use from another add-on 🧩

Other add-ons can issue certificates through the Python API:

```python
from collective.certificates.api import create_certificate
from plone import api

template = api.content.get(path="/certificate-templates/attendance")
certificate = create_certificate(
    template,
    {"full_name": "Patrick Stewart", "event_name": "Star Trek: Picard"},
    "/events/plone-conference/certificates",
    format="pdf",
)
```

The data must include every field token the blueprint uses, or `MissingFields` is raised.
The certificate's own UID and verification URL are filled in during creation.
The caller commits the transaction.

## Quick Start 🏁

### Prerequisites ✅

-   An [operating system](https://6.docs.plone.org/install/create-project-cookieplone.html#prerequisites-for-installation) that runs all the requirements mentioned.
-   [uv](https://6.docs.plone.org/install/create-project-cookieplone.html#uv)
-   [nvm](https://6.docs.plone.org/install/create-project-cookieplone.html#nvm)
-   [Node.js and pnpm](https://6.docs.plone.org/install/create-project.html#node-js) 24
-   [Make](https://6.docs.plone.org/install/create-project-cookieplone.html#make)
-   [Git](https://6.docs.plone.org/install/create-project-cookieplone.html#git)
-   [Docker](https://docs.docker.com/get-started/get-docker/) (optional)


### Installation 🔧

1.  Clone this repository, then change your working directory.

    ```shell
    git clone git@github.com:collective/collective-certificates.git
    cd collective-certificates
    ```

2.  Install this code base.

    ```shell
    make install
    ```


### Fire Up the Servers 🔥

1.  Create a new Plone site on your first run.

    ```shell
    make backend-create-site
    ```

2.  Start the backend at http://localhost:8080/.

    ```shell
    make backend-start
    ```

3.  In a new shell session, start the frontend at http://localhost:3000/.

    ```shell
    make frontend-start
    ```

Your Plone site is now up and running at http://localhost:3000/. 🎉

### Local Stack Deployment 📦

Deploy a local Docker Compose environment that includes the following.

- Docker images for Backend and Frontend 🖼️
- A stack with a Traefik router and a PostgreSQL database 🗃️
- Accessible at [http://collective-certificates.localhost](http://collective-certificates.localhost) 🌐

Run the following commands in a shell session.

```shell
make stack-create-site
make stack-start
```

Your Plone site is now up and running locally. 🚀

## Project structure 🏗️

This monorepo consists of the following distinct sections:

- **backend**: The Plone backend, installed with uv and mxdev instead of buildout.
  It contains the `collective.certificates` package, which is published to PyPI.
  Installation for end users is in [backend/README.md](./backend/README.md).
- **frontend**: The Volto add-on `@plone-collective/volto-certificates`, in `frontend/packages/volto-certificates`, and the development Volto project around it.
  Installation for end users is in [frontend/README.md](./frontend/README.md).
- **docs**: The documentation, published at https://collective.github.io/collective-certificates/.

### Why this structure? 🤔

- All necessary codebases to run the site are contained within the repository (excluding existing add-ons for Plone and React).
- Specific GitHub Workflows are triggered based on changes in each codebase (refer to .github/workflows).
- Simplifies the creation of Docker images for each codebase.
- Demonstrates Plone installation/setup without buildout.

## Code quality assurance 🧐

To check your code against quality standards, run the following shell command.

```shell
make check
```

### Format the codebase 🪄

To format and rewrite the code base, ensuring it adheres to quality standards, run the following shell command.

```shell
make format
```

| Section | Tool | Description | Configuration |
| --- | --- | --- | --- |
| backend | Ruff | Python code formatting, imports sorting  | [`backend/pyproject.toml`](./backend/pyproject.toml) |
| backend | `zpretty` | XML and ZCML formatting  | -- |
| frontend | ESLint | Fixes most common frontend issues | [`frontend/.eslintrc.js`](./frontend/.eslintrc.js) |
| frontend | prettier | Format JS and Typescript code  | [`frontend/.prettierrc`](./frontend/.prettierrc) |
| frontend | Stylelint | Format Styles (css, less, sass)  | [`frontend/.stylelintrc`](./frontend/.stylelintrc) |

Formatters can also be run within the `backend` or `frontend` folders.

### Linting the codebase 🔍

To check the code without changing it, run the following shell command.

```shell
make lint
```

| Section | Tool | Description | Configuration |
| --- | --- | --- | --- |
| backend | Ruff | Checks code formatting, imports sorting  | [`backend/pyproject.toml`](./backend/pyproject.toml) |
| backend | Pyroma | Checks Python package metadata  | -- |
| backend | check-python-versions | Checks Python version information  | -- |
| backend | `zpretty` | Checks XML and ZCML formatting  | -- |
| frontend | ESLint | Checks JS / Typescript lint | [`frontend/.eslintrc.js`](./frontend/.eslintrc.js) |
| frontend | prettier | Check JS / Typescript formatting  | [`frontend/.prettierrc`](./frontend/.prettierrc) |
| frontend | Stylelint | Check Styles (css, less, sass) formatting  | [`frontend/.stylelintrc`](./frontend/.stylelintrc) |

Linters can be run individually within the `backend` or `frontend` folders.

## Internationalization 🌐

Generate translation files for Plone and Volto with ease:

```shell
make i18n
```

## Credits and acknowledgements 🙏

Generated using [Cookieplone (2.0.2)](https://github.com/plone/cookieplone) and [cookieplone-templates (5443a7e)](https://github.com/plone/cookieplone-templates/commit/5443a7e62d92961adac49d7a705a18526b7e3037) on 2026-10-29 10:28:33.816739.
A special thanks to all contributors and supporters!
