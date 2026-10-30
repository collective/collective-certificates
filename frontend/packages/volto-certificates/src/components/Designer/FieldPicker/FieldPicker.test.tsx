import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWith } from '../../../testing/render';
import FieldPicker from './FieldPicker';

const FIELDS = [
  { token: 'full_name', title: 'Full name' },
  { token: 'event_start_date', title: 'Start' },
];
const KINDS = { full_name: 'text', event_start_date: 'date' };

describe('FieldPicker', () => {
  it('offers |date only for date fields', () => {
    renderWith(
      <FieldPicker id="p" fields={FIELDS} kinds={KINDS} onInsert={vi.fn()} />,
    );
    const options = screen.getAllByRole('option') as HTMLOptionElement[];
    expect(options.map((o) => o.value)).toEqual([
      '{{ full_name }}',
      '{{ event_start_date }}',
      '{{ event_start_date|date }}',
    ]);
    expect(options[2].textContent).toBe('Start (formatted date)');
  });

  it('inserts the chosen placeholder', () => {
    const onInsert = vi.fn();
    renderWith(
      <FieldPicker id="p" fields={FIELDS} kinds={KINDS} onInsert={onInsert} />,
    );
    fireEvent.change(screen.getByLabelText('Insert field'), {
      target: { value: '{{ event_start_date|date }}' },
    });
    fireEvent.click(screen.getByText('Insert'));
    expect(onInsert).toHaveBeenCalledWith('{{ event_start_date|date }}');
  });

  it('is disabled without fields', () => {
    renderWith(
      <FieldPicker id="p" fields={[]} kinds={{}} onInsert={vi.fn()} />,
    );
    expect((screen.getByText('Insert') as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
