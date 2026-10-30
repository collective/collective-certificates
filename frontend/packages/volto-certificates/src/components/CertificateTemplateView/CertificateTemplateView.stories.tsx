import type { Meta, StoryObj } from '@storybook/react';
import { RealStoreWrapper as Wrapper } from '@plone/volto/storybook';
import {
  STORY_BACKGROUND,
  STORY_BLUEPRINT,
  STORY_FIELDS,
  STORY_FONTS,
  STORY_KINDS,
  STORY_LEVELS,
} from '../Designer/storyData';
import CertificateTemplateView from './CertificateTemplateView';
import type { CertificateTemplateContent } from './CertificateTemplateView';

const meta: Meta<typeof CertificateTemplateView> = {
  title: 'Certificates/CertificateTemplateView',
  component: CertificateTemplateView,
};

export default meta;

type Story = StoryObj<typeof CertificateTemplateView>;

const certificates = {
  fonts: STORY_FONTS,
  fields: STORY_FIELDS,
  fieldKinds: STORY_KINDS,
  errorCorrections: STORY_LEVELS,
  vocabularies: { loading: false, loaded: true, error: null },
  validation: { loading: false, valid: null, errors: [], error: null },
  batch: { loading: false, result: null, errors: [], error: null },
};

const editActions = { actions: { object: [{ id: 'edit' }] } };

const content: CertificateTemplateContent = {
  '@id': '/templates/attendance',
  title: 'Attendance certificate',
  description: 'Issued to everyone who attended the training.',
  background: {
    data: STORY_BACKGROUND.split(',')[1],
    encoding: 'utf8',
    'content-type': 'image/svg+xml',
  },
  blueprint: STORY_BLUEPRINT,
  items: [],
};

export const Default: Story = {
  render: () => (
    <Wrapper customStore={{ certificates }}>
      <CertificateTemplateView content={content} />
    </Wrapper>
  ),
};

export const Editable: Story = {
  render: () => (
    <Wrapper
      customStore={{
        certificates,
        actions: editActions,
      }}
    >
      <CertificateTemplateView content={content} />
    </Wrapper>
  ),
};

export const WithoutDesign: Story = {
  render: () => (
    <Wrapper customStore={{ certificates }}>
      <CertificateTemplateView content={{ ...content, blueprint: null }} />
    </Wrapper>
  ),
};
