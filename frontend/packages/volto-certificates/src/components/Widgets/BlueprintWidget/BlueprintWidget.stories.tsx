import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RealStoreWrapper as Wrapper } from '@plone/volto/storybook';
import {
  STORY_BACKGROUND,
  STORY_BLUEPRINT,
  STORY_FIELDS,
  STORY_FONTS,
  STORY_KINDS,
  STORY_LEVELS,
} from '../../Designer/storyData';
import BlueprintWidget from './BlueprintWidget';
import type { Blueprint } from '../../../blueprint/model';
import type { TemplateFormData } from './BlueprintWidget';

const meta: Meta<typeof BlueprintWidget> = {
  title: 'Certificates/Widgets/BlueprintWidget',
  component: BlueprintWidget,
};

export default meta;

type Story = StoryObj<typeof BlueprintWidget>;

const certificates = {
  fonts: STORY_FONTS,
  fields: STORY_FIELDS,
  fieldKinds: STORY_KINDS,
  errorCorrections: STORY_LEVELS,
  vocabularies: { loading: false, loaded: true, error: null },
  validation: { loading: false, valid: null, errors: [], error: null },
};

const background = {
  data: STORY_BACKGROUND.split(',')[1],
  encoding: 'utf8',
  'content-type': 'image/svg+xml',
};

function Controlled({ formData }: { formData: TemplateFormData }) {
  const [value, setValue] = useState<Blueprint>(STORY_BLUEPRINT);
  return (
    <Wrapper customStore={{ certificates }}>
      <div className="ui form">
        <BlueprintWidget
          id="blueprint"
          title="Blueprint"
          description="Layout of the certificate."
          value={value}
          formData={formData}
          onChange={(_id, next) => setValue(next)}
        />
      </div>
    </Wrapper>
  );
}

export const WithBackground: Story = {
  render: () => <Controlled formData={{ background }} />,
};

export const WithoutBackground: Story = {
  render: () => <Controlled formData={{}} />,
};
