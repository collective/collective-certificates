import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RealStoreWrapper as Wrapper } from '@plone/volto/storybook';
import FieldPicker from './FieldPicker';

const FIELDS = [
  { token: 'full_name', title: 'Full name' },
  { token: 'event_name', title: 'Event name' },
  { token: 'event_start_date', title: 'Event start date' },
];
const KINDS = {
  full_name: 'text',
  event_name: 'text',
  event_start_date: 'date',
};

const meta: Meta<typeof FieldPicker> = {
  title: 'Certificates/Designer/FieldPicker',
  component: FieldPicker,
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

type Story = StoryObj<typeof FieldPicker>;

function WithOutput() {
  const [text, setText] = useState('This certifies that ');
  return (
    <div>
      <FieldPicker
        id="story-fields"
        fields={FIELDS}
        kinds={KINDS}
        onInsert={(placeholder) => setText((current) => current + placeholder)}
      />
      <pre>{text}</pre>
    </div>
  );
}

export const Default: Story = { render: () => <WithOutput /> };
