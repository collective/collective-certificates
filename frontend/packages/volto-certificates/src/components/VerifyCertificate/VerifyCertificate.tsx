import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Container as SemanticContainer } from 'semantic-ui-react';
import config from '@plone/volto/registry';
import { getCertificateVerification } from '../../actions/certificates';
import messages from '../../messages';
import type { ComponentType, ReactNode } from 'react';
import type { CertificatesState } from '../../reducers/certificates';

import './VerifyCertificate.scss';

export interface VerifyCertificateProps {
  match: { params: { uid: string } };
}

const DATE_OPTIONS = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
} as const;

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
      <p className="verify-issued">
        {intl.formatMessage(messages.verifyIssued, {
          date: intl.formatDate(result.issued, DATE_OPTIONS),
        })}
      </p>
      <dl className="verify-fields">
        {result.fields
          .filter((field) => field.kind !== 'computed')
          .map((field) => (
            <div key={field.token}>
              <dt>{field.title}</dt>
              <dd>
                {field.kind === 'date'
                  ? intl.formatDate(field.value, {
                      ...DATE_OPTIONS,
                      timeZone: 'UTC',
                    })
                  : field.value}
              </dd>
            </div>
          ))}
      </dl>
      {result.file && (
        <p>
          <a
            className="ui button"
            href={`/++api++/@@certificate-file/${result.uid}`}
          >
            {intl.formatMessage(messages.verifyDownload)}
          </a>
        </p>
      )}
    </Container>
  );
}
