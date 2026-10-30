import { defineConfig } from 'vitest/config';
import voltoVitestConfig from '@plone/volto/vitest.config.mjs';
import { createRequire } from 'module';
import path from 'path';
import packageJson from './package.json' with { type: 'json' };

const require = createRequire(import.meta.url);

const voltoDir = path.resolve(__dirname, '../../core/packages/volto');

// Volto resolves add-on imports (`<add-on>/components/...`) to the add-on
// `src` folder through webpack aliases. Vitest needs the same mapping.
const addonSrc = (name) =>
  path.join(path.dirname(require.resolve(`${name}/package.json`)), 'src');

const aliases = {
  ...Object.fromEntries(
    packageJson.addons.map((name) => [name, addonSrc(name)]),
  ),
  '@plone/volto': path.join(voltoDir, 'src'),
  '@plone-collective/volto-certificates': path.resolve(__dirname, './src'),
};

// Volto's webpack also looks up bare imports (`semantic-ui-react`,
// `react-redux`, ...) in Volto's own node_modules. pnpm does not expose them
// to this package, so fall back to resolving them from Volto, as webpack does.
const resolveFromVolto = {
  name: 'resolve-from-volto',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    if (
      !importer ||
      source.startsWith('.') ||
      source.startsWith('\0') ||
      path.isAbsolute(source) ||
      importer.startsWith(voltoDir)
    ) {
      return null;
    }
    const resolved = await this.resolve(source, importer, {
      ...options,
      skipSelf: true,
    });
    if (resolved) {
      return resolved;
    }
    return this.resolve(source, path.join(voltoDir, 'package.json'), {
      ...options,
      skipSelf: true,
    });
  },
};

export default defineConfig({
  ...voltoVitestConfig,
  resolve: {
    alias: aliases,
  },
  test: {
    ...voltoVitestConfig.test,
    // Volto's coverage settings point at its own sources.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.{test,stories}.{ts,tsx}', 'src/testing/**'],
    },
    // Volto's own projects carry their own aliases and plugins, so add ours
    // to each one.
    projects: voltoVitestConfig.test.projects.map((project) => ({
      ...project,
      plugins: [resolveFromVolto, ...project.plugins],
      resolve: {
        ...project.resolve,
        alias: { ...project.resolve.alias, ...aliases },
      },
    })),
  },
});
