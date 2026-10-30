/**
 * Blueprint + data → SVG, the format both sides agree on.
 *
 * The output is identical to the backend's `blueprint_to_svg` for the same
 * text sizes: one element per line, every number an integer, attributes in
 * a fixed order, and text escaped with `escape`. Fonts are referenced by
 * token; the page maps tokens to `@font-face` rules.
 */

import { QUIET_ZONE, qrMatrix, qrPath } from './qrcode';
import { MONTHS_EN, render } from './template';
import type {
  Blueprint,
  FieldData,
  ImageElement,
  QrElement,
  TextElement,
} from './model';

/** Returns the size a text element is drawn at, given its rendered text. */
export type SizeFunction = (element: TextElement, text: string) => number;

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape text for both element content and attribute values. */
export function escape(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/** Size function that ignores `fit`. */
export const nominalSize: SizeFunction = (element) => element.size;

/** Draw a text element as one `<text>`. */
export function textSvg(element: TextElement, text: string, size: number) {
  return (
    `<text id="${element.id}" x="${element.x}" y="${element.y}" ` +
    `font-family="${element.font}" font-size="${size}" ` +
    `fill="${element.color}" text-anchor="${element.anchor}" ` +
    `dominant-baseline="${element.baseline}">${escape(text)}</text>`
  );
}

/** Draw an image element, fitted inside its box. */
export function imageSvg(element: ImageElement, href: string): string {
  return (
    `<image id="${element.id}" x="${element.x}" y="${element.y}" ` +
    `width="${element.width}" height="${element.height}" ` +
    `href="${escape(href)}" preserveAspectRatio="xMidYMid meet"/>`
  );
}

/** Draw a QR element as a nested SVG in module units. */
export function qrSvg(element: QrElement, text: string): string {
  const matrix = qrMatrix(text, element.ec);
  const modules = matrix.length + 2 * QUIET_ZONE;
  return (
    `<svg id="${element.id}" x="${element.x}" y="${element.y}" ` +
    `width="${element.size}" height="${element.size}" ` +
    `viewBox="0 0 ${modules} ${modules}" shape-rendering="crispEdges">` +
    `<rect width="${modules}" height="${modules}" fill="${element.bg}"/>` +
    `<path d="${qrPath(matrix)}" fill="${element.fg}"/></svg>`
  );
}

export interface SvgOptions {
  /** Format used by the `date` filter. */
  dateFormat?: string;
  /** Month names used by `%B`. */
  months?: readonly string[];
  /** Decides the size of each text element (`fit: shrink`). */
  size?: SizeFunction;
}

/**
 * Render a blueprint to SVG.
 *
 * @param blueprint A valid blueprint.
 * @param data Field values by token.
 * @param assets Image URLs by asset name; `background` is drawn under
 *   everything, and image elements whose asset is missing are skipped.
 * @returns The SVG document, newline-terminated.
 * @throws TemplateRenderError When content cannot be rendered with `data`.
 */
export function blueprintToSvg(
  blueprint: Blueprint,
  data: FieldData,
  assets: Readonly<Record<string, string>>,
  {
    dateFormat = '%d/%m/%Y',
    months = MONTHS_EN,
    size = nominalSize,
  }: SvgOptions = {},
): string {
  const { width, height } = blueprint.page;
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" ` +
      `height="${height}" viewBox="0 0 ${width} ${height}">`,
  ];
  if (Object.hasOwn(assets, 'background')) {
    lines.push(
      `<image x="0" y="0" width="${width}" height="${height}" ` +
        `href="${escape(assets.background)}" preserveAspectRatio="none"/>`,
    );
  }
  for (const element of blueprint.elements) {
    if (element.type === 'text') {
      const text = render(element.content, data, dateFormat, months);
      lines.push(textSvg(element, text, size(element, text)));
    } else if (element.type === 'image') {
      if (Object.hasOwn(assets, element.asset)) {
        lines.push(imageSvg(element, assets[element.asset]));
      }
    } else {
      const text = render(element.content, data, dateFormat, months);
      lines.push(qrSvg(element, text));
    }
  }
  lines.push('</svg>');
  return `${lines.join('\n')}\n`;
}
