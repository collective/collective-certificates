import type { Meta, StoryObj } from '@storybook/react';
import {
  STORY_BACKGROUND,
  STORY_BLUEPRINT,
  STORY_DATA,
} from '../Designer/storyData';
import TemplatePreview from './TemplatePreview';

const meta: Meta<typeof TemplatePreview> = {
  title: 'Certificates/TemplatePreview',
  component: TemplatePreview,
  args: {
    blueprint: STORY_BLUEPRINT,
    assets: { background: STORY_BACKGROUND },
    data: STORY_DATA,
    dateFormat: '%d/%m/%Y',
    months: [],
  },
  decorators: [(Story) => <div style={{ width: '40rem' }}>{Story()}</div>],
};

export default meta;

type Story = StoryObj<typeof TemplatePreview>;

export const WithSampleData: Story = {};

export const MissingField: Story = {
  args: { data: {} },
};
