/**
 * Text measurement and `fit: shrink` in the browser.
 *
 * The backend measures with the fonts' advance widths (fontTools), the
 * designer with `canvas.measureText` after the font face has loaded. The
 * two differ slightly; the server's size is the one in the certificate.
 */

import type { TextElement } from './model';
import type { SizeFunction } from './svg';

/** Width of text drawn with a font token at a size, in pixels. */
export type Measure = (font: string, text: string, size: number) => number;

// Measuring at a large size keeps canvas rounding out of the result.
const REFERENCE_SIZE = 1000;

/**
 * Return the largest size not above `size` at which text fits.
 *
 * Equivalent to stepping down by 1 from `size` until the width is at most
 * `maxWidth`, since widths grow linearly with the size.
 *
 * @returns A size between 1 and `size`.
 */
export function fitSize(
  measure: Measure,
  font: string,
  text: string,
  size: number,
  maxWidth: number,
): number {
  const perPixel = measure(font, text, REFERENCE_SIZE) / REFERENCE_SIZE;
  if (perPixel <= 0) return size;
  return Math.max(1, Math.min(size, Math.floor(maxWidth / perPixel)));
}

/** Size function applying `fit: shrink` with a measure. */
export function shrinkSize(measure: Measure): SizeFunction {
  return (element: TextElement, text: string) =>
    element.fit === 'shrink' && element.max_width !== undefined
      ? fitSize(measure, element.font, text, element.size, element.max_width)
      : element.size;
}

/**
 * Measure with a 2D canvas, the font referenced by its token as the
 * `@font-face` family name.
 *
 * @returns A measure, or `null` where there is no canvas (server side).
 */
export function canvasMeasure(): Measure | null {
  if (typeof document === 'undefined') return null;
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return null;
  return (font, text, size) => {
    context.font = `${size}px "${font}"`;
    return context.measureText(text).width;
  };
}
