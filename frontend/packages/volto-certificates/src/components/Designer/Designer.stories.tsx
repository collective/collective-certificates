import type { Meta, StoryObj } from '@storybook/react';
import { RealStoreWrapper as Wrapper } from '@plone/volto/storybook';
import Designer from './Designer';
import {
  STORY_BACKGROUND,
  STORY_BLUEPRINT,
  STORY_DATA,
  STORY_FIELDS,
  STORY_FONTS,
  STORY_KINDS,
  STORY_LEVELS,
} from './storyData';

const meta: Meta<typeof Designer> = {
  title: 'Certificates/Designer',
  component: Designer,
  // Volto's widgets in the properties panel read the store.
  decorators: [(Story) => <Wrapper>{Story()}</Wrapper>],
  args: {
    blueprint: STORY_BLUEPRINT,
    templateUrl: null,
    assets: {
      background: { url: STORY_BACKGROUND, width: 1754, height: 1240 },
      images: [],
    },
    fonts: STORY_FONTS,
    fields: STORY_FIELDS,
    fieldKinds: STORY_KINDS,
    errorCorrections: STORY_LEVELS,
    data: STORY_DATA,
    onApply: () => {},
    onCancel: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof Designer>;

export const Default: Story = {};

export const Empty: Story = {
  args: { blueprint: { ...STORY_BLUEPRINT, elements: [] } },
};

export const BackgroundMismatch: Story = {
  args: {
    assets: {
      background: { url: STORY_BACKGROUND, width: 3508, height: 2480 },
      images: [],
    },
  },
};

export const ServerProblems: Story = {
  args: {
    serverErrors: [
      {
        element: 'qr',
        path: '/elements/3',
        message: 'qr: the element does not fit on the page.',
      },
    ],
  },
};
