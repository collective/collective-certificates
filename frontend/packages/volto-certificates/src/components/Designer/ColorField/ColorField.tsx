import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import messages from '../../../messages';

const COLOR = /^#[0-9a-f]{6}$/;

export interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/**
 * A color picker beside a text input, for those who type colors or cannot
 * use the picker. Only valid `#rrggbb` values reach `onChange`.
 */
export default function ColorField({
  id,
  label,
  value,
  onChange,
}: ColorFieldProps) {
  const intl = useIntl();
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const invalid = !COLOR.test(text);
  const commit = (next: string) => {
    const normalized = next.trim().toLowerCase();
    setText(normalized);
    if (COLOR.test(normalized)) onChange(normalized);
  };
  return (
    <div className="certificate-color-field">
      <label htmlFor={`${id}-text`}>{label}</label>
      <div className="certificate-color-inputs">
        <input
          type="color"
          aria-label={label}
          value={COLOR.test(value) ? value : '#000000'}
          onChange={(event) => commit(event.target.value)}
        />
        <input
          id={`${id}-text`}
          type="text"
          value={text}
          maxLength={7}
          aria-invalid={invalid ? 'true' : undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          onChange={(event) => commit(event.target.value)}
        />
      </div>
      {invalid && (
        <p id={`${id}-error`} className="certificate-field-error">
          {intl.formatMessage(messages.colorInvalid)}
        </p>
      )}
    </div>
  );
}
