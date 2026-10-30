import { describe, expect, it } from 'vitest';
import { monthNames } from './months';
import { SAMPLE_UID, previewData } from './sampleData';
import { insertAt, literal, placeholderFor } from './text';

describe('insertAt', () => {
  it('inserts at the caret', () => {
    expect(insertAt('ab', 1, 1, 'X')).toEqual(['aXb', 2]);
  });

  it('replaces the selection', () => {
    expect(insertAt('abcd', 1, 3, 'X')).toEqual(['aXd', 2]);
  });

  it('appends without a known selection, and clamps', () => {
    expect(insertAt('ab', null, undefined, 'X')).toEqual(['abX', 3]);
    expect(insertAt('ab', 9, 9, 'X')).toEqual(['abX', 3]);
    expect(insertAt('ab', 1, 0, 'X')).toEqual(['aXb', 2]);
  });
});

describe('placeholderFor and literal', () => {
  it('writes placeholders', () => {
    expect(placeholderFor('a')).toBe('{{ a }}');
    expect(placeholderFor('a', 'date')).toBe('{{ a|date }}');
  });

  it('breaks every opening brace pair', () => {
    expect(literal('x {{ a }} {{b}}')).not.toContain('{{');
    expect(literal('x {{ a }}').replace(/​/g, '')).toBe('x {{ a }}');
  });
});

describe('previewData', () => {
  const fields = [
    { token: 'full_name', title: 'Full name' },
    { token: 'event_start_date', title: 'Start' },
    { token: 'certificate_uid', title: 'ID' },
    { token: 'verification_url', title: 'URL' },
  ];
  const kinds = {
    full_name: 'text',
    event_start_date: 'date',
    certificate_uid: 'computed',
    verification_url: 'computed',
  };

  it('uses the template sample, then titles and today', () => {
    const data = previewData(fields, kinds, { full_name: 'Ana' }, 'https://x');
    expect(data.full_name).toBe('Ana');
    expect(data.event_start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const fallback = previewData(fields, kinds, { full_name: '' }, '');
    expect(fallback.full_name).toBe('Full name');
  });

  it('fills computed fields, never from the sample', () => {
    const data = previewData(
      fields,
      kinds,
      { certificate_uid: 'mine' },
      'https://example.org',
    );
    expect(data.certificate_uid).toBe(SAMPLE_UID);
    expect(data.verification_url).toBe(
      `https://example.org/verify/${SAMPLE_UID}`,
    );
  });

  it('leaves computed fields out when the site has none', () => {
    const data = previewData(
      fields.slice(0, 2),
      { full_name: 'text' },
      null,
      '',
    );
    expect(Object.keys(data)).toEqual(['full_name', 'event_start_date']);
  });
});

describe('monthNames', () => {
  it('gives twelve names in the language', () => {
    expect(monthNames('en')[4]).toBe('May');
    expect(monthNames('pt-BR')[4]).toBe('maio');
    expect(monthNames('pt-BR')).toHaveLength(12);
  });

  it('falls back to English for an invalid tag', () => {
    expect(monthNames('not a locale!')[0]).toBe('January');
  });
});
