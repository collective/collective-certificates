import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  choose,
  loadSelect,
  openMenu,
  renderWith,
  selectInput,
} from '../../../testing/render';
import FieldPicker from './FieldPicker';
import type { Term } from '../../../reducers/certificates';

vi.mock('@plone/volto/helpers/Loadable/Loadable');
beforeAll(loadSelect);

const FIELDS: Term[] = [
  { token: 'full_name', title: 'Name' },
  { token: 'event_start_date', title: 'Start' },
];
const KINDS = { full_name: 'text', event_start_date: 'date' };

describe('FieldPicker', () => {
  it('offers |date only for date fields', async () => {
    renderWith(
      <FieldPicker id="p" fields={FIELDS} kinds={KINDS} onInsert={vi.fn()} />,
    );
    const options = await openMenu('Insert field');
    expect(options.map((o) => o.textContent)).toEqual([
      'Name',
      'Start',
      'Start (formatted date)',
    ]);
  });

  it('inserts the chosen placeholder, and again', async () => {
    const onInsert = vi.fn();
    renderWith(
      <FieldPicker id="p" fields={FIELDS} kinds={KINDS} onInsert={onInsert} />,
    );
    await choose('Insert field', 'Start (formatted date)');
    expect(onInsert).toHaveBeenCalledWith('{{ event_start_date|date }}');
    await choose('Insert field', 'Start (formatted date)');
    expect(onInsert).toHaveBeenCalledTimes(2);
  });

  it('is disabled without fields', () => {
    renderWith(
      <FieldPicker id="p" fields={[]} kinds={{}} onInsert={vi.fn()} />,
    );
    expect(selectInput('Insert field').disabled).toBe(true);
  });
});
