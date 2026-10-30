import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BLUEPRINTS, DATA } from '../../testing/fixtures';
import { renderWith } from '../../testing/render';
import TemplatePreview from './TemplatePreview';

const props = {
  blueprint: BLUEPRINTS.sample,
  assets: { background: '/bg.png', signature: '/sig.png' },
  data: DATA,
  dateFormat: '%d/%m/%Y',
  months: [],
};

describe('TemplatePreview', () => {
  it('draws the blueprint at the page proportions', () => {
    const { container } = renderWith(<TemplatePreview {...props} />);
    const preview = container.querySelector<HTMLElement>(
      '.certificate-blueprint-preview',
    );
    expect(preview?.querySelector('svg')).toBeTruthy();
    expect(preview?.innerHTML).toContain('/sig.png');
    expect(preview?.style.aspectRatio).toBe('3508 / 2480');
  });

  it('says why it cannot draw', () => {
    const { container } = renderWith(<TemplatePreview {...props} data={{}} />);
    expect(screen.getByText(/The preview cannot be drawn/)).toBeTruthy();
    expect(
      container.querySelector('.certificate-blueprint-preview'),
    ).toBeNull();
  });
});
