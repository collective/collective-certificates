# Attendance Certificates for Plone documentation

The documentation of Attendance Certificates for Plone, the `collective.certificates` and `@plone-collective/volto-certificates` packages.
It is written in MyST Markdown, built with Sphinx and the [Plone Sphinx Theme](https://github.com/plone/plone-sphinx-theme), and organized following [Diátaxis](https://diataxis.fr/).

The published documentation is at https://collective.github.io/collective-certificates/, with the add-on's Storybook under [`storybook/`](https://collective.github.io/collective-certificates/storybook/).


## Prerequisites

-   [uv](https://docs.astral.sh/uv/) manages the Python version and the documentation tools.

To install uv, use the following command, or visit the [uv installation page](https://docs.astral.sh/uv/getting-started/installation/) for alternative methods.

```shell
curl -LsSf https://astral.sh/uv/install.sh | sh
```


## Build the documentation

Run the following commands from this `docs` directory.

To build the HTML documentation, use the following command.
The result is in `_build/html`.

```shell
make html
```

To build the HTML documentation and view a live preview while editing, use the following command.

```shell
make livehtml
```

To check for broken links, use the following command.

```shell
make linkcheckbroken
```

To check spelling, grammar, and style, use the following command.
Errors fail the build in CI.
Warnings and suggestions are advisory.

```shell
make vale
```

To delete the build directory and the Python virtual environment, and create the environment again, use the following command.

```shell
make init
```

For more `make` commands, use the following command.

```shell
make help
```


## Layout

-   `docs/`: the Sphinx sources, with `conf.py`.
    The pages are grouped by Diátaxis category in `tutorials/`, `how-to-guides/`, `reference/` and `concepts/`.
-   `docs/_static/`: the logo, the favicon, and the sample certificate `sample.png` and `sample.pdf`.
    The backend's `scripts/update_fixtures.py` writes the two sample files, so do not edit them by hand.
-   `styles/`: the Vale styles and the accepted vocabulary, in `styles/config/vocabularies/`.
-   `pyproject.toml` and `uv.lock`: the documentation tools.

The build also publishes the backend's blueprint JSON Schema, `backend/src/collective/certificates/blueprint/schema.json`, as `blueprint.schema.json` at the root of the site, which is the URL in the schema's `$id`.


## Publishing

The `CI` workflow builds the documentation on every push that changes it.
On `main`, the `GitHub Pages` workflow publishes it together with the add-on's Storybook, as one deployment.
The repository's Pages source must be set to **GitHub Actions**.


## Manage dependencies

The documentation tools are in the `dev` dependency group of `pyproject.toml`, and locked in `uv.lock`.

To add a tool, use the following command.

```shell
uv add --dev my-requirement
```

To remove a tool, use the following command.

```shell
uv remove --dev my-requirement
```

After you add a Sphinx extension, also add it to the `extensions` list in `docs/conf.py`.
Dependabot proposes updates to the locked tools once a week.


## Credits and acknowledgements 🙏

Generated using [Cookieplone (2.0.2)](https://github.com/plone/cookieplone) and [cookieplone-templates (5443a7e)](https://github.com/plone/cookieplone-templates/commit/5443a7e62d92961adac49d7a705a18526b7e3037) on 2026-10-29 10:28:33.816739.
A special thanks to all contributors and supporters!
