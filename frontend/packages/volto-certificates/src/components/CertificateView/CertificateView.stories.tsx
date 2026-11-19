import type { Meta, StoryObj } from '@storybook/react';
import { RealStoreWrapper as Wrapper } from '@plone/volto/storybook';
import {
  STORY_FONTS,
  STORY_FIELDS,
  STORY_KINDS,
  STORY_LEVELS,
} from '../Designer/storyData';
import CertificateView from './CertificateView';
import type { CertificateContent } from './CertificateView';

const meta: Meta<typeof CertificateView> = {
  title: 'Certificates/CertificateView',
  component: CertificateView,
};

export default meta;

type Story = StoryObj<typeof CertificateView>;

const UID = '257e08fdcd07ff6fa3d1bc14f6aec321';

const content: CertificateContent = {
  '@id': '/certificates/star-trek-picard-patrick-stewart',
  UID,
  title: 'Star Trek: Picard — Patrick Stewart',
  created: '2026-10-30T12:00:00+00:00',
  data: {
    full_name: 'Patrick Stewart',
    event_name: 'Star Trek: Picard',
    event_start_date: '2026-05-26',
    event_end_date: '2026-06-09',
    responsible_person: 'Jean-Luc Picard',
    total_hours: '47',
    certificate_uid: UID,
  },
  file: {
    download: '/certificates/star-trek-picard-patrick-stewart/@@download/file',
    filename: 'star-trek-picard-patrick-stewart.pdf',
    'content-type': 'application/pdf',
    size: 125952,
  },
  file_hash: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
};

const certificates = {
  fonts: STORY_FONTS,
  fields: STORY_FIELDS,
  fieldKinds: STORY_KINDS,
  errorCorrections: STORY_LEVELS,
  vocabularies: { loading: false, loaded: true, error: null },
  validation: { loading: false, valid: null, errors: [], error: null },
};

export const Default: Story = {
  args: { content },
  render: (args) => (
    <Wrapper customStore={{ certificates }}>
      <CertificateView {...args} />
    </Wrapper>
  ),
};

export const WithoutFile: Story = {
  args: { content: { ...content, file: null, file_hash: null } },
  render: (args) => (
    <Wrapper customStore={{ certificates }}>
      <CertificateView {...args} />
    </Wrapper>
  ),
};
