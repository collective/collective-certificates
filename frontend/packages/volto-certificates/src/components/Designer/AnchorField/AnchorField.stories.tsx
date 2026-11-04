import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RealStoreWrapper as Wrapper } from '@plone/volto/storybook';
import AnchorField from './AnchorField';
import type { Anchor, Baseline } from '../../../blueprint/model';

const meta: Meta<typeof AnchorField> = {
  title: 'Certificates/Designer/AnchorField',
  component: AnchorField,
  // Volto's widgets read the store, and take their styles from a form.
  decorators: [
    (Story) => (
      <Wrapper>
        <div className="ui form" style={{ width: '375px' }}>
          {Story()}
        </div>
      </Wrapper>
    ),
  ],
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
