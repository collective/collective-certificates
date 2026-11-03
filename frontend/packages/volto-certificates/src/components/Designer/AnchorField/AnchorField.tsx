import { useIntl } from 'react-intl';
import alignCenterSVG from '@plone/volto/icons/align-center.svg';
import alignLeftSVG from '@plone/volto/icons/align-left.svg';
import alignRightSVG from '@plone/volto/icons/align-right.svg';
import { ANCHORS, BASELINES } from '../../../blueprint/model';
import { ButtonsWidget, SelectWidget } from '../../../helpers/widgets';
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

const ANCHOR_ICONS = {
  start: alignLeftSVG,
  middle: alignCenterSVG,
  end: alignRightSVG,
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
    <>
      <ButtonsWidget
        id={`${id}-anchor`}
        title={intl.formatMessage(messages.anchor)}
        value={anchor}
        actions={[...ANCHORS]}
        actionsInfoMap={Object.fromEntries(
          ANCHORS.map((value) => [
            value,
            [ANCHOR_ICONS[value], intl.formatMessage(ANCHOR_LABELS[value])],
          ]),
        )}
        onChange={(_id, value) =>
          value && onChange({ anchor: value as Anchor })
        }
      />
      <SelectWidget
        id={`${id}-baseline`}
        title={intl.formatMessage(messages.baseline)}
        value={baseline}
        choices={BASELINES.map((value) => [
          value,
          intl.formatMessage(BASELINE_LABELS[value]),
        ])}
        required
        noValueOption={false}
        onChange={(_id, value) =>
          value && onChange({ baseline: value as Baseline })
        }
      />
    </>
  );
}
