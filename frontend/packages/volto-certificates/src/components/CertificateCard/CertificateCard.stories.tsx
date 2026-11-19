import type { Meta, StoryObj } from '@storybook/react';
import { RealStoreWrapper as Wrapper } from '@plone/volto/storybook';
import CertificateCard from './CertificateCard';

const meta: Meta<typeof CertificateCard> = {
  title: 'Certificates/CertificateCard',
  component: CertificateCard,
};

export default meta;

type Story = StoryObj<typeof CertificateCard>;

const args = {
  issued: '2026-10-30T12:00:00+00:00',
  file: {
    filename: 'star-trek-picard-patrick-stewart.pdf',
    'content-type': 'application/pdf',
    size: 125952,
  },
  downloadUrl: '#',
};

export const Default: Story = {
  args,
  render: (story) => (
    <Wrapper>
      <CertificateCard {...story}>
        <a className="ui button" href="#verify">
          Check that this certificate is valid
        </a>
      </CertificateCard>
    </Wrapper>
  ),
};

export const WithoutFile: Story = {
  args: { ...args, file: null },
  render: (story) => (
    <Wrapper>
      <CertificateCard {...story} />
    </Wrapper>
  ),
};
