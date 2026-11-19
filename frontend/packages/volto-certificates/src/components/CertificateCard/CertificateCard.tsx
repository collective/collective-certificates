import { useIntl } from 'react-intl';
import verifiedSVG from '@plone/volto/icons/verified.svg';
import { fileType, sizeUnit } from '../../helpers/files';
import { Icon } from '../../helpers/widgets';
import messages from '../../messages';
import type { ReactNode } from 'react';
import type { CertificateFile } from '../../helpers/files';

import './CertificateCard.scss';

export interface CertificateCardProps {
  /** When the certificate was issued, as an ISO date. */
  issued: string;
  /** The certificate's file, or `null` when it has none. */
  file: Pick<CertificateFile, 'filename' | 'content-type' | 'size'> | null;
  /** Where the download button points. */
  downloadUrl: string;
  /** More buttons, shown after the download button. */
  children?: ReactNode;
}

const DATE_OPTIONS = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
} as const;

/**
 * The card at the top of a certificate's pages: when it was issued and a
 * button to download it, with the file's type and size.
 */
export default function CertificateCard({
  issued,
  file,
  downloadUrl,
  children,
}: CertificateCardProps) {
  const intl = useIntl();

  const describeFile = () => {
    if (!file) return '';
    const { value, unit } = sizeUnit(file.size);
    return intl.formatMessage(messages.certificateFileDetails, {
      type: fileType(file),
      size: intl.formatNumber(value, {
        style: 'unit',
        unit,
        unitDisplay: 'short',
        maximumFractionDigits: unit === 'byte' ? 0 : 1,
      }),
    });
  };

  return (
    <section className="certificate-card">
      <Icon name={verifiedSVG} size="48px" ariaHidden />
      <div className="certificate-card-body">
        <p className="certificate-issued">
          {intl.formatMessage(messages.verifyIssued, {
            date: intl.formatDate(issued, DATE_OPTIONS),
          })}
        </p>
        {!file && <p>{intl.formatMessage(messages.certificateFileMissing)}</p>}
        <div className="certificate-actions">
          {file && (
            <a
              className="ui primary button"
              href={downloadUrl}
              download={file.filename}
            >
              {intl.formatMessage(messages.downloadCertificate)}
            </a>
          )}
          {children}
        </div>
        {file && <p className="certificate-file-details">{describeFile()}</p>}
      </div>
    </section>
  );
}
