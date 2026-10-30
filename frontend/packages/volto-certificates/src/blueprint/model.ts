/**
 * Typed views of a blueprint. `schema.json` is the normative definition;
 * `schema.test.ts` keeps these in step with it.
 */

export const ELEMENT_TYPES = ['text', 'image', 'qrcode'] as const;
export const ANCHORS = ['start', 'middle', 'end'] as const;
export const BASELINES = ['alphabetic', 'middle', 'hanging'] as const;
export const FITS = ['none', 'shrink'] as const;
export const ERROR_CORRECTIONS = ['L', 'M', 'Q', 'H'] as const;

export type ElementType = (typeof ELEMENT_TYPES)[number];
export type Anchor = (typeof ANCHORS)[number];
export type Baseline = (typeof BASELINES)[number];
export type Fit = (typeof FITS)[number];
/** `background`, or the id of an Image item inside the template. */
export type Asset = string;
export type ErrorCorrection = (typeof ERROR_CORRECTIONS)[number];

/** The asset name of the template's background field. */
export const BACKGROUND_ASSET = 'background';

/** Page size in the background's pixel space. */
export interface Page {
  width: number;
  height: number;
}

/** One line of text, positioned by its anchor point. */
export interface TextElement {
  id: string;
  type: 'text';
  x: number;
  y: number;
  anchor: Anchor;
  baseline: Baseline;
  font: string;
  size: number;
  color: string;
  content: string;
  rotation?: 0;
  max_width?: number;
  fit?: Fit;
}

/** An image field of the template, fitted inside its box. */
export interface ImageElement {
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  asset: Asset;
  rotation?: 0;
}

/** A square QR code encoding the rendered content. */
export interface QrElement {
  id: string;
  type: 'qrcode';
  x: number;
  y: number;
  size: number;
  content: string;
  ec: ErrorCorrection;
  fg: string;
  bg: string;
  rotation?: 0;
}

export type Element = TextElement | ImageElement | QrElement;

/** A certificate layout. */
export interface Blueprint {
  version: 1;
  page: Page;
  elements: Element[];
}

/**
 * One problem found in a blueprint.
 *
 * `element` is the id of the offending element (`null` for page-level
 * problems), `path` the JSON pointer of the offending value, `code` the
 * message id and `values` its parameters.
 */
export interface ValidationIssue {
  element: string | null;
  path: string;
  code: string;
  values: Record<string, string | number>;
}

/** Field values by token. */
export type FieldData = Record<string, string>;

/**
 * Return a blueprint with no elements.
 *
 * @param width Page width; defaults to A4 landscape at 300 dpi.
 * @param height Page height.
 */
export function emptyBlueprint(width = 3508, height = 2480): Blueprint {
  return { version: 1, page: { width, height }, elements: [] };
}
