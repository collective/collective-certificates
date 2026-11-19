import type { Meta, StoryObj } from '@storybook/react';
import { RealStoreWrapper as Wrapper } from '@plone/volto/storybook';
import CertificateFingerprint from './CertificateFingerprint';

const meta: Meta<typeof CertificateFingerprint> = {
  title: 'Certificates/CertificateFingerprint',
  component: CertificateFingerprint,
};

export default meta;

type Story = StoryObj<typeof CertificateFingerprint>;

export const Default: Story = {
  args: {
    hash: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  },
  render: (args) => (
    <Wrapper>
      <CertificateFingerprint {...args} />
    </Wrapper>
  ),
};
