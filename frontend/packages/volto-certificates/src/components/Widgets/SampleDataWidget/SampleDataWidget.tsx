import FormFieldWrapper from '@plone/volto/components/manage/Widgets/FormFieldWrapper';
import { COMPUTED } from '../../../helpers/sampleData';
import useCertificateVocabularies from '../../../hooks/useCertificateVocabularies';

export interface SampleDataWidgetProps {
  id: string;
  title: string;
  description?: string;
  required?: boolean;
  error?: string[];
  value?: Record<string, string> | null;
  isDisabled?: boolean;
  onChange: (id: string, value: Record<string, string>) => void;
  [key: string]: unknown;
}

/**
 * The `sample_data` field of a certificate template: one input per field
 * the template can print, dates as date inputs. Computed fields are
 * filled by the system and not offered.
 */
export default function SampleDataWidget(props: SampleDataWidgetProps) {
  const { id, value, isDisabled, onChange } = props;
  const { fields, fieldKinds } = useCertificateVocabularies();
  const current = value ?? {};
  const update = (token: string, text: string) => {
    const next = { ...current };
    if (text === '') delete next[token];
    else next[token] = text;
    onChange(id, next);
  };
  return (
    <FormFieldWrapper {...props} className="certificate-sample-data">
      <div className="certificate-sample-data-fields">
        {fields
          .filter(({ token }) => fieldKinds[token] !== COMPUTED)
          .map(({ token, title }) => (
            <div key={token} className="certificate-sample-data-field">
              <label htmlFor={`${id}-${token}`}>{title}</label>
              <input
                id={`${id}-${token}`}
                type={fieldKinds[token] === 'date' ? 'date' : 'text'}
                value={current[token] ?? ''}
                disabled={isDisabled}
                onChange={(event) => update(token, event.target.value)}
              />
            </div>
          ))}
      </div>
    </FormFieldWrapper>
  );
}
