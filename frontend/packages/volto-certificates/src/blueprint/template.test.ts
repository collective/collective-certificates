import { describe, expect, it } from 'vitest';
import vectors from '../../__fixtures__/template-vectors.json';
import {
  TemplateRenderError,
  TemplateSyntaxError,
  formatDate,
  invalidDateDirectives,
  parse,
  render,
  tokens,
} from './template';

interface Vector {
  content: string;
  expected?: string;
  error?: 'syntax' | 'render';
  tokens?: string[];
  date_format?: string;
  data?: Record<string, string>;
}

const cases = vectors.cases as Vector[];
const rendered = cases.filter((c) => c.expected !== undefined);
const syntaxErrors = cases.filter((c) => c.error === 'syntax');
const renderErrors = cases.filter((c) => c.error === 'render');
const withTokens = cases.filter((c) => c.tokens !== undefined);

const renderCase = (c: Vector): string =>
  render(c.content, { ...vectors.data, ...c.data }, c.date_format);

describe('template vectors', () => {
  it('cover every kind of case', () => {
    expect(rendered.length).toBeGreaterThan(0);
    expect(syntaxErrors.length).toBeGreaterThan(0);
    expect(renderErrors.length).toBeGreaterThan(0);
    expect(rendered.length + syntaxErrors.length + renderErrors.length).toBe(
      cases.length,
    );
  });

  it.each(rendered)('renders "$content"', (c) => {
    expect(renderCase(c)).toBe(c.expected);
  });

  it.each(syntaxErrors)('rejects the syntax of "$content"', (c) => {
    expect(() => parse(c.content)).toThrow(TemplateSyntaxError);
  });

  it.each(renderErrors)('cannot render "$content"', (c) => {
    expect(() => renderCase(c)).toThrow(TemplateRenderError);
  });

  it.each(withTokens)('lists the tokens of "$content"', (c) => {
    expect(tokens(c.content)).toEqual(c.tokens);
  });
});

describe('parse', () => {
  it('merges literals and keeps placeholders in order', () => {
    expect(parse('a {{ b|upper }} c {{d}}')).toEqual([
      'a ',
      { token: 'b', filter: 'upper' },
      ' c ',
      { token: 'd', filter: null },
    ]);
  });

  it('returns nothing for empty content', () => {
    expect(parse('')).toEqual([]);
  });
});

describe('formatDate', () => {
  it('uses the given month names', () => {
    const months = MONTHS_PT;
    expect(formatDate('2026-05-06', '%-d de %B de %Y', months)).toBe(
      '6 de maio de 2026',
    );
  });

  it('knows leap years', () => {
    expect(formatDate('2024-02-29', '%d/%m')).toBe('29/02');
    expect(formatDate('2000-02-29', '%d/%m')).toBe('29/02');
    expect(() => formatDate('1900-02-29', '%d')).toThrow(TemplateRenderError);
  });

  it('rejects year zero and month 13', () => {
    expect(() => formatDate('0000-01-01', '%d')).toThrow(TemplateRenderError);
    expect(() => formatDate('2026-13-01', '%d')).toThrow(TemplateRenderError);
  });
});

describe('invalidDateDirectives', () => {
  it('accepts the subset', () => {
    expect(invalidDateDirectives('%d %-d %m %Y %B %%')).toEqual([]);
  });

  it('lists the others in order, including a trailing %', () => {
    expect(invalidDateDirectives('%A %d %y %')).toEqual(['%A', '%y', '%']);
    expect(invalidDateDirectives('%d %\n')).toEqual(['%']);
  });
});

const MONTHS_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
