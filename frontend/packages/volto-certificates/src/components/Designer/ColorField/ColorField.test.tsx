import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWith } from '../../../testing/render';
import ColorField from './ColorField';

describe('ColorField', () => {
  it('passes a valid typed color on, lowercased', () => {
    const onChange = vi.fn();
    renderWith(
      <ColorField id="c" label="Color" value="#000000" onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText('Color', { selector: '#c-text' }), {
      target: { value: '#A1B2C3' },
    });
    expect(onChange).toHaveBeenCalledWith('#a1b2c3');
  });

  it('keeps an invalid color to itself and explains', () => {
    const onChange = vi.fn();
    renderWith(
      <ColorField id="c" label="Color" value="#000000" onChange={onChange} />,
    );
    const input = screen.getByLabelText('Color', { selector: '#c-text' });
    fireEvent.change(input, { target: { value: '#12' } });
    expect(onChange).not.toHaveBeenCalled();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Use a color like #1a2b3c.')).toBeTruthy();
  });

  it('takes the picker value', () => {
    const onChange = vi.fn();
    renderWith(
      <ColorField id="c" label="Color" value="#000000" onChange={onChange} />,
    );
    fireEvent.change(
      screen.getByLabelText('Color', { selector: 'input[type=color]' }),
      {
        target: { value: '#ff0000' },
      },
    );
    expect(onChange).toHaveBeenCalledWith('#ff0000');
  });
});
