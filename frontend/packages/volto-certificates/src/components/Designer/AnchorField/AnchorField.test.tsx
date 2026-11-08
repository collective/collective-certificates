import { fireEvent, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { choose, loadSelect, renderWith } from '../../../testing/render';
import AnchorField from './AnchorField';

vi.mock('@plone/volto/helpers/Loadable/Loadable');
beforeAll(loadSelect);

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
    expect(screen.getByText('Hanging')).toBeTruthy();
  });

  it('reports the anchor and baseline separately', async () => {
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
    await choose('Vertical position', 'On the baseline');
    expect(onChange).toHaveBeenLastCalledWith({ baseline: 'alphabetic' });
  });
});
