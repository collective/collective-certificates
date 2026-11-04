import { useState } from 'react';
import { useIntl } from 'react-intl';
import { Button, Table } from 'semantic-ui-react';
import FormFieldWrapper from '@plone/volto/components/manage/Widgets/FormFieldWrapper';
import ModalForm from '@plone/volto/components/manage/Form/ModalForm';
import pencilSVG from '@plone/volto/icons/pencil.svg';
import { COMPUTED } from '../../../helpers/sampleData';
import { Icon } from '../../../helpers/widgets';
import useCertificateVocabularies from '../../../hooks/useCertificateVocabularies';
import messages from '../../../messages';
import type { Term } from '../../../reducers/certificates';

import './SampleDataWidget.scss';

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
 * The schema of the dialog: one field per term, dates with Volto's date
 * widget.
 *
 * @param title The dialog's title.
 * @param fields The fields the sample data can set.
 * @param kinds Kind of each field token.
 */
export function sampleSchema(
  title: string,
  fields: readonly Term[],
  kinds: Readonly<Record<string, string>>,
) {
  return {
    title,
    fieldsets: [
      {
        id: 'default',
        title: 'Default',
        fields: fields.map(({ token }) => token),
      },
    ],
    properties: Object.fromEntries(
      fields.map(({ token, title: fieldTitle }) => [
        token,
        kinds[token] === 'date'
          ? { title: fieldTitle, widget: 'date' }
          : { title: fieldTitle, type: 'string' },
      ]),
    ),
    required: [],
  };
}

/**
 * The values the dialog submitted, as the field stores them: strings only,
 * an emptied field left out.
 *
 * @param data The dialog's form data.
 * @param fields The fields the sample data can set.
 */
export function sampleValues(
  data: Readonly<Record<string, unknown>>,
  fields: readonly Term[],
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const { token } of fields) {
    const value = data[token];
    if (typeof value === 'string' && value !== '') values[token] = value;
  }
  return values;
}

/**
 * The `sample_data` field of a certificate template.
 *
 * A table shows the value of every field the template can print; Edit
 * opens a dialog with Volto's widgets for them, dates with its date
 * widget. Computed fields are filled by the system and not offered.
 * Nothing is saved here: the dialog changes the field's value, and the
 * content form saves it.
 */
export default function SampleDataWidget(props: SampleDataWidgetProps) {
  const { id, title, value, isDisabled, onChange } = props;
  const intl = useIntl();
  const { fields: all, fieldKinds } = useCertificateVocabularies();
  const [editing, setEditing] = useState(false);
  const current = value ?? {};
  const fields = all.filter(({ token }) => fieldKinds[token] !== COMPUTED);
  const editLabel = intl.formatMessage(messages.sampleEdit);
  return (
    <div className="certificate-sample-data">
      <FormFieldWrapper {...props} noForInFieldLabel>
        <Button
          type="button"
          basic
          icon
          disabled={isDisabled || fields.length === 0}
          className="certificate-sample-data-edit"
          aria-label={editLabel}
          title={editLabel}
          onClick={() => setEditing(true)}
        >
          <Icon name={pencilSVG} size="20px" ariaHidden />
        </Button>
      </FormFieldWrapper>
      <Table compact celled className="certificate-sample-data-table">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>
              {intl.formatMessage(messages.sampleField)}
            </Table.HeaderCell>
            <Table.HeaderCell>
              {intl.formatMessage(messages.sampleValue)}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {fields.map(({ token, title: fieldTitle }) => (
            <Table.Row key={token} data-field={token}>
              <Table.Cell>{fieldTitle}</Table.Cell>
              <Table.Cell>
                {current[token] ?? (
                  <span className="certificate-sample-data-unset">
                    {intl.formatMessage(messages.sampleUnset)}
                  </span>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      {/* ModalForm renders into a portal, and React delivers a portal's
          events to its React ancestors: without this, pressing Enter in the
          dialog would also submit the content form. */}
      <div onSubmit={(event) => event.stopPropagation()}>
        {editing ? (
          <ModalForm
            open
            title={editLabel}
            schema={sampleSchema(title, fields, fieldKinds)}
            formData={current}
            onSubmit={(data: Record<string, unknown>) => {
              onChange(id, sampleValues(data, fields));
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : null}
      </div>
    </div>
  );
}
