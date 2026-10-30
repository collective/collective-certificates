/**
 * The date formats a template can choose, by the token the backend stores
 * in `date_format`. The renderer takes the strftime pattern behind each.
 */
export const DATE_FORMATS: Record<string, string> = {
  'day-month-year': '%d/%m/%Y',
  'month-day-year': '%m/%d/%Y',
  iso: '%Y-%m-%d',
  long: '%B %-d, %Y',
  'long-day-first': '%-d %B %Y',
};

/** The token a template uses when it has not chosen one. */
export const DEFAULT_DATE_FORMAT = 'day-month-year';

/**
 * The renderer pattern for a template's `date_format` token.
 *
 * An empty or unknown token gets the default's pattern.
 *
 * @param token The `date_format` value of the template.
 * @returns The strftime pattern the renderer takes.
 */
export function datePattern(token: string | null | undefined): string {
  const known =
    token !== null &&
    token !== undefined &&
    Object.prototype.hasOwnProperty.call(DATE_FORMATS, token);
  return known ? DATE_FORMATS[token] : DATE_FORMATS[DEFAULT_DATE_FORMAT];
}
