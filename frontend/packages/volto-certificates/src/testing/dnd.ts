import { createElement } from 'react';

/**
 * The drop handler the last rendered `DndContext` was given.
 *
 * jsdom lays nothing out, so a drag cannot be simulated by pointer or
 * keyboard; calling the handler is how a test drops.
 */
export const drop: { end?: (event: unknown) => void } = {};

/**
 * `@dnd-kit/core`, with a `DndContext` that keeps its drop handler in
 * {@link drop}. Use it from `vi.mock('@dnd-kit/core', ...)`.
 *
 * @param actual The real module.
 * @returns The module to use instead.
 */
export function keepTheDrop(actual: any): any {
  const DndContext = (props: any) => {
    drop.end = props.onDragEnd;
    return createElement(actual.DndContext, props);
  };
  return { ...actual, DndContext };
}
