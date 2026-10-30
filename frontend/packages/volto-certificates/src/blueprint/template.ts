/**
 * The placeholder language of blueprint text and QR content.
 *
 * `{{ token }}` inserts a field value; `{{ token|filter }}` applies one of
 * `FILTERS` first. Text outside braces is literal, and so is an
 * unterminated `{{`. A terminated placeholder that does not follow the
 * grammar is a `TemplateSyntaxError`. Same behaviour as the backend's
 * `blueprint/template.py`, checked by the shared vectors.
 */

import type { FieldData } from './model';

export const FILTERS = ['upper', 'lower', 'date'] as const;

/** The strftime subset `date_format` may use. */
export const DATE_DIRECTIVES = ['%d', '%-d', '%m', '%Y', '%B', '%%'];

/** English month names; callers pass translated names to `render`. */
export const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const PLACEHOLDER =
  /^\s*([a-z_][a-z0-9_]*)\s*(?:\|\s*([a-z_][a-z0-9_]*)\s*)?$/u;
// `%` at the very end, or before a final newline, as Python's `%$` matches.
const DIRECTIVE = /%-d|%.|%(?=\n?$)/gu;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A `{{ … }}` placeholder that does not follow the grammar. */
export class TemplateSyntaxError extends Error {
  override name = 'TemplateSyntaxError';
}

/** A value that cannot be rendered, such as a malformed date. */
export class TemplateRenderError extends Error {
  override name = 'TemplateRenderError';
}

/** One `{{ token|filter }}` occurrence. */
export interface Placeholder {
  token: string;
  filter: string | null;
}

export type Part = string | Placeholder;

/**
 * Split content into literal strings and placeholders.
 *
 * @param content Text with placeholders.
 * @returns Literal strings and placeholders, in order. Adjacent literals
 *   are merged; empty literals are dropped.
 * @throws TemplateSyntaxError For a terminated placeholder whose inside is
 *   not `token` or `token|filter`.
 */
export function parse(content: string): Part[] {
  const parts: Part[] = [];
  let literal = '';
  let position = 0;
  for (;;) {
    const start = content.indexOf('{{', position);
    const end = start === -1 ? -1 : content.indexOf('}}', start + 2);
    if (end === -1) {
      literal += content.slice(position);
      break;
    }
    literal += content.slice(position, start);
    const match = PLACEHOLDER.exec(content.slice(start + 2, end));
    if (match === null) {
      throw new TemplateSyntaxError(
        `Invalid placeholder: ${content.slice(start, end + 2)}`,
      );
    }
    if (literal) {
      parts.push(literal);
      literal = '';
    }
    parts.push({ token: match[1], filter: match[2] ?? null });
    position = end + 2;
  }
  if (literal) parts.push(literal);
  return parts;
}

/**
 * Return the placeholders of content, in order, duplicates included.
 *
 * @throws TemplateSyntaxError See `parse`.
 */
export function placeholders(content: string): Placeholder[] {
  return parse(content).filter(
    (part): part is Placeholder => typeof part !== 'string',
  );
}

/**
 * Return the distinct field tokens content references.
 *
 * @returns Tokens in order of first appearance.
 * @throws TemplateSyntaxError See `parse`.
 */
export function tokens(content: string): string[] {
  return [...new Set(placeholders(content).map((part) => part.token))];
}

/**
 * Return the directives of a date format outside `DATE_DIRECTIVES`.
 *
 * @returns Offending directives in order of appearance; empty when valid.
 */
export function invalidDateDirectives(dateFormat: string): string[] {
  return (dateFormat.match(DIRECTIVE) ?? []).filter(
    (directive) => !DATE_DIRECTIVES.includes(directive),
  );
}

function daysInMonth(year: number, month: number): number {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][
    month - 1
  ];
}

/**
 * Format an ISO date with the strftime subset.
 *
 * @param value `YYYY-MM-DD`.
 * @param dateFormat Format using `DATE_DIRECTIVES`.
 * @param months Twelve month names for `%B`.
 * @throws TemplateRenderError For a malformed date or an unsupported
 *   directive.
 */
export function formatDate(
  value: string,
  dateFormat: string,
  months: readonly string[] = MONTHS_EN,
): string {
  const match = ISO_DATE.exec(value);
  if (match === null) {
    throw new TemplateRenderError(
      `Not an ISO date (YYYY-MM-DD): ${JSON.stringify(value)}`,
    );
  }
  const [year, month, day] = match.slice(1).map(Number);
  if (
    year < 1 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month)
  ) {
    throw new TemplateRenderError(`Not a valid date: ${JSON.stringify(value)}`);
  }
  const bad = invalidDateDirectives(dateFormat);
  if (bad.length > 0) {
    throw new TemplateRenderError(`Unsupported date directive: ${bad[0]}`);
  }
  const values: Record<string, string> = {
    '%d': String(day).padStart(2, '0'),
    '%-d': String(day),
    '%m': String(month).padStart(2, '0'),
    '%Y': String(year).padStart(4, '0'),
    '%B': months[month - 1],
    '%%': '%',
  };
  return dateFormat.replace(DIRECTIVE, (directive) => values[directive]);
}

/**
 * Apply one filter to a value.
 *
 * @param name Filter name, or `null` for none.
 * @throws TemplateRenderError For an unknown filter or a bad date.
 */
export function applyFilter(
  value: string,
  name: string | null,
  dateFormat: string,
  months: readonly string[],
): string {
  switch (name) {
    case null:
      return value;
    case 'upper':
      return value.toUpperCase();
    case 'lower':
      return value.toLowerCase();
    case 'date':
      return formatDate(value, dateFormat, months);
    default:
      throw new TemplateRenderError(`Unknown filter: ${name}`);
  }
}

/**
 * Render content with field values.
 *
 * @param data Field values by token.
 * @param dateFormat Format used by the `date` filter.
 * @param months Month names used by `%B`.
 * @throws TemplateSyntaxError See `parse`.
 * @throws TemplateRenderError For a token missing from `data`, an unknown
 *   filter or a bad date.
 */
export function render(
  content: string,
  data: FieldData,
  dateFormat = '%d/%m/%Y',
  months: readonly string[] = MONTHS_EN,
): string {
  return parse(content)
    .map((part) => {
      if (typeof part === 'string') return part;
      if (!Object.hasOwn(data, part.token)) {
        throw new TemplateRenderError(`Missing value for ${part.token}`);
      }
      return applyFilter(data[part.token], part.filter, dateFormat, months);
    })
    .join('');
}
