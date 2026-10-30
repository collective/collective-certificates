import type { Meta, StoryObj } from '@storybook/react';
import Toolbar from './Toolbar';

const noop = () => {};

const meta: Meta<typeof Toolbar> = {
  title: 'Certificates/Designer/Toolbar',
  component: Toolbar,
  args: {
    hasSelection: true,
    canUndo: true,
    canRedo: false,
    canZoomIn: true,
    canZoomOut: true,
    zoom: 0.25,
    showSample: true,
    applying: false,
    onAdd: noop,
    onUndo: noop,
    onRedo: noop,
    onDuplicate: noop,
    onDelete: noop,
    onZoom: noop,
    onToggleSample: noop,
    onApply: noop,
    onCancel: noop,
  },
};

export default meta;

type Story = StoryObj<typeof Toolbar>;

export const Default: Story = {};
export const NothingSelected: Story = { args: { hasSelection: false } };
export const Applying: Story = { args: { applying: true } };
