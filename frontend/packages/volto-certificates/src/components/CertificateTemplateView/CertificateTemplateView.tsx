import { useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Container as SemanticContainer } from 'semantic-ui-react';
import config from '@plone/volto/registry';
import UniversalLink from '@plone/volto/components/manage/UniversalLink/UniversalLink';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import {
  createCertificates,
  getCertificatesCsv,
} from '../../actions/certificates';
import { BACKGROUND_ASSET } from '../../blueprint/model';
import { datePattern } from '../../blueprint/dateFormats';
import { readTextFile, saveCsvFile } from '../../helpers/csv';
import { imageSource, templateImages } from '../../helpers/image';
import { monthNames } from '../../helpers/months';
import { previewData } from '../../helpers/sampleData';
import useCertificateVocabularies from '../../hooks/useCertificateVocabularies';
import messages from '../../messages';
import TemplatePreview from '../TemplatePreview/TemplatePreview';
import type { ChangeEvent, ComponentType, ReactNode } from 'react';
import type { Blueprint } from '../../blueprint/model';
import type { ContentItem, ImageValue } from '../../helpers/image';
import type {
  BatchIssue,
  CertificatesState,
} from '../../reducers/certificates';

import './CertificateTemplateView.scss';

/** The serialized certificate template the view shows. */
export interface CertificateTemplateContent {
  '@id': string;
  title?: string;
  description?: string;
  background?: ImageValue;
  blueprint?: Blueprint | null;
  sample_data?: Record<string, unknown> | null;
  date_format?: string | null;
  items?: ContentItem[];
}

export interface CertificateTemplateViewProps {
  content: CertificateTemplateContent;
}

/** The file `@certificates-csv` answers with. */
interface CsvTemplate {
  filename: string;
  csv: string;
}

/** The actions of the object being viewed, as Volto keeps them. */
interface ObjectActionsStore {
  actions?: { actions?: { object?: { id: string }[] } };
}

/**
 * The view of a certificate template: the certificate drawn with the
 * sample data, and the images its design can show. Users who can edit the
 * template also get the CSV tools that issue certificates in bulk.
 */
export default function CertificateTemplateView({
  content,
}: CertificateTemplateViewProps) {
  const intl = useIntl();
  const dispatch = useDispatch();
  const Container = (config.getComponent({ name: 'Container' }).component ||
    SemanticContainer) as ComponentType<{
    className?: string;
    children?: ReactNode;
  }>;
  const vocabularies = useCertificateVocabularies();
  const canEdit = useSelector(
    (store: ObjectActionsStore) =>
      store.actions?.actions?.object?.some((action) => action.id === 'edit') ??
      false,
  );
  const batch = useSelector(
    (store: { certificates: CertificatesState }) => store.certificates.batch,
  );
  const [downloadFailed, setDownloadFailed] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const siteUrl = (config.settings.publicURL as string | undefined) ?? '';
  const background = imageSource(content.background);
  const images = useMemo(() => templateImages(content.items), [content.items]);
  const backgroundUrl = background?.url;
  const assets = useMemo(() => {
    const found: Record<string, string> = {};
    for (const image of images) found[image.id] = image.url;
    if (backgroundUrl) found[BACKGROUND_ASSET] = backgroundUrl;
    return found;
  }, [images, backgroundUrl]);
  const data = useMemo(
    () =>
      previewData(
        vocabularies.fields,
        vocabularies.fieldKinds,
        content.sample_data,
        siteUrl,
      ),
    [
      vocabularies.fields,
      vocabularies.fieldKinds,
      content.sample_data,
      siteUrl,
    ],
  );
  const months = useMemo(() => monthNames(intl.locale), [intl.locale]);
  const fonts = useMemo(
    () => vocabularies.fonts.map((font) => font.token),
    [vocabularies.fonts],
  );

  const downloadCsv = async () => {
    setDownloadFailed(false);
    try {
      const template = (await dispatch(
        getCertificatesCsv(content['@id']) as never,
      )) as unknown as CsvTemplate;
      saveCsvFile(template.csv, template.filename);
    } catch {
      setDownloadFailed(true);
    }
  };

  const uploadCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    // Clear the input so that choosing the same file again fires a change.
    input.value = '';
    if (!file) return;
    try {
      const csv = await readTextFile(file);
      await dispatch(createCertificates(content['@id'], csv) as never);
    } catch {
      // A rejected request is also in the store; the results below show it.
    }
  };

  const renderBatch = () => {
    if (batch.loading) {
      return (
        <p className="certificate-template-csv-status" role="status">
          {intl.formatMessage(messages.creatingCertificates)}
        </p>
      );
    }
    if (batch.result) {
      return (
        <div className="certificate-template-csv-status" role="status">
          <p>
            {intl.formatMessage(messages.certificatesCreated, {
              count: batch.result.items_total,
            })}
          </p>
          <ul>
            {batch.result.items.map((item) => (
              <li key={item['@id']}>
                <UniversalLink href={flattenToAppURL(item['@id'])}>
                  {item.title}
                </UniversalLink>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    if (batch.errors.length === 0 && batch.error === null) return null;
    return (
      <div className="certificate-template-csv-status csv-errors" role="alert">
        <p>{intl.formatMessage(messages.noCertificatesCreated)}</p>
        {batch.errors.length > 0 ? (
          <ul>
            {batch.errors.map((issue: BatchIssue, index) => (
              <li key={index}>{describeIssue(issue)}</li>
            ))}
          </ul>
        ) : (
          <p>{intl.formatMessage(messages.createFailed)}</p>
        )}
      </div>
    );
  };

  // Only a row the server gives is shown as a line; row 0 is the whole
  // file, and a blueprint issue has no row at all.
  const describeIssue = (issue: BatchIssue) => {
    if (typeof issue.row !== 'number' || issue.row === 0) return issue.message;
    if (issue.column) {
      return intl.formatMessage(messages.csvErrorAt, {
        row: issue.row,
        column: issue.column,
        message: issue.message,
      });
    }
    return intl.formatMessage(messages.csvErrorLine, {
      row: issue.row,
      message: issue.message,
    });
  };

  return (
    <Container className="view-wrapper certificate-template-view">
      <h1 className="documentFirstHeading">{content.title}</h1>
      {content.description && (
        <p className="documentDescription">{content.description}</p>
      )}
      {canEdit && (
        <section className="certificate-template-csv">
          <div className="certificate-template-csv-actions">
            <Button primary onClick={downloadCsv}>
              {intl.formatMessage(messages.downloadCsvTemplate)}
            </Button>
            <Button primary onClick={() => fileInput.current?.click()}>
              {intl.formatMessage(messages.createFromCsv)}
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={uploadCsv}
            />
          </div>
          {downloadFailed && (
            <p className="csv-errors" role="alert">
              {intl.formatMessage(messages.csvDownloadFailed)}
            </p>
          )}
          {renderBatch()}
        </section>
      )}
      {content.blueprint ? (
        <figure className="certificate-template-figure">
          <TemplatePreview
            blueprint={content.blueprint}
            assets={assets}
            data={data}
            dateFormat={datePattern(content.date_format)}
            months={months}
            fonts={fonts}
          />
          <figcaption>
            {intl.formatMessage(messages.previewWithSampleData)}
          </figcaption>
        </figure>
      ) : (
        <p>{intl.formatMessage(messages.noDesign)}</p>
      )}
      <section className="certificate-template-images">
        <h2>{intl.formatMessage(messages.templateImages)}</h2>
        {images.length === 0 ? (
          <p>{intl.formatMessage(messages.addImagesHint)}</p>
        ) : (
          <ul>
            {images.map((image) => (
              <li key={image.id}>
                <UniversalLink href={image.href}>
                  <img src={`${image.url}/thumb`} alt="" />
                  <span>{image.title}</span>
                </UniversalLink>
                <code>{image.id}</code>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
