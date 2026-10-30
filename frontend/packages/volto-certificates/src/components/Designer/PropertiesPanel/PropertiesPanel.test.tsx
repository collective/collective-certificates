import { fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  findElement,
  renameElement,
  updateElement,
} from '../../../blueprint/ops';
import { BLUEPRINTS, FIELD_KINDS } from '../../../testing/fixtures';
import { FIELDS, FONTS, LEVELS, renderWith } from '../../../testing/render';
import PropertiesPanel from './PropertiesPanel';
import type {
  Blueprint,
  Element,
  ImageElement,
} from '../../../blueprint/model';

const every = BLUEPRINTS['every-element'];

/** The panel wired to a blueprint, as the designer does. */
function Harness({
  initial,
  id,
  onBlueprint,
}: {
  initial: Blueprint;
  id: string;
  onBlueprint: (blueprint: Blueprint) => void;
}) {
  const [blueprint, setBlueprint] = useState(initial);
  const [current, setCurrent] = useState(id);
  const commit = (next: Blueprint) => {
    setBlueprint(next);
    onBlueprint(next);
  };
  return (
    <PropertiesPanel
      element={findElement(blueprint, current) ?? null}
      blueprint={blueprint}
      fonts={FONTS}
      fields={FIELDS}
      kinds={FIELD_KINDS}
      errorCorrections={LEVELS}
      assets={ASSETS}
      onChange={(patch: Partial<Element>) =>
        commit(updateElement(blueprint, current, patch))
      }
      onRename={(newId) => {
        commit(renameElement(blueprint, current, newId));
        setCurrent(newId);
      }}
    />
  );
}

const ASSETS = [
  { value: 'background', label: 'Background' },
  { value: 'signature', label: 'Signature' },
];

const setup = (id: string) => {
  const onBlueprint = vi.fn();
  renderWith(<Harness initial={every} id={id} onBlueprint={onBlueprint} />);
  const last = (): Element =>
    onBlueprint.mock.calls[onBlueprint.mock.calls.length - 1][0].elements.find(
      (e: Element) =>
        e.id === screen.getByLabelText<HTMLInputElement>('Identifier').value,
    );
  return { onBlueprint, last };
};

const change = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('PropertiesPanel', () => {
  it('asks for a selection when there is none', () => {
    renderWith(
      <PropertiesPanel
        element={null}
        blueprint={every}
        fonts={FONTS}
        fields={FIELDS}
        kinds={FIELD_KINDS}
        errorCorrections={LEVELS}
        assets={ASSETS}
        onChange={vi.fn()}
        onRename={vi.fn()}
      />,
    );
    expect(screen.getByText('Select an element to edit it.')).toBeTruthy();
  });

  it('round-trips the text fields', () => {
    const { last } = setup('start');
    change('X', '120');
    change('Y', '130');
    change('Size', '44');
    change('Font', 'caveat');
    change('Content', 'Hello');
    fireEvent.click(screen.getByLabelText('End'));
    change('Vertical position', 'hanging');
    change('Maximum width', '900');
    fireEvent.click(screen.getByLabelText('Shrink to fit the maximum width'));
    expect(last()).toMatchObject({
      x: 120,
      y: 130,
      size: 44,
      font: 'caveat',
      content: 'Hello',
      anchor: 'end',
      baseline: 'hanging',
      max_width: 900,
      fit: 'shrink',
    });
    change('Maximum width', '');
    expect('max_width' in last()).toBe(false);
  });

  it('inserts a field at the cursor', () => {
    const { last } = setup('start');
    const content = screen.getByLabelText('Content') as HTMLTextAreaElement;
    change('Content', 'Dear , welcome');
    content.setSelectionRange(5, 5);
    change('Insert field', '{{ full_name }}');
    fireEvent.click(screen.getByText('Insert'));
    expect(last()).toMatchObject({ content: 'Dear {{ full_name }}, welcome' });
  });

  it('ignores sizes below 1 and keeps positions at 0 or more', () => {
    const { onBlueprint } = setup('start');
    change('Size', '0');
    change('X', '-5');
    expect(onBlueprint).not.toHaveBeenCalled();
    change('X', '0');
    expect(onBlueprint).toHaveBeenCalledTimes(1);
  });

  it('renames only to a free valid id, and says why not', () => {
    const { last } = setup('start');
    change('Identifier', 'Bad Id');
    expect(screen.getByText(/Use a lowercase letter/)).toBeTruthy();
    change('Identifier', 'middle');
    expect(
      screen.getByText('Another element has this identifier.'),
    ).toBeTruthy();
    change('Identifier', 'opening');
    expect(last().id).toBe('opening');
  });

  it('keeps an image proportional unless unlocked', () => {
    const { last } = setup('logo');
    change('Width', '350');
    expect(last()).toMatchObject({ width: 350, height: 250 });
    fireEvent.click(screen.getByLabelText('Keep proportions'));
    change('Height', '100');
    expect(last()).toMatchObject({ width: 350, height: 100 });
    change('Image', 'signature');
    expect(last()).toMatchObject({ asset: 'signature' });
  });

  it('lists the images it is given, and shows a missing one', () => {
    const image = findElement(every, 'logo') as ImageElement;
    renderWith(
      <PropertiesPanel
        element={{ ...image, asset: 'gone' }}
        blueprint={every}
        fonts={FONTS}
        fields={FIELDS}
        kinds={FIELD_KINDS}
        errorCorrections={LEVELS}
        assets={ASSETS}
        onChange={vi.fn()}
        onRename={vi.fn()}
      />,
    );
    const options = screen
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(options).toEqual(
      expect.arrayContaining(['Background', 'Signature', 'gone (missing)']),
    );
    expect(screen.queryByText(/add it as an image inside/)).toBeNull();
  });

  it('explains how to add images when there are none', () => {
    renderWith(
      <PropertiesPanel
        element={findElement(every, 'logo') ?? null}
        blueprint={every}
        fonts={FONTS}
        fields={FIELDS}
        kinds={FIELD_KINDS}
        errorCorrections={LEVELS}
        assets={[ASSETS[0]]}
        onChange={vi.fn()}
        onRename={vi.fn()}
      />,
    );
    expect(screen.getByText(/add it as an image inside/)).toBeTruthy();
  });

  it('locks the other side when the height changes', () => {
    const { last } = setup('logo');
    change('Height', '250');
    expect(last()).toMatchObject({ width: 350, height: 250 });
  });

  it('edits a QR code', () => {
    const { last } = setup('qr');
    change('Size', '300');
    change('Error correction', 'H');
    fireEvent.change(
      screen.getByLabelText('Foreground', { selector: 'input[type=text]' }),
      { target: { value: '#112233' } },
    );
    fireEvent.change(
      screen.getByLabelText('Background', { selector: 'input[type=text]' }),
      { target: { value: '#ffeedd' } },
    );
    change('Content', '{{ verification_url }}');
    expect(last()).toMatchObject({
      size: 300,
      ec: 'H',
      fg: '#112233',
      bg: '#ffeedd',
      content: '{{ verification_url }}',
    });
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toContain(
      'Level H',
    );
  });

  it('falls back to the plain levels without the vocabulary', () => {
    const qr = findElement(every, 'qr') ?? null;
    renderWith(
      <PropertiesPanel
        element={qr}
        blueprint={every}
        fonts={FONTS}
        fields={FIELDS}
        kinds={FIELD_KINDS}
        errorCorrections={[]}
        assets={ASSETS}
        onChange={vi.fn()}
        onRename={vi.fn()}
      />,
    );
    const select = screen.getByLabelText('Error correction');
    expect(
      Array.from(select.querySelectorAll('option')).map((o) => o.textContent),
    ).toEqual(['L', 'M', 'Q', 'H']);
  });
});
