import { fireEvent, screen, within } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import config from '@plone/volto/registry';
import { renderWith } from '../../../testing/render';
import SampleDataWidget, {
  sampleSchema,
  sampleValues,
} from './SampleDataWidget';

/**
 * A text input, standing in for the widgets the dialog renders: the test
 * configuration's widgets are placeholders with no input to type into.
 */
const StandIn =
  (type: string) =>
  ({ id, title, value, onChange }: any) => (
    <label>
      {title}
      <input
        type={type}
        value={value ?? ''}
        onChange={(event) => onChange(id, event.target.value)}
      />
    </label>
  );

let widgets: any;

beforeAll(() => {
  widgets = config.widgets;
  config.set('widgets', {
    ...widgets,
    default: StandIn('text'),
    type: { ...widgets.type, string: StandIn('text') },
    widget: { ...widgets.widget, date: StandIn('date') },
  });
});

afterAll(() => {
  config.set('widgets', widgets);
});

const render = (
  value: Record<string, string> | null = null,
  isDisabled = false,
) => {
  const onChange = vi.fn();
  const submitted = vi.fn((event: React.FormEvent) => event.preventDefault());
  renderWith(
    <form aria-label="Content" onSubmit={submitted}>
      <SampleDataWidget
        id="sample_data"
        title="Sample data"
        value={value}
        isDisabled={isDisabled}
        onChange={onChange}
      />
    </form>,
  );
  return { onChange, submitted };
};

/** The table's rows, as `[field, value]` text. */
const rows = (): string[][] =>
  [...document.querySelectorAll('tr[data-field]')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => cell.textContent ?? ''),
  );

const dialog = (): HTMLElement =>
  document.querySelector('.ui.modal form') as HTMLElement;

/**
 * Open the dialog, and wait for its fields: Volto's `Field` is a lazy
 * component.
 */
const edit = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Edit sample data' }));
  await within(dialog()).findByLabelText('full name');
  return within(dialog());
};

describe('SampleDataWidget', () => {
  it('shows every field but the computed ones in a table', () => {
    render({ full_name: 'Ana' });
    const shown = rows();
    expect(shown.map(([field]) => field)).toContain('full name');
    expect(shown.map(([field]) => field)).not.toContain('certificate uid');
    expect(shown.map(([field]) => field)).not.toContain('verification url');
    expect(shown.find(([field]) => field === 'full name')).toEqual([
      'full name',
      'Ana',
    ]);
    expect(shown.find(([field]) => field === 'event name')?.[1]).toMatch(
      /Not set/,
    );
  });

  it('edits the values in a dialog, dates with the date widget', async () => {
    render({ full_name: 'Ana', total_hours: '8' });
    expect(document.querySelector('.ui.modal')).toBeNull();
    const form = await edit();
    expect(
      (form.getByLabelText('event start date') as HTMLInputElement).type,
    ).toBe('date');
    expect((form.getByLabelText('full name') as HTMLInputElement).value).toBe(
      'Ana',
    );
  });

  it('stores what the dialog submits, leaving emptied fields out', async () => {
    const { onChange, submitted } = render({
      full_name: 'Ana',
      total_hours: '8',
    });
    const form = await edit();
    fireEvent.change(form.getByLabelText('event name'), {
      target: { value: 'Plone' },
    });
    fireEvent.change(form.getByLabelText('total hours'), {
      target: { value: '' },
    });
    fireEvent.submit(dialog());
    expect(onChange).toHaveBeenCalledWith('sample_data', {
      full_name: 'Ana',
      event_name: 'Plone',
    });
    // The dialog closes, and its submit never reaches the content form.
    expect(document.querySelector('.ui.modal')).toBeNull();
    expect(submitted).not.toHaveBeenCalled();
  });

  it('changes nothing when the dialog is cancelled', async () => {
    const { onChange } = render({ full_name: 'Ana' });
    const form = await edit();
    fireEvent.change(form.getByLabelText('full name'), {
      target: { value: 'Bea' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(document.querySelector('.ui.modal')).toBeNull();
  });

  it('cannot be edited when disabled', () => {
    render(null, true);
    expect(
      (
        screen.getByRole('button', {
          name: 'Edit sample data',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});

describe('sampleSchema and sampleValues', () => {
  const fields = [
    { token: 'full_name', title: 'Name' },
    { token: 'event_start_date', title: 'Start' },
  ];

  it('gives dates the date widget', () => {
    const schema = sampleSchema('Sample', fields, {
      full_name: 'text',
      event_start_date: 'date',
    });
    expect(schema.fieldsets[0].fields).toEqual([
      'full_name',
      'event_start_date',
    ]);
    expect(schema.properties.event_start_date).toEqual({
      title: 'Start',
      widget: 'date',
    });
    expect(schema.properties.full_name).toEqual({
      title: 'Name',
      type: 'string',
    });
  });

  it('keeps non-empty strings of known fields only', () => {
    expect(
      sampleValues(
        { full_name: 'Ana', event_start_date: null, other: 'x' },
        fields,
      ),
    ).toEqual({ full_name: 'Ana' });
  });
});
