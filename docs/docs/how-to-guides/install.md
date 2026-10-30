---
myst:
  html_meta:
    "description": "Install Attendance Certificates for Plone in a Plone 6 backend and a Volto 19 frontend."
    "property=og:description": "Install Attendance Certificates for Plone in a Plone 6 backend and a Volto 19 frontend."
    "property=og:title": "Install Attendance Certificates for Plone"
    "keywords": "Plone, Attendance Certificates for Plone, install, Volto, how-to"
---

(how-to-install)=

# Install Attendance Certificates for Plone

This guide installs the add-on in an existing Plone 6 site with a Volto frontend.
You need Plone 6.1 or 6.2 on Python 3.11 to 3.14, and a Volto 19 project.
<!-- source: backend/pyproject.toml -->
<!-- source: frontend/packages/volto-certificates/package.json -->

## Backend

1. Add the package to your Python environment.
   With uv, from your project directory:

    ```shell
    uv add collective.certificates
    ```

    <!-- source: backend/pyproject.toml -->

2. Restart the Plone instance.
   The package registers itself with `plone.autoinclude.plugin`, so Plone loads its ZCML at startup and no `zcml` line is needed.
   <!-- source: backend/pyproject.toml -->

3. In the Plone site, open **Site Setup**, then **Add-ons**, and install **Attendance Certificates for Plone: Install**.
   This profile depends on `plone.volto`, and it adds the **Certificate Template** and **Certificate** content types.
   <!-- source: backend/src/collective/certificates/profiles/default/metadata.xml -->
   <!-- source: backend/src/collective/certificates/profiles/default/types/CertificateTemplate.xml -->

Installing the example content profile, **Attendance Certificates for Plone: Example content**, is optional.
It creates content that shows the add-on in use, including a certificate template named `starfleet-academy-certificate` at the site root, with a background, a signature as an **Image** item inside it, a design and sample data, ready to open in the designer.
<!-- source: backend/src/collective/certificates/profiles.zcml -->
<!-- source: backend/src/collective/certificates/setuphandlers/examplecontent/content/91eb003156424878a0d93b5742461db6/data.json -->
<!-- source: backend/src/collective/certificates/setuphandlers/examplecontent/content/a5aa5336a75e452b96d8c82b5c20463e/data.json -->

<!-- source: backend/src/collective/certificates/profiles/default/workflows.xml -->

## Grant the add permissions

The install profile grants the add permissions to no role, not even Manager.
Until the site grants them, the **Add** menu does not offer **Certificate Template** or **Certificate**, and the REST and Python APIs cannot create certificates.
<!-- source: backend/src/collective/certificates/profiles/default/rolemap.xml -->
<!-- source: backend/src/collective/certificates/permissions.zcml -->

The two permissions are **collective.certificates: Add CertificateTemplate** and **collective.certificates: Add Certificate**.
Grant them in the **Security** tab of the site root in the ZMI, or in a `rolemap.xml` file of a policy profile.
Declare this add-on as a dependency of the policy profile, so that its file applies after the install profile.
This example grants both permissions to Manager and Site Administrator:

```xml
<?xml version="1.0" encoding="utf-8"?>
<rolemap>
  <permissions>
    <permission acquire="False"
                name="collective.certificates: Add CertificateTemplate"
    >
      <role name="Manager" />
      <role name="Site Administrator" />
    </permission>
    <permission acquire="False"
                name="collective.certificates: Add Certificate"
    >
      <role name="Manager" />
      <role name="Site Administrator" />
    </permission>
  </permissions>
</rolemap>
```

The example content profile grants both permissions to Manager.
<!-- source: backend/src/collective/certificates/profiles/initial/rolemap.xml -->

## Frontend

1. Add the package to your Volto project's dependencies, then install it.

    ```shell
    pnpm add @plone-collective/volto-certificates
    ```

2. Add it to the `addons` list of `volto.config.js`:

    ```javascript
    const addons = ["@plone-collective/volto-certificates"];
    ```

    <!-- source: frontend/volto.config.js -->

3. Restart the frontend.
   The designer widgets are registered by the add-on's configuration, so the template edit form shows the **Design** field once Volto is running with the add-on.
   <!-- source: frontend/packages/volto-certificates/src/index.ts -->
   <!-- source: frontend/packages/volto-certificates/src/config/widgets.ts -->

## Check the installation

- The **Add** menu of a folder offers **Certificate Template**, once the add permissions are granted.
- Editing a template shows a **Design** field with an **Open designer** button, once a background image is uploaded.

If the designer does not appear, check that the frontend was restarted with the add-on in `addons`, and that the backend profile is installed.

## Next steps

- [Your first certificate template](../tutorials/your-first-certificate-template.md), to design a template and create a certificate.
- [Add a font](add-a-font.md), to use fonts beyond the bundled ones.
