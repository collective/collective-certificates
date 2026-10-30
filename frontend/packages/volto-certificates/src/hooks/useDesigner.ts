import { useReducer } from 'react';
import {
  addElement,
  duplicateElement,
  findElement,
  fitPageToBackground,
  initHistory,
  moveElement,
  newElement,
  nudgeElement,
  pushHistory,
  redo,
  removeElement,
  renameElement,
  reorderElement,
  undo,
  updateElement,
} from '../blueprint/ops';
import type { Blueprint, Element, ElementType } from '../blueprint/model';
import type { History } from '../blueprint/ops';

export interface DesignerState {
  history: History;
  /** Id of the selected element. */
  selection: string | null;
  zoom: number;
}

export type DesignerAction =
  | { type: 'select'; id: string | null }
  | { type: 'add'; elementType: ElementType; font?: string; asset?: string }
  | { type: 'update'; id: string; patch: Partial<Element> }
  | { type: 'rename'; id: string; newId: string }
  | { type: 'remove'; id: string }
  | { type: 'duplicate'; id: string }
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'nudge'; id: string; dx: number; dy: number }
  | { type: 'reorder'; id: string; step: -1 | 1 }
  | { type: 'fitPage'; width: number; height: number }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'zoom'; zoom: number }
  | { type: 'reset'; blueprint: Blueprint };

/** Start the designer on a blueprint. */
export function initDesigner(blueprint: Blueprint, zoom = 0.25): DesignerState {
  return { history: initHistory(blueprint), selection: null, zoom };
}

const change = (state: DesignerState, next: Blueprint): DesignerState => ({
  ...state,
  history: pushHistory(state.history, next),
});

// After undo or redo, keep the selection only if the element still exists.
const keepSelection = (history: History, selection: string | null) =>
  findElement(history.present, selection) ? selection : null;

/** The designer's state transitions; every blueprint change is undoable. */
export function designerReducer(
  state: DesignerState,
  action: DesignerAction,
): DesignerState {
  const blueprint = state.history.present;
  switch (action.type) {
    case 'select':
      return { ...state, selection: action.id };
    case 'add': {
      const element = newElement(
        blueprint,
        action.elementType,
        action.font,
        action.asset,
      );
      return {
        ...change(state, addElement(blueprint, element)),
        selection: element.id,
      };
    }
    case 'update':
      return change(state, updateElement(blueprint, action.id, action.patch));
    case 'rename': {
      const next = renameElement(blueprint, action.id, action.newId);
      if (next === blueprint) return state;
      return {
        ...change(state, next),
        selection:
          state.selection === action.id ? action.newId : state.selection,
      };
    }
    case 'remove':
      return {
        ...change(state, removeElement(blueprint, action.id)),
        selection: state.selection === action.id ? null : state.selection,
      };
    case 'duplicate': {
      const [next, copy] = duplicateElement(blueprint, action.id);
      if (copy === null) return state;
      return { ...change(state, next), selection: copy };
    }
    case 'move':
      return change(
        state,
        moveElement(blueprint, action.id, action.x, action.y),
      );
    case 'nudge':
      return change(
        state,
        nudgeElement(blueprint, action.id, action.dx, action.dy),
      );
    case 'reorder':
      return change(state, reorderElement(blueprint, action.id, action.step));
    case 'fitPage':
      return change(
        state,
        fitPageToBackground(blueprint, action.width, action.height),
      );
    case 'undo': {
      const history = undo(state.history);
      return {
        ...state,
        history,
        selection: keepSelection(history, state.selection),
      };
    }
    case 'redo': {
      const history = redo(state.history);
      return {
        ...state,
        history,
        selection: keepSelection(history, state.selection),
      };
    }
    case 'zoom':
      return { ...state, zoom: action.zoom };
    case 'reset':
      return initDesigner(action.blueprint, state.zoom);
    default:
      return state;
  }
}

/**
 * Step through zoom levels.
 *
 * @param steps Ascending zoom levels.
 * @param direction `1` to zoom in, `-1` to zoom out.
 * @returns The next level, or the current one at either end.
 */
export function nextZoom(
  steps: readonly number[],
  zoom: number,
  direction: 1 | -1,
): number {
  if (direction === 1) return steps.find((step) => step > zoom) ?? zoom;
  return [...steps].reverse().find((step) => step < zoom) ?? zoom;
}

/** Designer state for a component. */
export default function useDesigner(blueprint: Blueprint, zoom?: number) {
  const [state, dispatch] = useReducer(designerReducer, undefined, () =>
    initDesigner(blueprint, zoom),
  );
  return {
    state,
    dispatch,
    blueprint: state.history.present,
    selected: findElement(state.history.present, state.selection) ?? null,
    canUndo: state.history.past.length > 0,
    canRedo: state.history.future.length > 0,
    dirty: state.history.present !== blueprint,
  };
}
