import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyBlueprint } from '../../../blueprint/model';
import { renderWith } from '../../../testing/render';
import MoveableLayer, {
  MIN_HANDLE,
  dragResult,
  resizeResult,
} from './MoveableLayer';
import type { Blueprint, Element } from '../../../blueprint/model';

// Capture the props react-moveable receives, to play its events.
const moveable: { props: Record<string, unknown> | null } = { props: null };
vi.mock('react-moveable', () => ({
  default: (props: Record<string, unknown>) => {
    moveable.props = props;
    return null;
  },
}));

const image: Element = {
  id: 'logo',
  type: 'image',
  x: 200,
  y: 100,
  width: 400,
  height: 200,
  asset: 'background',
};
const qr: Element = {
  id: 'qr',
  type: 'qrcode',
  x: 1000,
  y: 1000,
  size: 300,
  content: 'x',
  ec: 'M',
  fg: '#000000',
  bg: '#ffffff',
};
const text: Element = {
  id: 'name',
  type: 'text',
  x: 500,
  y: 400,
  anchor: 'middle',
  baseline: 'middle',
  font: 'inter',
  size: 40,
  color: '#000000',
  content: 'x',
};
const blueprint: Blueprint = {
  ...emptyBlueprint(2000, 1500),
  elements: [image, qr, text],
};
const boxOf = (element: Element) =>
  element.type === 'image'
    ? {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      }
    : element.type === 'qrcode'
      ? {
          x: element.x,
          y: element.y,
          width: element.size,
          height: element.size,
        }
      : { x: 300, y: 380, width: 400, height: 40 };

describe('dragResult at zoom 0.5', () => {
  it('turns screen pixels into page pixels', () => {
    // 50 screen px at zoom 0.5 are 100 page px; nothing to snap to there.
    const result = dragResult(image, boxOf(image), [50, 35], 0.5, blueprint, 0);
    expect(result).toMatchObject({ x: 300, y: 170 });
  });

  it('snaps the box and applies the same shift to the element', () => {
    // The image's right edge (600 + 395) lands 5 px from the QR's left (1000).
    const result = dragResult(
      image,
      boxOf(image),
      [197.5, 0],
      0.5,
      blueprint,
      10,
    );
    expect(result.x).toBe(600);
    expect(result.guides.vertical).toEqual([1000]);
  });

  it('moves text by its point, not its box', () => {
    const result = dragResult(text, boxOf(text), [10, 10], 0.5, blueprint, 0);
    expect(result).toMatchObject({ x: 520, y: 420 });
  });

  it('keeps the element on the page', () => {
    const result = dragResult(
      image,
      boxOf(image),
      [-1000, -1000],
      0.5,
      blueprint,
      0,
    );
    expect(result).toMatchObject({ x: 0, y: 0 });
  });
});

describe('resizeResult at zoom 0.5', () => {
  it('resizes an image and moves its corner', () => {
    expect(resizeResult(image, 250, 150, [-10, -20], 0.5)).toEqual({
      x: 180,
      y: 60,
      width: 500,
      height: 300,
    });
  });

  it('keeps a QR code square, at least 1 px', () => {
    expect(resizeResult(qr, 100, 120, [0, 0], 0.5)).toEqual({
      x: 1000,
      y: 1000,
      size: 240,
    });
    expect(resizeResult(qr, 0, 0, [0, 0], 0.5)).toMatchObject({ size: 1 });
  });
});

describe('MoveableLayer', () => {
  beforeEach(() => {
    moveable.props = null;
  });

  const setup = (element: Element) => {
    const handlers = { onMove: vi.fn(), onResize: vi.fn(), onGuides: vi.fn() };
    const result = renderWith(
      <MoveableLayer
        element={element}
        box={boxOf(element)}
        zoom={0.5}
        blueprint={blueprint}
        snapTolerance={0}
        {...handlers}
      />,
    );
    const handle = result.container.querySelector(
      '.certificate-selection',
    ) as HTMLDivElement;
    return { ...handlers, handle };
  };

  it('draws the handle over the box at the zoom', () => {
    const { handle } = setup(image);
    expect(handle.style.left).toBe('100px');
    expect(handle.style.top).toBe('50px');
    expect(handle.style.width).toBe('200px');
    expect(handle.style.height).toBe('100px');
    expect(moveable.props).toMatchObject({ draggable: true, resizable: true });
  });

  it('gives a zero-size box a small handle around the point', () => {
    const { handle } = setup({ ...text });
    expect(handle).toBeTruthy();
    const layer = renderWith(
      <MoveableLayer
        element={text}
        box={{ x: 500, y: 400, width: 0, height: 0 }}
        zoom={0.5}
        blueprint={blueprint}
        snapTolerance={0}
        onMove={vi.fn()}
        onResize={vi.fn()}
        onGuides={vi.fn()}
      />,
    ).container.querySelector('.certificate-selection') as HTMLDivElement;
    expect(layer.style.width).toBe(`${MIN_HANDLE}px`);
    expect(layer.style.left).toBe(`${250 - MIN_HANDLE / 2}px`);
  });

  it('does not resize text, and locks the QR ratio', () => {
    setup(text);
    expect(moveable.props).toMatchObject({ resizable: false });
    setup(qr);
    expect(moveable.props).toMatchObject({ resizable: true, keepRatio: true });
  });

  it('moves the element when a drag ends', () => {
    const { onMove, onGuides, handle } = setup(image);
    const drag = moveable.props as Record<string, (event: unknown) => void>;
    act(() => {
      drag.onDrag({
        target: handle,
        transform: 'translate(50px, 35px)',
        translate: [50, 35],
      });
    });
    expect(handle.style.transform).toBe('translate(50px, 35px)');
    // The moved box's center (500) is exactly on the text's point.
    expect(onGuides).toHaveBeenLastCalledWith({
      vertical: [500],
      horizontal: [],
    });
    act(() => {
      drag.onDragEnd({ target: handle, lastEvent: { translate: [50, 35] } });
    });
    expect(onMove).toHaveBeenCalledWith(300, 170);
    expect(onGuides).toHaveBeenLastCalledWith(null);
    expect(handle.style.transform).toBe('');
  });

  it('ignores a click without a drag', () => {
    const { onMove, handle } = setup(image);
    const drag = moveable.props as Record<string, (event: unknown) => void>;
    act(() => drag.onDragEnd({ target: handle, lastEvent: undefined }));
    expect(onMove).not.toHaveBeenCalled();
  });

  it('resizes the element when a resize ends', () => {
    const { onResize, handle } = setup(image);
    const events = moveable.props as Record<string, (event: unknown) => void>;
    act(() =>
      events.onResize({
        target: handle,
        width: 250,
        height: 150,
        drag: { transform: 'translate(-10px, -20px)' },
      }),
    );
    expect(handle.style.width).toBe('250px');
    act(() =>
      events.onResizeEnd({
        target: handle,
        lastEvent: {
          width: 250,
          height: 150,
          drag: { beforeTranslate: [-10, -20] },
        },
      }),
    );
    expect(onResize).toHaveBeenCalledWith({
      x: 180,
      y: 60,
      width: 500,
      height: 300,
    });
    act(() => events.onResizeEnd({ target: handle, lastEvent: undefined }));
    expect(onResize).toHaveBeenCalledTimes(1);
  });

  it('keeps an image ratio while shift is held', () => {
    setup(image);
    expect(moveable.props).toMatchObject({ keepRatio: false });
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { shiftKey: true }));
    });
    expect(moveable.props).toMatchObject({ keepRatio: true });
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { shiftKey: false }));
    });
    expect(moveable.props).toMatchObject({ keepRatio: false });
  });
});
