import { expandToBackendURL } from '@plone/volto/helpers/Url/Url';

/**
 * URL of a font file served by the backend's `@@certificate-font` view.
 *
 * @param token Token of the Fonts vocabulary.
 */
export function fontUrl(token: string): string {
  return expandToBackendURL(`/@@certificate-font/${encodeURIComponent(token)}`);
}

/**
 * CSS declaring every font token as a family, for the designer's page.
 *
 * @param tokens Font tokens.
 * @returns One `@font-face` rule per token.
 */
export function fontFaceCss(tokens: readonly string[]): string {
  return tokens
    .map(
      (token) =>
        `@font-face { font-family: "${token}"; ` +
        `src: url("${fontUrl(token)}"); font-display: block; }`,
    )
    .join('\n');
}
