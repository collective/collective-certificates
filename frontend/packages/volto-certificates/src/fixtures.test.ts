import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

// The backend owns the schema, vectors and goldens; `make fixtures` copies
// them here. A difference means the copy is stale.
const addonDir = path.resolve(__dirname, '..');
const fixturesDir = path.join(addonDir, '__fixtures__');
const backendDir = path.resolve(addonDir, '../../../backend');
const resourcesDir = path.join(backendDir, 'tests/_resources');

const listFiles = (dir: string, prefix = ''): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? listFiles(path.join(dir, entry.name), `${prefix}${entry.name}/`)
      : [`${prefix}${entry.name}`],
  );

const copies = listFiles(fixturesDir).sort();

describe('shared fixtures', () => {
  it('copies every JSON and SVG resource of the backend', () => {
    const expected = listFiles(resourcesDir)
      .filter((name) => /\.(json|svg)$/.test(name))
      .sort();
    expect(copies).toEqual(expected);
  });

  it.each(copies)('%s is byte-identical to the backend', (name) => {
    expect(readFileSync(path.join(fixturesDir, name))).toEqual(
      readFileSync(path.join(resourcesDir, name)),
    );
  });
});
