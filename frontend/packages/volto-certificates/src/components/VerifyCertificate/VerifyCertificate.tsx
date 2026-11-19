import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Container as SemanticContainer } from 'semantic-ui-react';
import config from '@plone/volto/registry';
import { getCertificateVerification } from '../../actions/certificates';
import messages from '../../messages';
import CertificateCard from '../CertificateCard/CertificateCard';
import CertificateFingerprint from '../CertificateFingerprint/CertificateFingerprint';
import CertificateValues from '../CertificateValues/CertificateValues';
import type { ComponentType, ReactNode } from 'react';
import type { CertificatesState } from '../../reducers/certificates';

export interface VerifyCertificateProps {
  match: { params: { uid: string } };
}

/**
 * The page the QR code of a certificate opens: whether the certificate
 * is valid, and its details.
 */
export default function VerifyCertificate({ match }: VerifyCertificateProps) {
  const { uid } = match.params;
  const intl = useIntl();
  const dispatch = useDispatch();
  const Container = (config.getComponent({ name: 'Container' }).component ||
    SemanticContainer) as ComponentType<{
    className?: string;
    children?: ReactNode;
  }>;
  const verification = useSelector(
    (store: { certificates: CertificatesState }) =>
      store.certificates.verification,
  );
  const loadedUid = verification.result?.uid;
  // Ask only for a certificate the store does not hold already.
  useEffect(() => {
    if (loadedUid !== uid) dispatch(getCertificateVerification(uid));
  }, [dispatch, uid, loadedUid]);

  const result = loadedUid === uid ? verification.result : null;
  const failed = !result && verification.error !== null;

  if (!result) {
    return (
      <Container className="verify-certificate">
        <h1 className="documentFirstHeading">
          {intl.formatMessage(messages.verifyTitle)}
        </h1>
        <p>
          {intl.formatMessage(
            failed ? messages.verifyNotFound : messages.verifyChecking,
          )}
        </p>
      </Container>
    );
  }

  return (
    <Container className="verify-certificate">
      <h1 className="documentFirstHeading">
        {intl.formatMessage(messages.verifyValid)}
      </h1>
      <h2>{result.title}</h2>
      <CertificateCard
        issued={result.issued}
        file={result.file}
        downloadUrl={`/++api++/@@certificate-file/${result.uid}`}
      />
      <CertificateValues values={result.fields} />
      {result.file?.sha256 && (
        <CertificateFingerprint hash={result.file.sha256} />
      )}
    </Container>
  );
}
