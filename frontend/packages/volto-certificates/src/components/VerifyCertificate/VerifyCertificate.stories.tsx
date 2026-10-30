import type { Meta, StoryObj } from '@storybook/react';
import { RealStoreWrapper as Wrapper } from '@plone/volto/storybook';
import {
  STORY_FONTS,
  STORY_FIELDS,
  STORY_KINDS,
  STORY_LEVELS,
} from '../Designer/storyData';
import VerifyCertificate from './VerifyCertificate';
import type { CertificateVerification } from '../../reducers/certificates';

const meta: Meta<typeof VerifyCertificate> = {
  title: 'Certificates/VerifyCertificate',
  component: VerifyCertificate,
};

export default meta;

type Story = StoryObj<typeof VerifyCertificate>;

const UID = '257e08fdcd07ff6fa3d1bc14f6aec321';

const result: CertificateVerification = {
  uid: UID,
  title: 'Star Trek: Picard — Patrick Stewart',
  issued: '2026-10-30T12:00:00+00:00',
  data: {},
  fields: [
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
    {
      token: 'event_end_date',
      title: 'Event end date',
      kind: 'date',
      value: '2026-06-09',
    },
    {
      token: 'total_hours',
      title: 'Total hours',
      kind: 'text',
      value: '47',
    },
  ],
  template: null,
  file: {
    download: `/@@certificate-file/${UID}`,
    filename: 'certificate.pdf',
    'content-type': 'application/pdf',
    size: 123456,
  },
};

const certificates = {
  fonts: STORY_FONTS,
  fields: STORY_FIELDS,
  fieldKinds: STORY_KINDS,
  errorCorrections: STORY_LEVELS,
  vocabularies: { loading: false, loaded: true, error: null },
  validation: { loading: false, valid: null, errors: [], error: null },
};

const withVerification = (verification: Record<string, unknown>) => ({
  ...certificates,
  verification: {
    loading: false,
    loaded: false,
    error: null,
    result: null,
    ...verification,
  },
});

export const Valid: Story = {
  args: { match: { params: { uid: UID } } },
  render: (args) => (
    <Wrapper
      customStore={{
        certificates: withVerification({ loaded: true, result }),
      }}
    >
      <VerifyCertificate {...args} />
    </Wrapper>
  ),
};

export const NotFound: Story = {
  args: { match: { params: { uid: 'unknown' } } },
  render: (args) => (
    <Wrapper
      customStore={{
        certificates: withVerification({ error: { status: 404 } }),
      }}
    >
      <VerifyCertificate {...args} />
    </Wrapper>
  ),
};
