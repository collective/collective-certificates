import type { Meta, StoryObj } from '@storybook/react';
import PreviewPane from './PreviewPane';

const meta: Meta<typeof PreviewPane> = {
  title: 'Certificates/Designer/PreviewPane',
  component: PreviewPane,
};

export default meta;

type Story = StoryObj<typeof PreviewPane>;

/** Needs a running backend with a template at this path. */
export const Saved: Story = { args: { templateUrl: '/certificates/template' } };
export const Unsaved: Story = { args: { templateUrl: null } };
