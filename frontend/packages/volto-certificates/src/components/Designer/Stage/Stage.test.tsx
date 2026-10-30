import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BLUEPRINTS, DATA, GOLDEN_ASSETS } from '../../../testing/fixtures';
import { renderWith } from '../../../testing/render';
import Stage, { literalBlueprint, stageSvg } from './Stage';
import type { StageProps } from './Stage';

const every = BLUEPRINTS['every-element'];

const props = (overrides: Partial<StageProps> = {}): StageProps => ({
  blueprint: every,
  assets: GOLDEN_ASSETS,
  data: DATA,
  showSample: true,
  zoom: 0.5,
  selection: null,
  guides: null,
  onSelect: vi.fn(),
  ...overrides,
});

describe('stageSvg', () => {
  it('turns element ids into data-element attributes', () => {
    const svg = stageSvg(
      '<svg xmlns="x"><text id="a">{</text><image id="b"/><svg id="c"></svg></svg>',
    );
    expect(svg).not.toContain(' id=');
    expect(svg).toContain('<text data-element="a">');
    expect(svg).toContain('<image data-element="b"/>');
    expect(svg).toContain('<svg data-element="c">');
  });
});

describe('literalBlueprint', () => {
  it('keeps placeholders from being filled, images untouched', () => {
    const literal = literalBlueprint(every);
    const texts = literal.elements.filter(
      (e): e is Exclude<typeof e, { type: 'image' }> => e.type !== 'image',
    );
    expect(texts.length).toBeGreaterThan(0);
    for (const element of texts) expect(element.content).not.toContain('{{');
    const images = literal.elements.filter((e) => e.type === 'image');
    expect(images).toEqual(every.elements.filter((e) => e.type === 'image'));
  });
});

describe('Stage', () => {
  it('draws the page at the zoom', () => {
    const { container } = renderWith(<Stage {...props()} />);
    const page = container.querySelector(
      '.certificate-stage-page',
    ) as HTMLElement;
    expect(page.style.width).toBe(`${3508 * 0.5}px`);
    expect(page.style.height).toBe(`${2480 * 0.5}px`);
    expect(container.querySelectorAll('[data-element]')).toHaveLength(
      every.elements.length,
    );
    expect(container.querySelector('[id="start"]')).toBeNull();
  });

  it('fills placeholders, or shows them as written', () => {
    const { container, rerender } = renderWith(<Stage {...props()} />);
    const middle = () =>
      container.querySelector('[data-element="middle"]')?.textContent;
    expect(middle()).toBe('PATRICK STEWART');
    rerender(<Stage {...props({ showSample: false })} />);
    expect(middle()?.replace(/​/g, '')).toBe('{{ full_name|upper }}');
  });

  it('selects by clicking an element, and clears on the page', () => {
    const onSelect = vi.fn();
    const { container } = renderWith(<Stage {...props({ onSelect })} />);
    fireEvent.click(container.querySelector('[data-element="end"]') as Element);
    expect(onSelect).toHaveBeenLastCalledWith('end');
    fireEvent.click(
      container.querySelector('.certificate-stage-svg') as Element,
    );
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it('keeps the selection when its handles are clicked', () => {
    const onSelect = vi.fn();
    renderWith(
      <Stage
        {...props({
          onSelect,
          selection: 'logo',
          renderSelection: (element) => (
            <div data-selection={element.id}>handle</div>
          ),
        })}
      />,
    );
    fireEvent.click(screen.getByText('handle'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('passes the selected element and its box to the handles', () => {
    const renderSelection = vi.fn(() => null);
    renderWith(<Stage {...props({ selection: 'qr', renderSelection })} />);
    expect(renderSelection).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'qr' }),
      { x: 2900, y: 1800, width: 500, height: 500 },
    );
  });

  it('uses the drawn box of a selected text when the browser has one', () => {
    const original = (SVGElement.prototype as unknown as { getBBox?: unknown })
      .getBBox;
    Object.defineProperty(SVGElement.prototype, 'getBBox', {
      configurable: true,
      value: () => ({ x: 99.6, y: 640.2, width: 800.4, height: 70 }),
    });
    const renderSelection = vi.fn(() => null);
    renderWith(<Stage {...props({ selection: 'start', renderSelection })} />);
    expect(renderSelection).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'start' }),
      { x: 100, y: 640, width: 800, height: 70 },
    );
    Object.defineProperty(SVGElement.prototype, 'getBBox', {
      configurable: true,
      value: original,
    });
  });

  it('draws snap guides', () => {
    const { container } = renderWith(
      <Stage {...props({ guides: { vertical: [100], horizontal: [50] } })} />,
    );
    const vertical = container.querySelector(
      '.certificate-guide.vertical',
    ) as HTMLElement;
    const horizontal = container.querySelector(
      '.certificate-guide.horizontal',
    ) as HTMLElement;
    expect(vertical.style.left).toBe('50px');
    expect(horizontal.style.top).toBe('25px');
  });

  it('explains content that cannot be drawn', () => {
    renderWith(<Stage {...props({ data: {} })} />);
    expect(screen.getByRole('alert').textContent).toContain(
      'Missing value for',
    );
  });
});
