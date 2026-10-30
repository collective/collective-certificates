/**
 * Pure blueprint operations for the designer. Each returns a new
 * blueprint and leaves its input untouched.
 */

import { BACKGROUND_ASSET } from './model';
import type {
  Blueprint,
  Element,
  ElementType,
  ImageElement,
  QrElement,
  TextElement,
} from './model';

/** Element ids follow the schema's pattern. */
export const ID_PATTERN = /^[a-z][a-z0-9_-]{0,31}$/;

/** Offset of a duplicate from its original, in page pixels. */
export const DUPLICATE_OFFSET = 40;

/** Undo steps kept. */
export const HISTORY_LIMIT = 100;

/**
 * Return the first free id `<base>`, `<base>-2`, `<base>-3`, …
 *
 * @param base A valid id prefix.
 */
export function uniqueId(blueprint: Blueprint, base: string): string {
  const taken = new Set(blueprint.elements.map((element) => element.id));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const suffix = `-${n}`;
    const candidate = `${base.slice(0, 32 - suffix.length)}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/**
 * A new element of a type, centred on the page, with an unused id.
 *
 * @param font Font token for text.
 * @param asset Asset an image shows.
 */
export function newElement(
  blueprint: Blueprint,
  type: ElementType,
  font = 'inter',
  asset: string = BACKGROUND_ASSET,
): Element {
  const { width, height } = blueprint.page;
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const unit = Math.max(1, Math.round(Math.min(width, height) / 10));
  if (type === 'text') {
    const element: TextElement = {
      id: uniqueId(blueprint, 'text'),
      type,
      x: cx,
      y: cy,
      anchor: 'middle',
      baseline: 'middle',
      font,
      size: Math.max(1, Math.round(unit / 2)),
      color: '#000000',
      content: '{{ full_name }}',
    };
    return element;
  }
  if (type === 'image') {
    const element: ImageElement = {
      id: uniqueId(blueprint, 'image'),
      type,
      x: Math.max(0, cx - unit),
      y: Math.max(0, cy - unit),
      width: unit * 2,
      height: unit * 2,
      asset,
    };
    return element;
  }
  const element: QrElement = {
    id: uniqueId(blueprint, 'qr'),
    type,
    x: Math.max(0, cx - unit),
    y: Math.max(0, cy - unit),
    size: unit * 2,
    content: '{{ verification_url }}',
    ec: 'M',
    fg: '#000000',
    bg: '#ffffff',
  };
  return element;
}

/** Append an element. */
export function addElement(blueprint: Blueprint, element: Element): Blueprint {
  return { ...blueprint, elements: [...blueprint.elements, element] };
}

/** Find an element by id. */
export function findElement(
  blueprint: Blueprint,
  id: string | null,
): Element | undefined {
  return blueprint.elements.find((element) => element.id === id);
}

/** Remove optional fields set to `undefined` by a form. */
export function dropUndefined<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as T;
}

/**
 * Change fields of one element; a field set to `undefined` is removed.
 * `type` and `id` cannot change here; use `renameElement` for the id.
 */
export function updateElement(
  blueprint: Blueprint,
  id: string,
  patch: Partial<Element>,
): Blueprint {
  const { id: _id, type: _type, ...rest } = patch as Partial<TextElement>;
  return {
    ...blueprint,
    elements: blueprint.elements.map((element) =>
      element.id === id
        ? (dropUndefined({ ...element, ...rest }) as Element)
        : element,
    ),
  };
}

/** Remove one element. */
export function removeElement(blueprint: Blueprint, id: string): Blueprint {
  return {
    ...blueprint,
    elements: blueprint.elements.filter((element) => element.id !== id),
  };
}

/**
 * Copy an element right after it, offset down and right, with a free id.
 *
 * @returns The new blueprint and the copy's id (`null` when not found).
 */
export function duplicateElement(
  blueprint: Blueprint,
  id: string,
): [Blueprint, string | null] {
  const index = blueprint.elements.findIndex((element) => element.id === id);
  if (index === -1) return [blueprint, null];
  const original = blueprint.elements[index];
  const copy = {
    ...original,
    id: uniqueId(blueprint, original.id),
    x: original.x + DUPLICATE_OFFSET,
    y: original.y + DUPLICATE_OFFSET,
  } as Element;
  const elements = [...blueprint.elements];
  elements.splice(index + 1, 0, copy);
  return [{ ...blueprint, elements }, copy.id];
}

/** Move an element to a position; coordinates are rounded and kept ≥ 0. */
export function moveElement(
  blueprint: Blueprint,
  id: string,
  x: number,
  y: number,
): Blueprint {
  return updateElement(blueprint, id, {
    x: Math.max(0, Math.round(x)),
    y: Math.max(0, Math.round(y)),
  });
}

/** Move an element by a delta. */
export function nudgeElement(
  blueprint: Blueprint,
  id: string,
  dx: number,
  dy: number,
): Blueprint {
  const element = findElement(blueprint, id);
  if (!element) return blueprint;
  return moveElement(blueprint, id, element.x + dx, element.y + dy);
}

/**
 * Move an element one step in document order (drawing order).
 *
 * @param step `-1` towards the back, `1` towards the front.
 */
export function reorderElement(
  blueprint: Blueprint,
  id: string,
  step: -1 | 1,
): Blueprint {
  const index = blueprint.elements.findIndex((element) => element.id === id);
  const target = index + step;
  if (index === -1 || target < 0 || target >= blueprint.elements.length)
    return blueprint;
  const elements = [...blueprint.elements];
  [elements[index], elements[target]] = [elements[target], elements[index]];
  return { ...blueprint, elements };
}

/** Why an id cannot be used, or `null` when it can. */
export function idProblem(
  blueprint: Blueprint,
  id: string,
  current: string | null,
): 'invalid' | 'taken' | null {
  if (!ID_PATTERN.test(id)) return 'invalid';
  if (id !== current && findElement(blueprint, id)) return 'taken';
  return null;
}

/** Rename an element; unchanged when the new id is invalid or taken. */
export function renameElement(
  blueprint: Blueprint,
  id: string,
  newId: string,
): Blueprint {
  if (idProblem(blueprint, newId, id) !== null) return blueprint;
  return {
    ...blueprint,
    elements: blueprint.elements.map((element) =>
      element.id === id ? { ...element, id: newId } : element,
    ),
  };
}

/** Set the page to the background's size; elements stay where they are. */
export function fitPageToBackground(
  blueprint: Blueprint,
  width: number,
  height: number,
): Blueprint {
  return { ...blueprint, page: { width, height } };
}

/** Undo history around the current blueprint. */
export interface History {
  past: Blueprint[];
  present: Blueprint;
  future: Blueprint[];
}

/** Start a history at a blueprint. */
export function initHistory(present: Blueprint): History {
  return { past: [], present, future: [] };
}

/** Record a new present; clears the redo stack. A no-op change is ignored. */
export function pushHistory(history: History, next: Blueprint): History {
  if (next === history.present) return history;
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
  };
}

/** Step back, if possible. */
export function undo(history: History): History {
  if (history.past.length === 0) return history;
  const past = history.past.slice(0, -1);
  return {
    past,
    present: history.past[history.past.length - 1],
    future: [history.present, ...history.future],
  };
}

/** Step forward again, if possible. */
export function redo(history: History): History {
  if (history.future.length === 0) return history;
  const [present, ...future] = history.future;
  return { past: [...history.past, history.present], present, future };
}
