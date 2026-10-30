/**
 * Insert text into a value at a selection, as typing would.
 *
 * @param value Current value.
 * @param start Selection start; the end of the value when unknown.
 * @param end Selection end; equal to `start` when unknown.
 * @returns The new value and the caret position after the insert.
 */
export function insertAt(
  value: string,
  start: number | null | undefined,
  end: number | null | undefined,
  text: string,
): [string, number] {
  const from = Math.min(start ?? value.length, value.length);
  const to = Math.max(from, Math.min(end ?? from, value.length));
  return [value.slice(0, from) + text + value.slice(to), from + text.length];
}

/** The placeholder for a field, with an optional filter. */
export function placeholderFor(token: string, filter?: string): string {
  return filter ? `{{ ${token}|${filter} }}` : `{{ ${token} }}`;
}

// Breaks `{{` so the template parser leaves placeholders as text.
const ZERO_WIDTH_SPACE = '​';

/** Content shown as written, without filling in placeholders. */
export function literal(content: string): string {
  return content.split('{{').join(`{${ZERO_WIDTH_SPACE}{`);
}
