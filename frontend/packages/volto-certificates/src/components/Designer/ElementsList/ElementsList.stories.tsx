import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { reorderElement } from '../../../blueprint/ops';
import { STORY_BLUEPRINT } from '../storyData';
import ElementsList from './ElementsList';
import type { Blueprint } from '../../../blueprint/model';

const meta: Meta<typeof ElementsList> = {
  title: 'Certificates/Designer/ElementsList',
  component: ElementsList,
};

export default meta;

type Story = StoryObj<typeof ElementsList>;

function Controlled({ initial }: { initial: Blueprint }) {
  const [blueprint, setBlueprint] = useState(initial);
  const [selection, setSelection] = useState<string | null>(null);
  return (
    <ElementsList
      elements={blueprint.elements}
      selection={selection}
      onSelect={setSelection}
      onReorder={(id, step) =>
        setBlueprint(reorderElement(blueprint, id, step))
      }
    />
  );
}

export const Sample: Story = {
  render: () => <Controlled initial={STORY_BLUEPRINT} />,
};

export const Empty: Story = {
  render: () => <Controlled initial={{ ...STORY_BLUEPRINT, elements: [] }} />,
};
