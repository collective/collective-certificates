import { useIntl } from 'react-intl';
import { Container as SemanticContainer } from 'semantic-ui-react';
import config from '@plone/volto/registry';
import UniversalLink from '@plone/volto/components/manage/UniversalLink/UniversalLink';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import useCertificateVocabularies from '../../hooks/useCertificateVocabularies';
import messages from '../../messages';
import CertificateCard from '../CertificateCard/CertificateCard';
import CertificateFingerprint from '../CertificateFingerprint/CertificateFingerprint';
import CertificateValues from '../CertificateValues/CertificateValues';
import type { ComponentType, ReactNode } from 'react';
import type { CertificateFile } from '../../helpers/files';

/** The serialized certificate the view shows. */
export interface CertificateContent {
  '@id': string;
  UID: string;
  title?: string;
  description?: string;
  created: string;
  data?: Record<string, unknown> | null;
  file?: CertificateFile | null;
  file_hash?: string | null;
}

export interface CertificateViewProps {
  content: CertificateContent;
}

/**
 * The view of an issued certificate, for the person it was issued to:
 * a button to download it, the values printed on it, and the fingerprint
 * of the file.
 */
export default function CertificateView({ content }: CertificateViewProps) {
  const intl = useIntl();
  const Container = (config.getComponent({ name: 'Container' }).component ||
    SemanticContainer) as ComponentType<{
    className?: string;
    children?: ReactNode;
  }>;
  const { fields, fieldKinds } = useCertificateVocabularies();
  const data = content.data ?? {};
  // In the order of the fields vocabulary.
  const values = fields
    .filter((field) => field.token in data)
    .map((field) => ({
      ...field,
      kind: fieldKinds[field.token],
      value: String(data[field.token] ?? ''),
    }));
  const file = content.file ?? null;

  return (
    <Container className="view-wrapper certificate-view">
      <h1 className="documentFirstHeading">{content.title}</h1>
      {content.description && (
        <p className="documentDescription">{content.description}</p>
      )}
      <CertificateCard
        issued={content.created}
        file={file}
        downloadUrl={file ? flattenToAppURL(file.download) : ''}
      >
        <UniversalLink className="ui button" href={`/verify/${content.UID}`}>
          {intl.formatMessage(messages.checkCertificate)}
        </UniversalLink>
      </CertificateCard>
      <CertificateValues values={values} />
      {content.file_hash && <CertificateFingerprint hash={content.file_hash} />}
    </Container>
  );
}
