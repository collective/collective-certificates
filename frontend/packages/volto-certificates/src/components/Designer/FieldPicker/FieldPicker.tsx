import { useIntl } from 'react-intl';
import { placeholderFor } from '../../../helpers/text';
import { SelectWidget } from '../../../helpers/widgets';
import messages from '../../../messages';
import type { Term } from '../../../reducers/certificates';

export interface FieldPickerProps {
  id: string;
  fields: readonly Term[];
  kinds: Readonly<Record<string, string>>;
  /** Receives the placeholder to insert, such as `{{ full_name }}`. */
  onInsert: (placeholder: string) => void;
}

/**
 * Choosing a field inserts its placeholder; date fields also offer `|date`.
 * The select keeps no value, so the same field can be inserted again.
 */
export default function FieldPicker({
  id,
  fields,
  kinds,
  onInsert,
}: FieldPickerProps) {
  const intl = useIntl();
  const choices = fields.flatMap(({ token, title }): [string, string][] => {
    const plain: [string, string] = [placeholderFor(token), title];
    if (kinds[token] !== 'date') return [plain];
    return [
      plain,
      [
        placeholderFor(token, 'date'),
        intl.formatMessage(messages.asDate, { title }),
      ],
    ];
  });
  return (
    <SelectWidget
      id={id}
      title={intl.formatMessage(messages.insertField)}
      value={null}
      choices={choices}
      noValueOption={false}
      isDisabled={choices.length === 0}
      placeholder={intl.formatMessage(messages.insert)}
      onChange={(_id, placeholder) => placeholder && onInsert(placeholder)}
    />
  );
}
