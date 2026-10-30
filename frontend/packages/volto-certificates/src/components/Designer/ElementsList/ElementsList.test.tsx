import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BLUEPRINTS } from '../../../testing/fixtures';
import { renderWith } from '../../../testing/render';
import ElementsList from './ElementsList';

const { elements } = BLUEPRINTS['every-element'];

describe('ElementsList', () => {
  it('lists every element in drawing order, marking the selection', () => {
    renderWith(
      <ElementsList
        elements={elements}
        selection="middle"
        onSelect={vi.fn()}
        onReorder={vi.fn()}
      />,
    );
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

  it('selects and reorders', () => {
    const onSelect = vi.fn();
    const onReorder = vi.fn();
    renderWith(
      <ElementsList
        elements={elements}
        selection={null}
        onSelect={onSelect}
        onReorder={onReorder}
      />,
    );
    fireEvent.click(screen.getByText('signer', { exact: false }));
    expect(onSelect).toHaveBeenCalledWith('signer');
    fireEvent.click(screen.getByLabelText('Move signer back'));
    expect(onReorder).toHaveBeenCalledWith('signer', -1);
    fireEvent.click(screen.getByLabelText('Move signer forward'));
    expect(onReorder).toHaveBeenCalledWith('signer', 1);
  });

  it('cannot move the first back or the last forward', () => {
    renderWith(
      <ElementsList
        elements={elements}
        selection={null}
        onSelect={vi.fn()}
        onReorder={vi.fn()}
      />,
    );
    const first = elements[0].id;
    const last = elements[elements.length - 1].id;
    expect(
      (screen.getByLabelText(`Move ${first} back`) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByLabelText(`Move ${last} forward`) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
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
  });
});
