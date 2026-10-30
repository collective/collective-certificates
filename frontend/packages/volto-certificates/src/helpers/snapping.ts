/**
 * Snapping in page coordinates: an element's box snaps to the page edges
 * and center and to the other elements' edges and centers.
 */

import type { Blueprint, Element } from '../blueprint/model';

/** A box in page pixels. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Guides to draw after snapping, as page coordinates. */
export interface Guides {
  vertical: number[];
  horizontal: number[];
}

export interface SnapResult {
  x: number;
  y: number;
  guides: Guides;
}

// Text has no box without measuring; it snaps by its anchor point.
const TEXT_BOX = 0;

/** Box of an element; text is the zero-size box at its anchor point. */
export function elementBox(element: Element): Box {
  switch (element.type) {
    case 'image':
      return {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      };
    case 'qrcode':
      return {
        x: element.x,
        y: element.y,
        width: element.size,
        height: element.size,
      };
    default:
      return { x: element.x, y: element.y, width: TEXT_BOX, height: TEXT_BOX };
  }
}

/** Convert a screen distance at a zoom into page pixels, rounded. */
export function toPage(screen: number, zoom: number): number {
  return Math.round(screen / zoom);
}

const lines = (start: number, length: number): number[] => [
  start,
  start + Math.round(length / 2),
  start + length,
];

function snapAxis(
  start: number,
  length: number,
  targets: number[],
  tolerance: number,
): { start: number; guide: number | null } {
  let best: { start: number; guide: number | null; distance: number } = {
    start,
    guide: null,
    distance: tolerance + 1,
  };
  lines(start, length).forEach((line, index) => {
    for (const target of targets) {
      const distance = Math.abs(target - line);
      if (distance <= tolerance && distance < best.distance) {
        const offset = lines(0, length)[index];
        best = { start: target - offset, guide: target, distance };
      }
    }
  });
  return { start: best.start, guide: best.guide };
}

/**
 * Snap a moved box to the page and the other elements.
 *
 * @param box The box at its unsnapped position, in page pixels.
 * @param blueprint The blueprint, for the page and the other elements.
 * @param ignore Id of the element being moved.
 * @param tolerance Snap distance in page pixels.
 * @returns The snapped top-left corner and the guides that matched.
 */
export function snap(
  box: Box,
  blueprint: Blueprint,
  ignore: string,
  tolerance: number,
): SnapResult {
  const { width, height } = blueprint.page;
  const vertical = lines(0, width);
  const horizontal = lines(0, height);
  for (const element of blueprint.elements) {
    if (element.id === ignore) continue;
    const other = elementBox(element);
    vertical.push(...lines(other.x, other.width));
    horizontal.push(...lines(other.y, other.height));
  }
  const x = snapAxis(box.x, box.width, vertical, tolerance);
  const y = snapAxis(box.y, box.height, horizontal, tolerance);
  return {
    x: x.start,
    y: y.start,
    guides: {
      vertical: x.guide === null ? [] : [x.guide],
      horizontal: y.guide === null ? [] : [y.guide],
    },
  };
}

/** Keep a box's top-left corner on the page (coordinates are ≥ 0). */
export function clampToPage(x: number, y: number): [number, number] {
  return [Math.max(0, Math.round(x)), Math.max(0, Math.round(y))];
}
