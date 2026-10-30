import { useIntl } from 'react-intl';
import {
  expandToBackendURL,
  flattenToAppURL,
} from '@plone/volto/helpers/Url/Url';
import messages from '../../../messages';

export interface PreviewPaneProps {
  /** The saved template's URL; `null` while it is being added. */
  templateUrl: string | null;
  /** Changes the image URL so a new save is fetched again. */
  version?: string;
}

/** The server's rendering of the template as saved (`@preview`). */
export default function PreviewPane({
  templateUrl,
  version,
}: PreviewPaneProps) {
  const intl = useIntl();
  const title = intl.formatMessage(messages.serverPreview);
  return (
    <section className="certificate-preview" aria-label={title}>
      <h3>{title}</h3>
      {templateUrl ? (
        <>
          <p>{intl.formatMessage(messages.serverPreviewNote)}</p>
          <img
            src={expandToBackendURL(
              `${flattenToAppURL(templateUrl)}/@preview?format=png${
                version ? `&v=${encodeURIComponent(version)}` : ''
              }`,
            )}
            alt={title}
            loading="lazy"
          />
        </>
      ) : (
        <p>{intl.formatMessage(messages.serverPreviewUnsaved)}</p>
      )}
    </section>
  );
}
