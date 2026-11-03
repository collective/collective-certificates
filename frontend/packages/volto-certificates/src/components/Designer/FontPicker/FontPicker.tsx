import { useIntl } from 'react-intl';
import { SelectOption, SelectWidget } from '../../../helpers/widgets';
import messages from '../../../messages';
import type { SelectOptionProps } from '../../../helpers/widgets';
import type { Term } from '../../../reducers/certificates';

export interface FontPickerProps {
  id: string;
  value: string;
  fonts: readonly Term[];
  onChange: (token: string) => void;
}

/** An option of the menu, shown in its own family. */
function FontOption(props: SelectOptionProps) {
  return (
    <div
      className="certificate-font-option"
      style={{ fontFamily: `"${props.data.value}"` }}
    >
      <SelectOption {...props} />
    </div>
  );
}

/** Choose a font; each family is shown in itself. */
export default function FontPicker({
  id,
  value,
  fonts,
  onChange,
}: FontPickerProps) {
  const intl = useIntl();
  // A font that is no longer available stays selectable, so it shows.
  const options = fonts.some((font) => font.token === value)
    ? fonts
    : [{ token: value, title: value }, ...fonts];
  return (
    <SelectWidget
      id={id}
      title={intl.formatMessage(messages.font)}
      value={value}
      choices={options.map((font) => [font.token, font.title])}
      required
      noValueOption={false}
      customOptionStyling={FontOption}
      onChange={(_id, token) => token && onChange(token)}
    />
  );
}
