import type { Meta, StoryObj } from '@storybook/react';
import { RealStoreWrapper as Wrapper } from '@plone/volto/storybook';
import CertificateValues from './CertificateValues';

const meta: Meta<typeof CertificateValues> = {
  title: 'Certificates/CertificateValues',
  component: CertificateValues,
};

export default meta;

type Story = StoryObj<typeof CertificateValues>;

export const Default: Story = {
  args: {
    values: [
      {
        token: 'full_name',
        title: 'Full name',
        kind: 'text',
        value: 'Patrick Stewart',
      },
      {
        token: 'event_name',
        title: 'Event name',
        kind: 'text',
        value: 'Star Trek: Picard',
      },
      {
        token: 'event_start_date',
        title: 'Event start date',
        kind: 'date',
        value: '2026-05-26',
      },
      { token: 'total_hours', title: 'Total hours', kind: 'text', value: '47' },
    ],
  },
  render: (args) => (
    <Wrapper>
      <CertificateValues {...args} />
    </Wrapper>
  ),
};
