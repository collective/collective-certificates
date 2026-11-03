import { screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  choose,
  FONTS,
  loadSelect,
  openMenu,
  renderWith,
} from '../../../testing/render';
import FontPicker from './FontPicker';

vi.mock('@plone/volto/helpers/Loadable/Loadable');
beforeAll(loadSelect);

describe('FontPicker', () => {
  it('lists the fonts, each in its own family', async () => {
    renderWith(
      <FontPicker id="f" value="inter" fonts={FONTS} onChange={vi.fn()} />,
    );
    const options = await openMenu('Font');
    expect(options.map((o) => o.textContent)).toEqual([
      'Inter',
      'EB Garamond',
      'Caveat',
    ]);
    const family = options[2].closest<HTMLElement>('.certificate-font-option');
    expect(family?.style.fontFamily).toBe('"caveat"');
  });

  it('reports the chosen token', async () => {
    const onChange = vi.fn();
    renderWith(
      <FontPicker id="f" value="inter" fonts={FONTS} onChange={onChange} />,
    );
    await choose('Font', 'Caveat');
    expect(onChange).toHaveBeenCalledWith('caveat');
  });

  it('keeps an unknown current font selectable', async () => {
    renderWith(
      <FontPicker id="f" value="gone" fonts={FONTS} onChange={vi.fn()} />,
    );
    expect(await screen.findByText('gone')).toBeTruthy();
    expect(await openMenu('Font')).toHaveLength(4);
  });
});
