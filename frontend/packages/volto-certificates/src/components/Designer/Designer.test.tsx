import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BLUEPRINTS, DATA, FIELD_KINDS } from '../../testing/fixtures';
import { FIELDS, FONTS, LEVELS, renderWith } from '../../testing/render';
import Designer from './Designer';
import type { Blueprint } from '../../blueprint/model';
import type { DesignerProps } from './Designer';

vi.mock('react-moveable', () => ({ default: () => null }));

const every = BLUEPRINTS['every-element'];
const FONT_TOKENS = [
  ...FONTS,
  { token: 'eb-garamond-bold', title: 'EB Garamond Bold' },
  { token: 'inter-bold', title: 'Inter Bold' },
];

const background = {
  url: 'data:image/png;base64,AA',
  width: 3508,
  height: 2480,
};

const props = (overrides: Partial<DesignerProps> = {}): DesignerProps => ({
  blueprint: every,
  templateUrl: '/templates/a',
  assets: {
    background,
    images: [
      {
        id: 'signature',
        title: 'Signature',
        href: '/templates/a/signature',
        url: 'data:image/png;base64,BB',
      },
    ],
  },
  fonts: FONT_TOKENS,
  fields: FIELDS,
  fieldKinds: FIELD_KINDS,
  errorCorrections: LEVELS,
  data: DATA,
  onApply: vi.fn(),
  onCancel: vi.fn(),
  ...overrides,
});

const key = (k: string, extra: KeyboardEventInit = {}) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: k, ...extra }));
  });

const selectInList = (id: string) =>
  fireEvent.click(screen.getByText(id, { selector: 'button', exact: false }));

const applied = (onApply: ReturnType<typeof vi.fn>): Blueprint =>
  onApply.mock.calls[onApply.mock.calls.length - 1][0];

describe('Designer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens as a modal dialog and locks the page scroll', () => {
    const { unmount } = renderWith(<Designer {...props()} />);
    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('applies the edited blueprint', () => {
    const p = props();
    renderWith(<Designer {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(applied(p.onApply as never)).toBe(every);
    fireEvent.click(screen.getByRole('button', { name: 'Add QR code' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(applied(p.onApply as never).elements).toHaveLength(
      every.elements.length + 1,
    );
  });

  it('announces the selection', () => {
    renderWith(<Designer {...props()} />);
    expect(screen.getByText('Nothing selected')).toBeTruthy();
    selectInList('signer');
    expect(screen.getByText('Selected: signer')).toBeTruthy();
  });

  it('runs keyboard commands on the selection', () => {
    const p = props();
    renderWith(<Designer {...p} />);
    selectInList('start');
    key('ArrowRight', { shiftKey: true });
    key('ArrowDown');
    key('d', { ctrlKey: true });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    let result = applied(p.onApply as never);
    expect(result.elements.find((e) => e.id === 'start')).toMatchObject({
      x: 110,
      y: 701,
    });
    expect(result.elements.map((e) => e.id)).toContain('start-2');
    key('Delete');
    key('z', { ctrlKey: true });
    key('z', { ctrlKey: true, shiftKey: true });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    result = applied(p.onApply as never);
    expect(result.elements.map((e) => e.id)).not.toContain('start-2');
  });

  it('ignores keys typed into a control', () => {
    const p = props();
    renderWith(<Designer {...p} />);
    selectInList('start');
    const x = screen.getByLabelText('X');
    fireEvent.keyDown(x, { key: 'Delete' });
    act(() => {
      x.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }),
      );
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(applied(p.onApply as never).elements.map((e) => e.id)).toContain(
      'start',
    );
  });

  it('zooms with the keys and the toolbar', () => {
    renderWith(<Designer {...props()} />);
    const level = () => screen.getByText(/^Zoom \d+%$/).textContent;
    const start = level();
    key('+');
    expect(level()).not.toBe(start);
    key('-');
    expect(level()).toBe(start);
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(level()).not.toBe(start);
  });

  it('cancels at once when nothing changed', () => {
    const p = props();
    renderWith(<Designer {...p} />);
    key('Escape');
    expect(p.onCancel).toHaveBeenCalled();
  });

  it('asks before discarding changes', () => {
    const p = props();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderWith(<Designer {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add text' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(confirm).toHaveBeenCalledWith(
      'Discard the changes made in the designer?',
    );
    expect(p.onCancel).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(p.onCancel).toHaveBeenCalled();
  });

  it('lists local and server problems', () => {
    renderWith(
      <Designer
        {...props({
          fonts: FONTS,
          serverErrors: [
            { element: 'qr', path: '/elements/7', message: 'Too big' },
          ],
        })}
      />,
    );
    const problems = screen.getByRole('alert');
    expect(problems.textContent).toContain('unknown font');
    expect(problems.textContent).toContain('Too big');
  });

  it('offers to fit the page to the background', () => {
    const p = props({
      assets: {
        background: { url: 'x', width: 1000, height: 700 },
        images: [],
      },
    });
    renderWith(<Designer {...p} />);
    expect(
      screen.getByText(/The page is 3508×2480 but the background is 1000×700/),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Fit template to background' }),
    );
    expect(screen.queryByText(/but the background is/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(applied(p.onApply as never).page).toEqual({
      width: 1000,
      height: 700,
    });
  });

  it('edits the selected element through the panel', () => {
    const p = props();
    renderWith(<Designer {...p} />);
    selectInList('start');
    fireEvent.change(screen.getByLabelText('Size'), {
      target: { value: '61' },
    });
    fireEvent.change(screen.getByLabelText('Identifier'), {
      target: { value: 'opening' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(
      applied(p.onApply as never).elements.find((e) => e.id === 'opening'),
    ).toMatchObject({ size: 61 });
  });

  it('reorders, duplicates and deletes from the toolbar and list', () => {
    const p = props();
    renderWith(<Designer {...p} />);
    fireEvent.click(screen.getByLabelText('Move start back'));
    selectInList('end');
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    const ids = applied(p.onApply as never).elements.map((e) => e.id);
    expect(ids.indexOf('start')).toBeLessThan(ids.indexOf('logo'));
    expect(ids).toContain('end');
    expect(ids).not.toContain('end-2');
  });

  it('reads the background size from the image when unknown', async () => {
    const OriginalImage = globalThis.Image;
    globalThis.Image = class {
      naturalWidth = 1000;
      naturalHeight = 700;
      onload: () => void = () => {};
      onerror: () => void = () => {};
      set src(_value: string) {
        setTimeout(() => this.onload());
      }
    } as unknown as typeof Image;
    renderWith(
      <Designer
        {...props({ assets: { background: { url: 'x' }, images: [] } })}
      />,
    );
    expect(await screen.findByText(/background is 1000×700/)).toBeTruthy();
    globalThis.Image = OriginalImage;
  });
});
