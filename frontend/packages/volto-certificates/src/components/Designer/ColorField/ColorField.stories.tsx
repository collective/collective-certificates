import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RealStoreWrapper as Wrapper } from '@plone/volto/storybook';
import ColorField from './ColorField';

const meta: Meta<typeof ColorField> = {
  title: 'Certificates/Designer/ColorField',
  component: ColorField,
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

type Story = StoryObj<typeof ColorField>;

function Controlled({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <ColorField
      id="story-color"
      label="Color"
      value={value}
      onChange={setValue}
    />
  );
}

export const Default: Story = {
  render: () => <Controlled initial="#007eb1" />,
};
export const Black: Story = { render: () => <Controlled initial="#000000" /> };
