import { describe, expect, it } from 'vitest';
import context from '../../__fixtures__/contract-context.json';
import { DATE_FORMATS, DEFAULT_DATE_FORMAT, datePattern } from './dateFormats';

describe('date formats', () => {
  it('match the contract the backend publishes', () => {
    expect(DATE_FORMATS).toEqual(context.date_formats);
    expect(DEFAULT_DATE_FORMAT).toBe(context.default_date_format);
  });

  it('gives the pattern of each token', () => {
    expect(datePattern('day-month-year')).toBe('%d/%m/%Y');
    expect(datePattern('month-day-year')).toBe('%m/%d/%Y');
    expect(datePattern('iso')).toBe('%Y-%m-%d');
    expect(datePattern('long')).toBe('%B %-d, %Y');
    expect(datePattern('long-day-first')).toBe('%-d %B %Y');
  });

  it('falls back to the default for an empty or unknown token', () => {
    const fallback = DATE_FORMATS[DEFAULT_DATE_FORMAT];
    expect(datePattern(null)).toBe(fallback);
    expect(datePattern(undefined)).toBe(fallback);
    expect(datePattern('')).toBe(fallback);
    expect(datePattern('%d/%m/%Y')).toBe(fallback);
    expect(datePattern('constructor')).toBe(fallback);
  });
});
