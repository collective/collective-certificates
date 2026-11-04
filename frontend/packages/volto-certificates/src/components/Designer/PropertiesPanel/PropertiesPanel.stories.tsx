import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RealStoreWrapper as Wrapper } from '@plone/volto/storybook';
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
import type { Blueprint } from '../../../blueprint/model';

const meta: Meta<typeof PropertiesPanel> = {
  title: 'Certificates/Designer/PropertiesPanel',
  component: PropertiesPanel,
  // Volto's widgets read the store; the panel is as wide as the sidebar.
  decorators: [
    (Story) => (
      <Wrapper>
        <div style={{ width: '375px' }}>{Story()}</div>
      </Wrapper>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof PropertiesPanel>;

/** The story certificate with a seal, so an image can be selected. */
const PANEL_BLUEPRINT: Blueprint = {
  ...STORY_BLUEPRINT,
  elements: [
    ...STORY_BLUEPRINT.elements,
    {
      id: 'seal',
      type: 'image',
      x: 150,
      y: 900,
      width: 240,
      height: 240,
      asset: 'signature',
    },
  ],
};

function Controlled({ id }: { id: string | null }) {
  const [blueprint, setBlueprint] = useState(PANEL_BLUEPRINT);
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
export const Image: Story = { render: () => <Controlled id="seal" /> };
export const NothingSelected: Story = {
  render: () => <Controlled id={null} />,
};
