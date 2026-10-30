import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  findElement,
  renameElement,
  updateElement,
} from '../../../blueprint/ops';
import {
  STORY_BLUEPRINT,
  STORY_FIELDS,
  STORY_FONTS,
  STORY_KINDS,
  STORY_LEVELS,
} from '../storyData';
import PropertiesPanel from './PropertiesPanel';

const meta: Meta<typeof PropertiesPanel> = {
  title: 'Certificates/Designer/PropertiesPanel',
  component: PropertiesPanel,
  decorators: [(Story) => <div style={{ width: '20rem' }}>{Story()}</div>],
};

export default meta;

type Story = StoryObj<typeof PropertiesPanel>;

function Controlled({ id }: { id: string | null }) {
  const [blueprint, setBlueprint] = useState(STORY_BLUEPRINT);
  const [current, setCurrent] = useState(id);
  return (
    <PropertiesPanel
      element={findElement(blueprint, current) ?? null}
      blueprint={blueprint}
      fonts={STORY_FONTS}
      fields={STORY_FIELDS}
      kinds={STORY_KINDS}
      errorCorrections={STORY_LEVELS}
      assets={[
        { value: 'background', label: 'Background' },
        { value: 'signature', label: 'Signature' },
      ]}
      onChange={(patch) =>
        current && setBlueprint(updateElement(blueprint, current, patch))
      }
      onRename={(newId) => {
        if (!current) return;
        setBlueprint(renameElement(blueprint, current, newId));
        setCurrent(newId);
      }}
    />
  );
}

export const Text: Story = { render: () => <Controlled id="name" /> };
export const QrCode: Story = { render: () => <Controlled id="qr" /> };
export const NothingSelected: Story = {
  render: () => <Controlled id={null} />,
};
