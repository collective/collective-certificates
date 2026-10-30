import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { blueprintToSvg } from '../../blueprint/svg';
import useFontFaces from '../../hooks/useFontFaces';
import messages from '../../messages';
import { stageSvg } from '../Designer/Stage/Stage';
import type { Blueprint, FieldData } from '../../blueprint/model';

import './TemplatePreview.scss';

export interface TemplatePreviewProps {
  blueprint: Blueprint;
  /** Image URLs by asset name. */
  assets: Readonly<Record<string, string>>;
  data: FieldData;
  dateFormat: string;
  months: readonly string[];
  /** Font tokens to declare as `@font-face` families. */
  fonts?: readonly string[];
}

const NO_FONTS: readonly string[] = [];

/**
 * A template drawn in the browser with the same SVG the server renders,
 * scaled to the available width.
 */
export default function TemplatePreview({
  blueprint,
  assets,
  data,
  dateFormat,
  months,
  fonts = NO_FONTS,
}: TemplatePreviewProps) {
  const intl = useIntl();
  useFontFaces(fonts);
  const [svg, error] = useMemo((): [string, string | null] => {
    try {
      return [
        stageSvg(
          blueprintToSvg(blueprint, data, assets, { dateFormat, months }),
        ),
        null,
      ];
    } catch (caught) {
      return ['', (caught as Error).message];
    }
  }, [blueprint, data, assets, dateFormat, months]);

  if (error) {
    return (
      <p className="certificate-field-error">
        {intl.formatMessage(messages.noPreview, { detail: error })}
      </p>
    );
  }
  return (
    <div
      className="certificate-blueprint-preview"
      style={{
        aspectRatio: `${blueprint.page.width} / ${blueprint.page.height}`,
      }}
      // The SVG comes from blueprintToSvg, which escapes every value.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
