import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWith } from '../../../testing/render';
import SampleDataWidget from './SampleDataWidget';

const render = (value: Record<string, string> | null = null) => {
  const onChange = vi.fn();
  renderWith(
    <SampleDataWidget
      id="sample_data"
      title="Sample data"
      value={value}
      onChange={onChange}
    />,
  );
  return onChange;
};

describe('SampleDataWidget', () => {
  it('offers every field but the computed ones', () => {
    render();
    expect(screen.getByLabelText('full name')).toBeTruthy();
    expect(screen.queryByLabelText('certificate uid')).toBeNull();
    expect(screen.queryByLabelText('verification url')).toBeNull();
  });

  it('uses date inputs for dates', () => {
    render();
    expect(
      (screen.getByLabelText('event start date') as HTMLInputElement).type,
    ).toBe('date');
    expect((screen.getByLabelText('full name') as HTMLInputElement).type).toBe(
      'text',
    );
  });

  it('sets and clears values', () => {
    const onChange = render({ full_name: 'Ana', total_hours: '8' });
    expect((screen.getByLabelText('full name') as HTMLInputElement).value).toBe(
      'Ana',
    );
    fireEvent.change(screen.getByLabelText('event name'), {
      target: { value: 'Plone' },
    });
    expect(onChange).toHaveBeenLastCalledWith('sample_data', {
      full_name: 'Ana',
      total_hours: '8',
      event_name: 'Plone',
    });
    fireEvent.change(screen.getByLabelText('total hours'), {
      target: { value: '' },
    });
    expect(onChange).toHaveBeenLastCalledWith('sample_data', {
      full_name: 'Ana',
    });
  });
});
