import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VALIDATE_BLUEPRINT } from '../../../actions/certificates';
import { emptyBlueprint } from '../../../blueprint/model';
import { BLUEPRINTS } from '../../../testing/fixtures';
import { LOADED, fakeStore, renderWith } from '../../../testing/render';
import BlueprintWidget from './BlueprintWidget';
import type { BlueprintWidgetProps, TemplateFormData } from './BlueprintWidget';

vi.mock('react-moveable', () => ({ default: () => null }));

const minimal = BLUEPRINTS.minimal;

const background = {
  download: 'http://localhost:3000/templates/a/@@download/background',
  width: 3508,
  height: 2480,
};

const props = (
  overrides: Partial<BlueprintWidgetProps> = {},
): BlueprintWidgetProps => ({
  id: 'blueprint',
  title: 'Blueprint',
  value: minimal,
  formData: { '@id': 'http://localhost:3000/templates/a', background },
  onChange: vi.fn(),
  ...overrides,
});

const open = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Open designer' }));
const apply = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

describe('BlueprintWidget', () => {
  it('previews the blueprint with the form background', () => {
    const { container } = renderWith(<BlueprintWidget {...props()} />);
    const preview = container.querySelector('.certificate-blueprint-preview');
    expect(preview?.querySelector('svg')).toBeTruthy();
    expect(preview?.innerHTML).toContain('/templates/a/@@download/background');
    expect(screen.getByText('1 element')).toBeTruthy();
  });

  it('draws the images inside the template it edits', () => {
    const store = fakeStore({
      certificates: LOADED,
      content: {
        data: {
          '@id': 'http://localhost:3000/templates/a',
          items: [
            {
              '@id': 'http://localhost:3000/templates/a/signature',
              '@type': 'Image',
              id: 'signature',
              title: 'Signature',
            },
          ],
        },
      },
    });
    const { container } = renderWith(
      <BlueprintWidget {...props({ value: BLUEPRINTS.sample })} />,
      store,
    );
    expect(
      container.querySelector('.certificate-blueprint-preview')?.innerHTML,
    ).toContain('/templates/a/signature/@@images/image');
  });

  it('ignores the items of other content', () => {
    const store = fakeStore({
      certificates: LOADED,
      content: {
        data: {
          '@id': 'http://localhost:3000/templates',
          items: [
            {
              '@id': 'http://localhost:3000/templates/signature',
              '@type': 'Image',
              id: 'signature',
            },
          ],
        },
      },
    });
    const { container } = renderWith(
      <BlueprintWidget {...props({ value: BLUEPRINTS.sample })} />,
      store,
    );
    expect(
      container.querySelector('.certificate-blueprint-preview')?.innerHTML,
    ).not.toContain('@@images/image');
  });

  it('is disabled until a background is uploaded', () => {
    renderWith(<BlueprintWidget {...props({ formData: {} })} />);
    expect(
      (
        screen.getByRole('button', {
          name: 'Open designer',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(screen.getByText('Upload a background first.')).toBeTruthy();
  });

  it('starts from an empty page the size of the background', () => {
    const { container } = renderWith(
      <BlueprintWidget
        {...props({
          value: null,
          formData: { background: { ...background, width: 1000, height: 700 } },
        })}
      />,
    );
    expect(screen.getByText('No elements')).toBeTruthy();
    expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe(
      '0 0 1000 700',
    );
  });

  it('reads a JSON string value', () => {
    renderWith(
      <BlueprintWidget {...props({ value: JSON.stringify(minimal) })} />,
    );
    expect(screen.getByText('1 element')).toBeTruthy();
  });

  it('falls back to the global form state', () => {
    const store = fakeStore({
      certificates: LOADED,
      form: { global: { background } satisfies TemplateFormData },
    });
    renderWith(<BlueprintWidget {...props({ formData: undefined })} />, store);
    expect(
      (
        screen.getByRole('button', {
          name: 'Open designer',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });

  it('opens the designer in the body and cancels', () => {
    const { container } = renderWith(<BlueprintWidget {...props()} />);
    open();
    const dialog = screen.getByRole('dialog');
    expect(container.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('applies after the server accepts the blueprint', async () => {
    const store = fakeStore({ certificates: LOADED }, (action) =>
      action.type === VALIDATE_BLUEPRINT
        ? Promise.resolve({ valid: true, errors: [] })
        : undefined,
    );
    const p = props();
    renderWith(<BlueprintWidget {...p} />, store);
    open();
    apply();
    await waitFor(() =>
      expect(p.onChange).toHaveBeenCalledWith('blueprint', minimal),
    );
    expect(store.actions.map((a) => a.type)).toContain(VALIDATE_BLUEPRINT);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows what the server refused and stays open', async () => {
    const store = fakeStore({ certificates: LOADED }, () =>
      Promise.resolve({
        valid: false,
        errors: [{ element: 'name', path: '/elements/0', message: 'Nope' }],
      }),
    );
    const p = props();
    renderWith(<BlueprintWidget {...p} />, store);
    open();
    apply();
    expect(await screen.findByText('Nope')).toBeTruthy();
    expect(p.onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('reports a failed request', async () => {
    const store = fakeStore({ certificates: LOADED }, () =>
      Promise.reject(new Error('down')),
    );
    renderWith(<BlueprintWidget {...props()} />, store);
    open();
    apply();
    expect(await screen.findByText(/@validate-blueprint/)).toBeTruthy();
  });

  it('validates locally while the template is being added', () => {
    const p = props({ formData: { background } });
    renderWith(<BlueprintWidget {...p} />);
    open();
    apply();
    expect(p.onChange).toHaveBeenCalledWith('blueprint', minimal);
  });

  it('refuses locally invalid blueprints while adding', () => {
    const bad = {
      ...emptyBlueprint(),
      elements: [{ ...minimal.elements[0], font: 'unknown' }],
    };
    const p = props({ value: bad as never, formData: { background } });
    renderWith(<BlueprintWidget {...p} />);
    open();
    apply();
    expect(p.onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('unknown font');
  });

  it('explains a preview that cannot be drawn', () => {
    const bad = {
      ...minimal,
      elements: [{ ...minimal.elements[0], content: '{{ nope }}' }],
    };
    renderWith(<BlueprintWidget {...props({ value: bad as never })} />);
    expect(screen.getByText(/The preview cannot be drawn/)).toBeTruthy();
  });
});
