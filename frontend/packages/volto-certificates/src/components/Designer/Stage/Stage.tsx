import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useIntl } from 'react-intl';
import { blueprintToSvg } from '../../../blueprint/svg';
import { elementBox } from '../../../helpers/snapping';
import { literal } from '../../../helpers/text';
import messages from '../../../messages';
import type { Blueprint, Element, FieldData } from '../../../blueprint/model';
import type { SizeFunction } from '../../../blueprint/svg';
import type { Box, Guides } from '../../../helpers/snapping';

export interface StageProps {
  blueprint: Blueprint;
  /** Image URLs by asset name. */
  assets: Readonly<Record<string, string>>;
  data: FieldData;
  /** Fill placeholders with `data`; otherwise show them as written. */
  showSample: boolean;
  dateFormat?: string;
  months?: readonly string[];
  size?: SizeFunction;
  zoom: number;
  selection: string | null;
  guides: Guides | null;
  onSelect: (id: string | null) => void;
  /** Draws the selection handles for the selected element's box. */
  renderSelection?: (element: Element, box: Box) => ReactNode;
}

/**
 * Make the contract SVG safe to put in the page: element ids become
 * `data-element` attributes, so they cannot clash with the page's ids.
 */
export function stageSvg(svg: string): string {
  return svg.replace(/(<(?:text|image|svg) )id="/g, '$1data-element="');
}

/** Show content as written: placeholders stay visible. */
export function literalBlueprint(blueprint: Blueprint): Blueprint {
  return {
    ...blueprint,
    elements: blueprint.elements.map((element) =>
      element.type === 'image'
        ? element
        : { ...element, content: literal(element.content) },
    ),
  };
}

/** The page, drawn with the same SVG as the server, at a zoom. */
export default function Stage({
  blueprint,
  assets,
  data,
  showSample,
  dateFormat,
  months,
  size,
  zoom,
  selection,
  guides,
  onSelect,
  renderSelection,
}: StageProps) {
  const intl = useIntl();
  const canvas = useRef<HTMLDivElement>(null);
  const [svg, problem] = useMemo((): [string, string | null] => {
    try {
      const drawn = showSample ? blueprint : literalBlueprint(blueprint);
      return [
        stageSvg(
          blueprintToSvg(drawn, data, assets, { dateFormat, months, size }),
        ),
        null,
      ];
    } catch (error) {
      return ['', (error as Error).message];
    }
  }, [blueprint, data, assets, showSample, dateFormat, months, size]);
  const selected = blueprint.elements.find((e) => e.id === selection) ?? null;
  const [textBox, setTextBox] = useState<Box | null>(null);
  useLayoutEffect(() => {
    setTextBox(null);
    if (selected?.type !== 'text' || !canvas.current) return;
    const node = canvas.current.querySelector(
      `[data-element="${selected.id}"]`,
    ) as SVGGraphicsElement | null;
    if (node && typeof node.getBBox === 'function') {
      const { x, y, width, height } = node.getBBox();
      setTextBox({
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      });
    }
  }, [svg, selected]);
  const box = selected
    ? selected.type === 'text' && textBox
      ? textBox
      : elementBox(selected)
    : null;
  const { width, height } = blueprint.page;
  return (
    <div className="certificate-stage">
      {problem && (
        <p className="certificate-stage-problem" role="alert">
          {intl.formatMessage(messages.noPreview, { detail: problem })}
        </p>
      )}
      {/* Pointer selection only: the elements list is the keyboard path. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        ref={canvas}
        className="certificate-stage-page"
        style={{ width: width * zoom, height: height * zoom }}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          // Clicks on the selection handles keep the selection.
          if (target.closest('[data-selection], .moveable-control-box')) return;
          const hit = target.closest('[data-element]');
          onSelect(hit ? hit.getAttribute('data-element') : null);
        }}
      >
        <div
          className="certificate-stage-svg"
          // The SVG comes from blueprintToSvg, which escapes every value.
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        {guides?.vertical.map((x) => (
          <div
            key={`v${x}`}
            className="certificate-guide vertical"
            style={{ left: x * zoom }}
          />
        ))}
        {guides?.horizontal.map((y) => (
          <div
            key={`h${y}`}
            className="certificate-guide horizontal"
            style={{ top: y * zoom }}
          />
        ))}
        {selected && box && renderSelection?.(selected, box)}
      </div>
    </div>
  );
}
