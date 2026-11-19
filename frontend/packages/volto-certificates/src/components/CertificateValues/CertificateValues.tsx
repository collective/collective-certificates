import { useIntl } from 'react-intl';
import { Table } from 'semantic-ui-react';
import { COMPUTED } from '../../helpers/sampleData';
import messages from '../../messages';

import './CertificateValues.scss';

/** A value printed on a certificate, with its field's title and kind. */
export interface CertificateValue {
  token: string;
  title: string;
  /** `text`, `date` or `computed`. */
  kind: string;
  value: string;
}

export interface CertificateValuesProps {
  values: CertificateValue[];
}

/**
 * The values printed on a certificate, as a table of field and value.
 * Computed and empty values are left out; with none left, nothing shows.
 */
export default function CertificateValues({ values }: CertificateValuesProps) {
  const intl = useIntl();
  const rows = values.filter(
    (field) => field.kind !== COMPUTED && field.value !== '',
  );
  if (rows.length === 0) return null;

  const formatValue = (field: CertificateValue) =>
    field.kind === 'date'
      ? intl.formatDate(field.value, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC',
        })
      : field.value;

  return (
    <section className="certificate-values">
      <h2>{intl.formatMessage(messages.certificateValues)}</h2>
      <Table celled unstackable className="certificate-values-table">
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
          {rows.map((field) => (
            <Table.Row key={field.token} data-field={field.token}>
              <Table.Cell as="th" scope="row">
                {field.title}
              </Table.Cell>
              <Table.Cell>{formatValue(field)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </section>
  );
}
