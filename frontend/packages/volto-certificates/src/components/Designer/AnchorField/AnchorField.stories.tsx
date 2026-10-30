import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import AnchorField from './AnchorField';
import type { Anchor, Baseline } from '../../../blueprint/model';

const meta: Meta<typeof AnchorField> = {
  title: 'Certificates/Designer/AnchorField',
  component: AnchorField,
};

export default meta;

type Story = StoryObj<typeof AnchorField>;

function Controlled() {
  const [state, setState] = useState<{ anchor: Anchor; baseline: Baseline }>({
    anchor: 'middle',
    baseline: 'alphabetic',
  });
  return (
    <AnchorField
      id="story-anchor"
      {...state}
      onChange={(patch) => setState((current) => ({ ...current, ...patch }))}
    />
  );
}

export const Default: Story = { render: () => <Controlled /> };
