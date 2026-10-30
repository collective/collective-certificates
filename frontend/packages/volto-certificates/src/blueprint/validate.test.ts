import { describe, expect, it } from 'vitest';
import invalid from '../../__fixtures__/invalid-blueprints.json';
import { BLUEPRINTS, VALIDATION_CONTEXT } from '../testing/fixtures';
import { emptyBlueprint } from './model';
import { pointer, schemaIssues, validate } from './validate';
import type { ValidationContext } from './validate';

interface InvalidCase {
  name: string;
  blueprint: unknown;
  context?: { assets?: string[] };
  errors: { element: string | null; path: string }[];
}

const cases = invalid.cases as InvalidCase[];
const byName = (name: string): InvalidCase =>
  cases.find((c) => c.name === name) as InvalidCase;

const contextFor = (c: InvalidCase): ValidationContext => ({
  ...VALIDATION_CONTEXT,
  ...(c.context?.assets ? { assets: new Set(c.context.assets) } : {}),
});

describe('valid fixtures', () => {
  it.each(Object.keys(BLUEPRINTS))('%s passes every check', (name) => {
    expect(validate(BLUEPRINTS[name], VALIDATION_CONTEXT)).toEqual([]);
  });

  it('the empty blueprint is schema-valid', () => {
    expect(schemaIssues(emptyBlueprint())).toEqual([]);
    expect(emptyBlueprint().page).toEqual({ width: 3508, height: 2480 });
  });
});

describe('invalid fixtures', () => {
  it.each(cases.map((c) => [c.name, c] as const))(
    '%s yields exactly the expected (element, path) pairs',
    (_, c) => {
      const issues = validate(c.blueprint, contextFor(c));
      expect(issues.map(({ element, path }) => ({ element, path }))).toEqual(
        c.errors,
      );
    },
  );

  it.each(cases.map((c) => [c.name, c] as const))(
    '%s issues carry a message code',
    (_, c) => {
      for (const issue of validate(c.blueprint, contextFor(c))) {
        expect(issue.code).toMatch(/^error_[a-z_]+$/);
      }
    },
  );
});

describe('schemaIssues', () => {
  it('names the path and a detail', () => {
    const [issue] = schemaIssues({
      version: 2,
      page: { width: 1, height: 1 },
      elements: [],
    });
    expect(issue.values).toEqual({
      path: '/version',
      detail: '1 was expected',
    });
  });

  it('reports a root-level error at "/" in the message', () => {
    const [issue] = schemaIssues([]);
    expect(issue.path).toBe('');
    expect(issue.values.path).toBe('/');
  });

  it('counts lengths in code points', () => {
    const blueprint = {
      ...emptyBlueprint(),
      elements: [
        {
          id: 'q',
          type: 'qrcode',
          x: 0,
          y: 0,
          size: 10,
          content: '😀'.repeat(500),
          ec: 'M',
          fg: '#000000',
          bg: '#ffffff',
        },
      ],
    };
    expect(schemaIssues(blueprint)).toEqual([]);
    const [qr] = blueprint.elements;
    const tooLong = {
      ...blueprint,
      elements: [{ ...qr, content: '😀'.repeat(501) }],
    };
    expect(schemaIssues(tooLong).map((i) => i.path)).toEqual([
      '/elements/0/content',
    ]);
  });

  it('lets a pattern end before a final newline, as Python does', () => {
    const element = {
      id: 'a\n',
      type: 'image',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      asset: 'background',
    };
    expect(schemaIssues({ ...emptyBlueprint(), elements: [element] })).toEqual(
      [],
    );
  });

  it('rejects booleans where integers are expected', () => {
    const issues = schemaIssues({
      version: 1,
      page: { width: true, height: 1 },
      elements: [],
    });
    expect(issues.map((i) => i.path)).toEqual(['/page/width']);
  });
});

describe('context switches', () => {
  it('skips layout checks on request', () => {
    const c = byName('outside-page');
    expect(
      validate(c.blueprint, {
        ...VALIDATION_CONTEXT,
        background: [1, 1],
        checkLayout: false,
      }),
    ).toEqual([]);
  });

  it('does not check assets when they are unknown', () => {
    const c = byName('missing-asset');
    expect(
      validate(c.blueprint, { ...VALIDATION_CONTEXT, assets: null }),
    ).toEqual([]);
  });

  it('does not check the page size without a background', () => {
    const c = byName('page-mismatch');
    expect(
      validate(c.blueprint, { ...VALIDATION_CONTEXT, background: null }),
    ).toEqual([]);
  });
});

describe('pointer', () => {
  it('escapes "~" and "/"', () => {
    expect(pointer(['a/b', 'c~d', 0])).toBe('/a~1b/c~0d/0');
  });
});
