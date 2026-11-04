import { act, fireEvent, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { BLUEPRINTS } from '../../../testing/fixtures';
import { drop } from '../../../testing/dnd';
import { loadSelect, renderWith } from '../../../testing/render';
import ElementsList from './ElementsList';

vi.mock('@plone/volto/helpers/Loadable/Loadable');
vi.mock('@dnd-kit/core', async (importOriginal) =>
  (await import('../../../testing/dnd')).keepTheDrop(await importOriginal()),
);
beforeAll(loadSelect);

const { elements } = BLUEPRINTS['every-element'];

const render = (selection: string | null = null) => {
  const onSelect = vi.fn();
  const onReorder = vi.fn();
  renderWith(
    <ElementsList
      elements={elements}
      selection={selection}
      onSelect={onSelect}
      onReorder={onReorder}
    />,
  );
  return { onSelect, onReorder };
};

describe('ElementsList', () => {
  it('lists every element in drawing order, marking the selection', () => {
    render('middle');
    const buttons = screen
      .getAllByRole('button')
      .filter((b) => b.className === 'certificate-element-select');
    expect(buttons.map((b) => b.textContent?.split(' ').pop())).toEqual(
      elements.map((e) => e.id),
    );
    const pressed = buttons.filter(
      (b) => b.getAttribute('aria-pressed') === 'true',
    );
    expect(pressed.map((b) => b.textContent)).toEqual(['Text middle']);
  });

  it('selects', () => {
    const { onSelect } = render();
    fireEvent.click(screen.getByText('signer', { exact: false }));
    expect(onSelect).toHaveBeenCalledWith('signer');
  });

  it('gives every element a drag handle named for it', () => {
    render();
    for (const { id } of elements)
      expect(screen.getByRole('button', { name: `Move ${id}` })).toBeTruthy();
  });

  it("reorders when an element is dropped in another's place", () => {
    const { onReorder } = render();
    act(() => drop.end!({ active: { id: 'signer' }, over: { id: 'logo' } }));
    expect(onReorder).toHaveBeenCalledWith('signer', 'logo');
  });

  it('does nothing for a drop where it started, or outside the list', () => {
    const { onReorder } = render();
    act(() => drop.end!({ active: { id: 'signer' }, over: { id: 'signer' } }));
    act(() => drop.end!({ active: { id: 'signer' }, over: null }));
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('explains an empty blueprint', () => {
    renderWith(
      <ElementsList
        elements={[]}
        selection={null}
        onSelect={vi.fn()}
        onReorder={vi.fn()}
      />,
    );
    expect(
      screen.getByText('No elements yet. Add one from the toolbar.'),
    ).toBeTruthy();
    expect(screen.queryByText(/Drag to reorder/)).toBeNull();
  });
});
