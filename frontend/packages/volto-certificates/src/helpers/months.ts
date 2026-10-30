/**
 * Month names in a language, for `%B` in the designer.
 *
 * The server uses its own translations; these come from the browser and
 * can differ in case or spelling, which only affects the preview.
 *
 * @param locale A BCP 47 language tag such as `pt-BR`.
 */
export function monthNames(locale: string): string[] {
  let format: Intl.DateTimeFormat;
  try {
    format = new Intl.DateTimeFormat(locale, {
      month: 'long',
      timeZone: 'UTC',
    });
  } catch {
    format = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' });
  }
  return Array.from({ length: 12 }, (_, month) =>
    format.format(new Date(Date.UTC(2026, month, 1))),
  );
}
