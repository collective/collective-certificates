import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWith } from '../../../testing/render';
import PreviewPane from './PreviewPane';

describe('PreviewPane', () => {
  it('loads the saved template from @preview', () => {
    renderWith(<PreviewPane templateUrl="/templates/a" version="2" />);
    const image = screen.getByRole('img') as HTMLImageElement;
    expect(image.getAttribute('src')).toMatch(
      /\/templates\/a\/@preview\?format=png&v=2$/,
    );
    expect(
      screen.getByText(
        'The template as saved, rendered by the server. Unsaved changes are not shown.',
      ),
    ).toBeTruthy();
  });

  it('asks to save a template being added', () => {
    renderWith(<PreviewPane templateUrl={null} />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(
      screen.getByText('Save the template to see the server preview.'),
    ).toBeTruthy();
  });
});
