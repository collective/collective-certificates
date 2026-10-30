import type { FieldData } from '../blueprint/model';
import type { Term } from '../reducers/certificates';

/** The sample certificate id previews print, as on the server. */
export const SAMPLE_UID = '257e08fdcd07ff6fa3d1bc14f6aec321';

/** Fields the system fills in; a template's sample data cannot set them. */
export const COMPUTED = 'computed';

const today = (): string => new Date().toISOString().slice(0, 10);

/**
 * Values to draw a template with in the designer.
 *
 * The template's own sample data wins; a field without one shows its
 * title (dates: today). Computed fields get the sample id and the
 * verification URL the site prints for it, `<site root>/verify/<uid>`.
 *
 * @param fields The Fields vocabulary.
 * @param kinds Kind of each field token.
 * @param sample The template's `sample_data`.
 * @param siteUrl The site's URL.
 */
export function previewData(
  fields: readonly Term[],
  kinds: Readonly<Record<string, string>>,
  sample: Readonly<Record<string, unknown>> | null | undefined,
  siteUrl: string,
): FieldData {
  const data: FieldData = {};
  for (const { token, title } of fields) {
    const kind = kinds[token];
    if (kind === COMPUTED) continue;
    const value = sample?.[token];
    data[token] =
      typeof value === 'string' && value !== ''
        ? value
        : kind === 'date'
          ? today()
          : title;
  }
  if (kinds.certificate_uid === COMPUTED) data.certificate_uid = SAMPLE_UID;
  if (kinds.verification_url === COMPUTED)
    data.verification_url = `${siteUrl}/verify/${SAMPLE_UID}`;
  return data;
}
