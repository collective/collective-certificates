import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RealStoreWrapper as Wrapper } from '@plone/volto/storybook';
import FontPicker from './FontPicker';

const FONTS = [
  { token: 'inter', title: 'Inter' },
  { token: 'eb-garamond', title: 'EB Garamond' },
  { token: 'caveat', title: 'Caveat' },
];

const meta: Meta<typeof FontPicker> = {
  title: 'Certificates/Designer/FontPicker',
  component: FontPicker,
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

type Story = StoryObj<typeof FontPicker>;

function Controlled() {
  const [value, setValue] = useState('inter');
  return (
    <FontPicker
      id="story-font"
      value={value}
      fonts={FONTS}
      onChange={setValue}
    />
  );
}

export const Default: Story = { render: () => <Controlled /> };
