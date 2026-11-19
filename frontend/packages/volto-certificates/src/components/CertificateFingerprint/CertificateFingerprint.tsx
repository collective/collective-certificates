import { useState } from 'react';
import { useIntl } from 'react-intl';
import { Button } from 'semantic-ui-react';
import messages from '../../messages';

import './CertificateFingerprint.scss';

export interface CertificateFingerprintProps {
  /** The SHA-256 of the certificate's file, as 64 hexadecimal characters. */
  hash: string;
}

/**
 * The SHA-256 of a certificate's file, with a button to copy it and a word
 * on what to compare it with.
 */
export default function CertificateFingerprint({
  hash,
}: CertificateFingerprintProps) {
  const intl = useIntl();
  const [copied, setCopied] = useState(false);
  // Browsers give the clipboard only to secure pages.
  const canCopy =
    typeof navigator !== 'undefined' && Boolean(navigator.clipboard);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="certificate-fingerprint">
      <h2>{intl.formatMessage(messages.fingerprintTitle)}</h2>
      <p className="certificate-fingerprint-help">
        {intl.formatMessage(messages.fingerprintHelp)}
      </p>
      <div className="certificate-fingerprint-value">
        <code>{hash}</code>
        {canCopy && (
          <Button basic size="small" onClick={copy}>
            {intl.formatMessage(
              copied ? messages.fingerprintCopied : messages.fingerprintCopy,
            )}
          </Button>
        )}
      </div>
    </section>
  );
}
