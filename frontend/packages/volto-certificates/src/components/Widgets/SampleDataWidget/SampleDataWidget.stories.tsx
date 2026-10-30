import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RealStoreWrapper as Wrapper } from '@plone/volto/storybook';
import {
  STORY_FIELDS,
  STORY_FONTS,
  STORY_KINDS,
  STORY_LEVELS,
} from '../../Designer/storyData';
import SampleDataWidget from './SampleDataWidget';

const meta: Meta<typeof SampleDataWidget> = {
  title: 'Certificates/Widgets/SampleDataWidget',
  component: SampleDataWidget,
};

export default meta;

type Story = StoryObj<typeof SampleDataWidget>;

const certificates = {
  fonts: STORY_FONTS,
  fields: STORY_FIELDS,
  fieldKinds: STORY_KINDS,
  errorCorrections: STORY_LEVELS,
  vocabularies: { loading: false, loaded: true, error: null },
  validation: { loading: false, valid: null, errors: [], error: null },
};

function Controlled() {
  const [value, setValue] = useState<Record<string, string>>({
    full_name: 'Patrick Stewart',
  });
  return (
    <Wrapper customStore={{ certificates }}>
      <div className="ui form">
        <SampleDataWidget
          id="sample_data"
          title="Sample data"
          description="Values the preview uses."
          value={value}
          onChange={(_id, next) => setValue(next)}
        />
      </div>
    </Wrapper>
  );
}

export const Default: Story = { render: () => <Controlled /> };
