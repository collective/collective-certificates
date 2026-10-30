import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  BLUEPRINTS,
  DATA,
  GOLDEN_ASSETS,
  goldenSize,
} from '../testing/fixtures';
import { blueprintToSvg, escape, nominalSize } from './svg';
import { TemplateRenderError } from './template';
import type { Blueprint } from './model';

const golden = (name: string): string =>
  readFileSync(
    path.resolve(__dirname, `../../__fixtures__/expected-svg/${name}.svg`),
    'utf-8',
  );

describe('blueprintToSvg', () => {
  it.each(Object.keys(BLUEPRINTS))(
    'matches the %s golden byte for byte',
    (name) => {
      const svg = blueprintToSvg(BLUEPRINTS[name], DATA, GOLDEN_ASSETS, {
        size: goldenSize(name),
      });
      expect(svg).toBe(golden(name));
    },
  );

  it('skips image elements whose asset is missing', () => {
    const svg = blueprintToSvg(BLUEPRINTS['every-element'], DATA, {});
    expect(svg).not.toContain('<image');
    expect(svg).toContain('<text id="start"');
  });

  it('draws text at its nominal size by default', () => {
    const svg = blueprintToSvg(BLUEPRINTS['every-element'], DATA, {});
    expect(svg).toContain('id="shrunk" x="100" y="1400"');
    expect(svg).toMatch(/id="shrunk"[^>]* font-size="(?!84")\d+"/);
  });

  it('uses the date format and month names', () => {
    const blueprint: Blueprint = {
      version: 1,
      page: { width: 100, height: 100 },
      elements: [
        {
          id: 'd',
          type: 'text',
          x: 1,
          y: 1,
          anchor: 'start',
          baseline: 'alphabetic',
          font: 'inter',
          size: 10,
          color: '#000000',
          content: '{{ event_start_date|date }}',
        },
      ],
    };
    const svg = blueprintToSvg(
      blueprint,
      DATA,
      {},
      {
        dateFormat: '%-d %B',
        months: Array.from({ length: 12 }, (_, i) => `m${i + 1}`),
      },
    );
    expect(svg).toContain('>26 m5</text>');
  });

  it('fails on a missing value', () => {
    expect(() =>
      blueprintToSvg(BLUEPRINTS.minimal, {}, {}, { size: nominalSize }),
    ).toThrow(TemplateRenderError);
  });

  it('is newline-terminated, one element per line', () => {
    const svg = blueprintToSvg(BLUEPRINTS.minimal, DATA, GOLDEN_ASSETS);
    expect(svg.endsWith('</svg>\n')).toBe(true);
    expect(svg.split('\n')[0]).toMatch(/^<svg xmlns=/);
  });
});

describe('escape', () => {
  it('escapes markup and both quotes', () => {
    expect(escape(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });
});
