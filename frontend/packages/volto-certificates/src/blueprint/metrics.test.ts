import { afterEach, describe, expect, it, vi } from 'vitest';
import { canvasMeasure, fitSize, shrinkSize } from './metrics';
import type { Measure } from './metrics';
import type { TextElement } from './model';

// Every character is half the font size wide.
const halfEm: Measure = (_font, text, size) => (text.length * size) / 2;

const element: TextElement = {
  id: 'name',
  type: 'text',
  x: 0,
  y: 0,
  anchor: 'start',
  baseline: 'alphabetic',
  font: 'inter',
  size: 100,
  color: '#000000',
  content: '{{ full_name }}',
  max_width: 500,
  fit: 'shrink',
};

describe('fitSize', () => {
  it('keeps the size when the text fits', () => {
    expect(fitSize(halfEm, 'inter', 'abcd', 100, 500)).toBe(100);
  });

  it('finds the largest size that fits, at the boundary', () => {
    // 20 characters at size s are 10 * s wide: 50 fits 500 exactly.
    expect(fitSize(halfEm, 'inter', 'x'.repeat(20), 100, 500)).toBe(50);
    expect(fitSize(halfEm, 'inter', 'x'.repeat(20), 100, 499)).toBe(49);
  });

  it('never goes below 1', () => {
    expect(fitSize(halfEm, 'inter', 'x'.repeat(5000), 100, 1)).toBe(1);
  });

  it('keeps the size for empty text', () => {
    expect(fitSize(halfEm, 'inter', '', 100, 1)).toBe(100);
  });
});

describe('shrinkSize', () => {
  const size = shrinkSize(halfEm);

  it('shrinks with fit: shrink and max_width', () => {
    expect(size(element, 'x'.repeat(20))).toBe(50);
  });

  it('keeps the size without fit or without max_width', () => {
    const { fit: _fit, ...noFit } = element;
    const { max_width: _max, ...noWidth } = element;
    expect(size(noFit, 'x'.repeat(20))).toBe(100);
    expect(size(noWidth, 'x'.repeat(20))).toBe(100);
    expect(size({ ...element, fit: 'none' }, 'x'.repeat(20))).toBe(100);
  });
});

describe('canvasMeasure', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('measures with the token as the font family', () => {
    const fonts: string[] = [];
    const context = {
      set font(value: string) {
        fonts.push(value);
      },
      measureText: (text: string) => ({ width: text.length * 7 }),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
    const measure = canvasMeasure() as Measure;
    expect(measure('eb-garamond', 'abc', 30)).toBe(21);
    expect(fonts).toEqual(['30px "eb-garamond"']);
  });

  it('is null without a 2D context', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(canvasMeasure()).toBeNull();
  });
});
