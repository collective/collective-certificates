import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { STORY_BACKGROUND, STORY_BLUEPRINT, STORY_DATA } from '../storyData';
import Stage from './Stage';

const meta: Meta<typeof Stage> = {
  title: 'Certificates/Designer/Stage',
  component: Stage,
};

export default meta;

type Story = StoryObj<typeof Stage>;

function Controlled({ showSample }: { showSample: boolean }) {
  const [selection, setSelection] = useState<string | null>('name');
  return (
    <Stage
      blueprint={STORY_BLUEPRINT}
      assets={{ background: STORY_BACKGROUND }}
      data={STORY_DATA}
      showSample={showSample}
      zoom={0.5}
      selection={selection}
      guides={null}
      onSelect={setSelection}
      renderSelection={(_element, box) => (
        <div
          className="certificate-selection"
          style={{
            left: box.x * 0.5,
            top: box.y * 0.5,
            width: Math.max(8, box.width * 0.5),
            height: Math.max(8, box.height * 0.5),
          }}
        />
      )}
    />
  );
}

export const SampleData: Story = { render: () => <Controlled showSample /> };
export const Placeholders: Story = {
  render: () => <Controlled showSample={false} />,
};
