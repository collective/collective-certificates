import { useEffect, useRef, useState } from 'react';
import Moveable from 'react-moveable';
import { snap, toPage } from '../../../helpers/snapping';
import type { Blueprint, Element } from '../../../blueprint/model';
import type { Box, Guides } from '../../../helpers/snapping';

/** Smallest selection box drawn, in screen pixels (text at its point). */
export const MIN_HANDLE = 8;

export interface MoveableLayerProps {
  element: Element;
  /** The element's box in page pixels. */
  box: Box;
  zoom: number;
  blueprint: Blueprint;
  snapTolerance: number;
  onMove: (x: number, y: number) => void;
  onResize: (patch: Partial<Element>) => void;
  onGuides: (guides: Guides | null) => void;
}

/**
 * Where a drag ends: the screen translation in page pixels, snapped by
 * the element's box, applied to the element's own point.
 */
export function dragResult(
  element: Element,
  box: Box,
  translate: readonly number[],
  zoom: number,
  blueprint: Blueprint,
  tolerance: number,
): { x: number; y: number; guides: Guides } {
  const moved = {
    ...box,
    x: box.x + toPage(translate[0], zoom),
    y: box.y + toPage(translate[1], zoom),
  };
  const snapped = snap(moved, blueprint, element.id, tolerance);
  return {
    x: Math.max(0, element.x + snapped.x - box.x),
    y: Math.max(0, element.y + snapped.y - box.y),
    guides: snapped.guides,
  };
}

/**
 * What a resize ends in: the new screen size and the translation of the
 * top-left corner, in page pixels. QR codes stay square.
 */
export function resizeResult(
  element: Element,
  width: number,
  height: number,
  translate: readonly number[],
  zoom: number,
): Partial<Element> {
  const x = Math.max(0, element.x + toPage(translate[0], zoom));
  const y = Math.max(0, element.y + toPage(translate[1], zoom));
  const w = Math.max(1, toPage(width, zoom));
  const h = Math.max(1, toPage(height, zoom));
  if (element.type === 'qrcode') return { x, y, size: Math.max(w, h) };
  return { x, y, width: w, height: h };
}

/** Drag (and, for images and QR codes, resize) the selected element. */
export default function MoveableLayer({
  element,
  box,
  zoom,
  blueprint,
  snapTolerance,
  onMove,
  onResize,
  onGuides,
}: MoveableLayerProps) {
  const target = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [shift, setShift] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const track = (event: KeyboardEvent) => setShift(event.shiftKey);
    window.addEventListener('keydown', track);
    window.addEventListener('keyup', track);
    return () => {
      window.removeEventListener('keydown', track);
      window.removeEventListener('keyup', track);
    };
  }, []);
  const width = Math.max(MIN_HANDLE, box.width * zoom);
  const height = Math.max(MIN_HANDLE, box.height * zoom);
  const style = {
    left: box.x * zoom - (box.width ? 0 : MIN_HANDLE / 2),
    top: box.y * zoom - (box.height ? 0 : MIN_HANDLE / 2),
    width,
    height,
  };
  const resizable = element.type !== 'text';
  const reset = (node: HTMLElement | SVGElement) => {
    node.style.transform = '';
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;
  };
  return (
    <>
      <div
        ref={target}
        className="certificate-selection"
        data-selection={element.id}
        style={style}
      />
      {mounted && target.current && (
        <Moveable
          target={target.current}
          draggable
          resizable={resizable}
          keepRatio={element.type === 'qrcode' || shift}
          throttleDrag={0}
          throttleResize={0}
          origin={false}
          onDrag={({ target: node, transform, translate }) => {
            node.style.transform = transform;
            onGuides(
              dragResult(
                element,
                box,
                translate,
                zoom,
                blueprint,
                snapTolerance,
              ).guides,
            );
          }}
          onDragEnd={({ target: node, lastEvent }) => {
            reset(node);
            onGuides(null);
            if (!lastEvent) return;
            const { x, y } = dragResult(
              element,
              box,
              lastEvent.translate,
              zoom,
              blueprint,
              snapTolerance,
            );
            onMove(x, y);
          }}
          onResize={({ target: node, width: w, height: h, drag }) => {
            node.style.width = `${w}px`;
            node.style.height = `${h}px`;
            node.style.transform = drag.transform;
          }}
          onResizeEnd={({ target: node, lastEvent }) => {
            reset(node);
            if (!lastEvent) return;
            onResize(
              resizeResult(
                element,
                lastEvent.width,
                lastEvent.height,
                lastEvent.drag.beforeTranslate,
                zoom,
              ),
            );
          }}
        />
      )}
    </>
  );
}
