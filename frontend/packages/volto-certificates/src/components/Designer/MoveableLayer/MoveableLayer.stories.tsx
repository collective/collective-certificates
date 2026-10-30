import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  findElement,
  moveElement,
  updateElement,
} from '../../../blueprint/ops';
import { elementBox } from '../../../helpers/snapping';
import { STORY_BLUEPRINT } from '../storyData';
import MoveableLayer from './MoveableLayer';
import type { Guides } from '../../../helpers/snapping';

const meta: Meta<typeof MoveableLayer> = {
  title: 'Certificates/Designer/MoveableLayer',
  component: MoveableLayer,
};

export default meta;

type Story = StoryObj<typeof MoveableLayer>;

const ZOOM = 0.4;

function Playground() {
  const [blueprint, setBlueprint] = useState(STORY_BLUEPRINT);
  const [guides, setGuides] = useState<Guides | null>(null);
  const qr = findElement(blueprint, 'qr');
  if (!qr) return null;
  return (
    <div
      style={{
        position: 'relative',
        width: blueprint.page.width * ZOOM,
        height: blueprint.page.height * ZOOM,
        background: '#fbf8f1',
        outline: '1px solid #ccc',
      }}
    >
      {guides?.vertical.map((x) => (
        <div
          key={x}
          style={{
            position: 'absolute',
            left: x * ZOOM,
            top: 0,
            bottom: 0,
            width: 1,
            background: '#e0367a',
          }}
        />
      ))}
      <MoveableLayer
        element={qr}
        box={elementBox(qr)}
        zoom={ZOOM}
        blueprint={blueprint}
        snapTolerance={10}
        onMove={(x, y) => setBlueprint(moveElement(blueprint, 'qr', x, y))}
        onResize={(patch) =>
          setBlueprint(updateElement(blueprint, 'qr', patch))
        }
        onGuides={setGuides}
      />
    </div>
  );
}

export const QrCode: Story = { render: () => <Playground /> };
