import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET_CERTIFICATE_VOCABULARIES } from '../actions/certificates';
import { emptyBlueprint } from '../blueprint/model';
import { initialState } from '../reducers/certificates';
import { BLUEPRINTS } from '../testing/fixtures';
import useCertificateVocabularies from './useCertificateVocabularies';
import useDesigner, {
  designerReducer,
  initDesigner,
  nextZoom,
} from './useDesigner';
import useFontFaces from './useFontFaces';
import type { CertificatesState } from '../reducers/certificates';
import type { DesignerAction, DesignerState } from './useDesigner';

const run = (state: DesignerState, ...actions: DesignerAction[]) =>
  actions.reduce(designerReducer, state);
const present = (state: DesignerState) => state.history.present;
const ids = (state: DesignerState) => present(state).elements.map((e) => e.id);

describe('designerReducer', () => {
  const start = initDesigner(BLUEPRINTS.sample);

  it('selects', () => {
    expect(run(start, { type: 'select', id: 'name' }).selection).toBe('name');
  });

  it('adds an element and selects it', () => {
    const state = run(initDesigner(emptyBlueprint()), {
      type: 'add',
      elementType: 'qrcode',
    });
    expect(ids(state)).toEqual(['qr']);
    expect(state.selection).toBe('qr');
  });

  it('adds an image showing the given asset', () => {
    const state = run(initDesigner(emptyBlueprint()), {
      type: 'add',
      elementType: 'image',
      asset: 'signature',
    });
    expect(present(state).elements[0]).toMatchObject({ asset: 'signature' });
  });

  it('updates, moves, nudges and reorders undoably', () => {
    const state = run(
      start,
      { type: 'update', id: 'name', patch: { size: 7 } },
      { type: 'move', id: 'name', x: 10, y: 20 },
      { type: 'nudge', id: 'name', dx: 1, dy: 1 },
      { type: 'reorder', id: 'name', step: -1 },
    );
    expect(state.history.past).toHaveLength(4);
    const name = present(state).elements.find((e) => e.id === 'name');
    expect(name).toMatchObject({ size: 7, x: 11, y: 21 });
    const back = run(state, { type: 'undo' }, { type: 'undo' });
    expect(present(back).elements.find((e) => e.id === 'name')).toMatchObject({
      x: 10,
      y: 20,
    });
    expect(present(run(back, { type: 'redo' }, { type: 'redo' }))).toBe(
      present(state),
    );
  });

  it('renames and follows the selection; refuses a taken id', () => {
    const selected = run(start, { type: 'select', id: 'name' });
    const renamed = run(selected, { type: 'rename', id: 'name', newId: 'who' });
    expect(renamed.selection).toBe('who');
    expect(ids(renamed)).toContain('who');
    const other = run(start, { type: 'rename', id: 'name', newId: 'Bad' });
    expect(other).toBe(start);
    const unselected = run(start, { type: 'rename', id: 'name', newId: 'who' });
    expect(unselected.selection).toBeNull();
  });

  it('removes and clears the selection of the removed element', () => {
    const state = run(
      start,
      { type: 'select', id: 'name' },
      { type: 'remove', id: 'name' },
    );
    expect(ids(state)).not.toContain('name');
    expect(state.selection).toBeNull();
    const kept = run(
      start,
      { type: 'select', id: 'event' },
      { type: 'remove', id: 'name' },
    );
    expect(kept.selection).toBe('event');
  });

  it('duplicates and selects the copy; ignores unknown ids', () => {
    const state = run(start, { type: 'duplicate', id: 'name' });
    expect(state.selection).toBe('name-2');
    expect(run(start, { type: 'duplicate', id: 'nope' })).toBe(start);
  });

  it('drops a selection that undo removes', () => {
    const added = run(initDesigner(emptyBlueprint()), {
      type: 'add',
      elementType: 'text',
    });
    expect(run(added, { type: 'undo' }).selection).toBeNull();
    expect(run(added, { type: 'undo' }, { type: 'redo' }).selection).toBeNull();
  });

  it('fits the page, zooms and resets', () => {
    const fitted = run(start, { type: 'fitPage', width: 10, height: 20 });
    expect(present(fitted).page).toEqual({ width: 10, height: 20 });
    const zoomed = run(fitted, { type: 'zoom', zoom: 0.5 });
    expect(zoomed.zoom).toBe(0.5);
    const reset = run(zoomed, { type: 'reset', blueprint: BLUEPRINTS.minimal });
    expect(present(reset)).toBe(BLUEPRINTS.minimal);
    expect(reset.history.past).toEqual([]);
    expect(reset.zoom).toBe(0.5);
  });

  it('ignores unknown actions', () => {
    expect(designerReducer(start, { type: 'nope' } as never)).toBe(start);
  });
});

describe('nextZoom', () => {
  const steps = [0.25, 0.5, 1];

  it('steps in and out and stops at the ends', () => {
    expect(nextZoom(steps, 0.5, 1)).toBe(1);
    expect(nextZoom(steps, 0.5, -1)).toBe(0.25);
    expect(nextZoom(steps, 1, 1)).toBe(1);
    expect(nextZoom(steps, 0.25, -1)).toBe(0.25);
    expect(nextZoom(steps, 0.3, 1)).toBe(0.5);
  });
});

describe('useDesigner', () => {
  it('reports selection, undo/redo and dirtiness', () => {
    const { result } = renderHook(() => useDesigner(BLUEPRINTS.sample, 0.5));
    expect(result.current.dirty).toBe(false);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.state.zoom).toBe(0.5);
    act(() => result.current.dispatch({ type: 'select', id: 'name' }));
    expect(result.current.selected?.id).toBe('name');
    act(() => result.current.dispatch({ type: 'remove', id: 'event' }));
    expect(result.current.dirty).toBe(true);
    expect(result.current.canUndo).toBe(true);
    act(() => result.current.dispatch({ type: 'undo' }));
    expect(result.current.dirty).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });
});

describe('useCertificateVocabularies', () => {
  // A store that records dispatched actions and never changes state.
  const mockStore = (state: { certificates: CertificatesState }) => {
    const actions: { type: string }[] = [];
    return {
      getState: () => state,
      subscribe: () => () => {},
      dispatch: (action: { type: string }) => {
        actions.push(action);
        return action;
      },
      getActions: () => actions,
    };
  };
  const wrapper =
    (store: ReturnType<typeof mockStore>) =>
    ({ children }: { children: ReactNode }) => (
      <Provider store={store as never}>{children}</Provider>
    );

  it('loads the vocabularies once', () => {
    const store = mockStore({ certificates: initialState });
    const { result } = renderHook(() => useCertificateVocabularies(), {
      wrapper: wrapper(store),
    });
    expect(store.getActions().map((a) => a.type)).toEqual([
      GET_CERTIFICATE_VOCABULARIES,
    ]);
    expect(result.current).toBe(initialState);
  });

  it('does not reload loaded vocabularies', () => {
    const loaded: CertificatesState = {
      ...initialState,
      vocabularies: { loading: false, loaded: true, error: null },
    };
    const store = mockStore({ certificates: loaded });
    renderHook(() => useCertificateVocabularies(), { wrapper: wrapper(store) });
    expect(store.getActions()).toEqual([]);
  });
});

describe('useFontFaces', () => {
  afterEach(() => {
    document.getElementById('collective-certificates-fonts')?.remove();
  });

  it('declares the faces and is ready once they load', async () => {
    const load = vi.fn((_font: string) => Promise.resolve([]));
    Object.defineProperty(document, 'fonts', {
      value: { load },
      configurable: true,
    });
    const { result } = renderHook(() => useFontFaces(['inter', 'caveat']));
    await waitFor(() => expect(result.current).toBe(true));
    expect(load.mock.calls.map((call) => call[0])).toEqual([
      '16px "inter"',
      '16px "caveat"',
    ]);
    const style = document.getElementById('collective-certificates-fonts');
    expect(style?.textContent).toContain('font-family: "caveat"');
  });

  it('is ready when a face fails to load', async () => {
    Object.defineProperty(document, 'fonts', {
      value: { load: () => Promise.reject(new Error('404')) },
      configurable: true,
    });
    const { result } = renderHook(() => useFontFaces(['inter']));
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('is ready at once with no fonts', async () => {
    const { result } = renderHook(() => useFontFaces([]));
    await waitFor(() => expect(result.current).toBe(true));
  });
});
