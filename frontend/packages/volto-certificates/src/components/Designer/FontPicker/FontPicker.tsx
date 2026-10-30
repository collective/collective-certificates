import { useIntl } from 'react-intl';
import messages from '../../../messages';
import type { Term } from '../../../reducers/certificates';

export interface FontPickerProps {
  id: string;
  value: string;
  fonts: readonly Term[];
  onChange: (token: string) => void;
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
    <div className="certificate-font-picker">
      <label htmlFor={id}>{intl.formatMessage(messages.font)}</label>
      <select
        id={id}
        value={value}
        style={{ fontFamily: `"${value}"` }}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((font) => (
          <option
            key={font.token}
            value={font.token}
            style={{ fontFamily: `"${font.token}"` }}
          >
            {font.title}
          </option>
        ))}
      </select>
    </div>
  );
}
