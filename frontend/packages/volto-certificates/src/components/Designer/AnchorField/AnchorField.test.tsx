import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWith } from '../../../testing/render';
import AnchorField from './AnchorField';

describe('AnchorField', () => {
  it('shows the current anchor and baseline', () => {
    renderWith(
      <AnchorField
        id="a"
        anchor="middle"
        baseline="hanging"
        onChange={vi.fn()}
      />,
    );
    expect((screen.getByLabelText('Center') as HTMLInputElement).checked).toBe(
      true,
    );
    expect(
      (screen.getByLabelText('Vertical position') as HTMLSelectElement).value,
    ).toBe('hanging');
  });

  it('reports the anchor and baseline separately', () => {
    const onChange = vi.fn();
    renderWith(
      <AnchorField
        id="a"
        anchor="middle"
        baseline="hanging"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('End'));
    expect(onChange).toHaveBeenLastCalledWith({ anchor: 'end' });
    fireEvent.change(screen.getByLabelText('Vertical position'), {
      target: { value: 'alphabetic' },
    });
    expect(onChange).toHaveBeenLastCalledWith({ baseline: 'alphabetic' });
  });
});
