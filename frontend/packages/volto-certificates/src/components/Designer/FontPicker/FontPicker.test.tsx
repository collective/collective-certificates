import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FONTS, renderWith } from '../../../testing/render';
import FontPicker from './FontPicker';

describe('FontPicker', () => {
  it('lists the fonts, each in its own family', () => {
    renderWith(
      <FontPicker id="f" value="inter" fonts={FONTS} onChange={vi.fn()} />,
    );
    const options = screen.getAllByRole('option') as HTMLOptionElement[];
    expect(options.map((o) => o.textContent)).toEqual([
      'Inter',
      'EB Garamond',
      'Caveat',
    ]);
    expect(options[2].style.fontFamily).toBe('"caveat"');
  });

  it('reports the chosen token', () => {
    const onChange = vi.fn();
    renderWith(
      <FontPicker id="f" value="inter" fonts={FONTS} onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText('Font'), {
      target: { value: 'caveat' },
    });
    expect(onChange).toHaveBeenCalledWith('caveat');
  });

  it('keeps an unknown current font selectable', () => {
    renderWith(
      <FontPicker id="f" value="gone" fonts={FONTS} onChange={vi.fn()} />,
    );
    expect((screen.getByLabelText('Font') as HTMLSelectElement).value).toBe(
      'gone',
    );
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });
});
