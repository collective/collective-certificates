import { readdirSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const srcDir = __dirname;

const listFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? listFiles(path.join(dir, entry.name))
      : [path.relative(srcDir, path.join(dir, entry.name))],
  );

const files = listFiles(srcDir);

// A component is a `.tsx` module under `components/` that is neither a
// test nor a story.
const components = files.filter(
  (name) =>
    name.startsWith(`components${path.sep}`) &&
    name.endsWith('.tsx') &&
    !/\.(test|stories)\.tsx$/.test(name),
);

describe('source structure', () => {
  it('has TypeScript only', () => {
    expect(files.filter((name) => /\.jsx?$/.test(name))).toEqual([]);
  });

  it.each(components.length ? components : ['(none)'])(
    '%s has a test and stories',
    (component) => {
      if (component === '(none)') return;
      const base = component.replace(/\.tsx$/, '');
      expect(files).toContain(`${base}.test.tsx`);
      expect(files).toContain(`${base}.stories.tsx`);
    },
  );
});
