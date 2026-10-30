import { useIntl } from 'react-intl';
import { ANCHORS, BASELINES } from '../../../blueprint/model';
import messages from '../../../messages';
import type { Anchor, Baseline } from '../../../blueprint/model';

export interface AnchorFieldProps {
  id: string;
  anchor: Anchor;
  baseline: Baseline;
  onChange: (patch: { anchor?: Anchor; baseline?: Baseline }) => void;
}

const ANCHOR_LABELS = {
  start: messages.anchorStart,
  middle: messages.anchorMiddle,
  end: messages.anchorEnd,
};

const BASELINE_LABELS = {
  alphabetic: messages.baselineAlphabetic,
  middle: messages.baselineMiddle,
  hanging: messages.baselineHanging,
};

/** Where a text sits relative to its point: horizontally and vertically. */
export default function AnchorField({
  id,
  anchor,
  baseline,
  onChange,
}: AnchorFieldProps) {
  const intl = useIntl();
  return (
    <div className="certificate-anchor-field">
      <fieldset>
        <legend>{intl.formatMessage(messages.anchor)}</legend>
        {ANCHORS.map((value) => (
          <label key={value}>
            <input
              type="radio"
              name={`${id}-anchor`}
              value={value}
              checked={anchor === value}
              onChange={() => onChange({ anchor: value })}
            />
            {intl.formatMessage(ANCHOR_LABELS[value])}
          </label>
        ))}
      </fieldset>
      <label htmlFor={`${id}-baseline`}>
        {intl.formatMessage(messages.baseline)}
      </label>
      <select
        id={`${id}-baseline`}
        value={baseline}
        onChange={(event) =>
          onChange({ baseline: event.target.value as Baseline })
        }
      >
        {BASELINES.map((value) => (
          <option key={value} value={value}>
            {intl.formatMessage(BASELINE_LABELS[value])}
          </option>
        ))}
      </select>
    </div>
  );
}
