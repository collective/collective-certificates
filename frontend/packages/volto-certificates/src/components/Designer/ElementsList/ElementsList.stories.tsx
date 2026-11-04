import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RealStoreWrapper as Wrapper } from '@plone/volto/storybook';
import { reorderElement } from '../../../blueprint/ops';
import { STORY_BLUEPRINT } from '../storyData';
import ElementsList from './ElementsList';
import type { Blueprint } from '../../../blueprint/model';

const meta: Meta<typeof ElementsList> = {
  title: 'Certificates/Designer/ElementsList',
  component: ElementsList,
  // The drag library is one of Volto's lazy libraries, loaded through the store.
  decorators: [
    (Story) => (
      <Wrapper>
        <div style={{ width: '16rem' }}>{Story()}</div>
      </Wrapper>
    ),
  ],
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
      onReorder={(id, target) =>
        setBlueprint(reorderElement(blueprint, id, target))
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
