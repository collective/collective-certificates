import { useState } from 'react';
import { useIntl } from 'react-intl';
import { placeholderFor } from '../../../helpers/text';
import messages from '../../../messages';
import type { Term } from '../../../reducers/certificates';

export interface FieldPickerProps {
  id: string;
  fields: readonly Term[];
  kinds: Readonly<Record<string, string>>;
  /** Receives the placeholder to insert, such as `{{ full_name }}`. */
  onInsert: (placeholder: string) => void;
}

/** Choose a field and insert its placeholder; date fields also offer `|date`. */
export default function FieldPicker({
  id,
  fields,
  kinds,
  onInsert,
}: FieldPickerProps) {
  const intl = useIntl();
  const options = fields.flatMap(({ token, title }) => {
    const plain = { value: placeholderFor(token), label: title };
    if (kinds[token] !== 'date') return [plain];
    return [
      plain,
      {
        value: placeholderFor(token, 'date'),
        label: intl.formatMessage(messages.asDate, { title }),
      },
    ];
  });
  const [choice, setChoice] = useState(options[0]?.value ?? '');
  const current = options.some((option) => option.value === choice)
    ? choice
    : options[0]?.value ?? '';
  return (
    <div className="certificate-field-picker">
      <label htmlFor={id}>{intl.formatMessage(messages.insertField)}</label>
      <select
        id={id}
        value={current}
        onChange={(event) => setChoice(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!current}
        onClick={() => onInsert(current)}
      >
        {intl.formatMessage(messages.insert)}
      </button>
    </div>
  );
}
