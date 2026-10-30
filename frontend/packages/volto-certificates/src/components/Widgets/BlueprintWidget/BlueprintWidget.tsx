import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import FormFieldWrapper from '@plone/volto/components/manage/Widgets/FormFieldWrapper';
import config from '@plone/volto/registry';
import { validateBlueprint } from '../../../actions/certificates';
import { BACKGROUND_ASSET, emptyBlueprint } from '../../../blueprint/model';
import { datePattern } from '../../../blueprint/dateFormats';
import { validate } from '../../../blueprint/validate';
import { imageSource } from '../../../helpers/image';
import { monthNames } from '../../../helpers/months';
import { previewData } from '../../../helpers/sampleData';
import useCertificateVocabularies from '../../../hooks/useCertificateVocabularies';
import useTemplateImages from '../../../hooks/useTemplateImages';
import messages from '../../../messages';
import Designer from '../../Designer/Designer';
import TemplatePreview from '../../TemplatePreview/TemplatePreview';
import type { Blueprint } from '../../../blueprint/model';
import type { DesignerSettings } from '../../../config/settings';
import type { ImageValue } from '../../../helpers/image';
import type { ServerIssue } from '../../../reducers/certificates';

import './BlueprintWidget.scss';

/** The template fields the widget reads from the form. */
export interface TemplateFormData {
  '@id'?: string;
  background?: ImageValue;
  sample_data?: Record<string, unknown> | null;
  date_format?: string | null;
}

export interface BlueprintWidgetProps {
  id: string;
  title: string;
  description?: string;
  required?: boolean;
  error?: string[];
  value?: Blueprint | string | null;
  /** Live, unsaved form values; absent when the form has one fieldset. */
  formData?: TemplateFormData;
  isDisabled?: boolean;
  onChange: (id: string, value: Blueprint) => void;
  [key: string]: unknown;
}

function parse(value: BlueprintWidgetProps['value']): Blueprint | null {
  if (!value) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as Blueprint;
  } catch {
    return null;
  }
}

/**
 * The `blueprint` field of a certificate template: a preview of the
 * layout and the button that opens the designer.
 */
export default function BlueprintWidget(props: BlueprintWidgetProps) {
  const { id, value, formData, isDisabled, onChange } = props;
  const intl = useIntl();
  const dispatch = useDispatch();
  const global = useSelector(
    (state: { form?: { global?: TemplateFormData } }) => state.form?.global,
  );
  const form: TemplateFormData = formData ?? global ?? {};
  const vocabularies = useCertificateVocabularies();
  const [open, setOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [serverErrors, setServerErrors] = useState<ServerIssue[]>([]);

  const background = imageSource(form.background);
  const blueprint =
    parse(value) ??
    emptyBlueprint(background?.width ?? 3508, background?.height ?? 2480);
  const templateUrl = form['@id'] ?? null;
  const images = useTemplateImages(templateUrl);
  const siteUrl = (config.settings.publicURL as string | undefined) ?? '';
  const data = useMemo(
    () =>
      previewData(
        vocabularies.fields,
        vocabularies.fieldKinds,
        form.sample_data,
        siteUrl,
      ),
    [vocabularies.fields, vocabularies.fieldKinds, form.sample_data, siteUrl],
  );
  const dateFormat = datePattern(form.date_format);
  const months = useMemo(() => monthNames(intl.locale), [intl.locale]);
  const backgroundUrl = background?.url;
  const assets = useMemo(() => {
    const found: Record<string, string> = {};
    for (const image of images) found[image.id] = image.url;
    if (backgroundUrl) found[BACKGROUND_ASSET] = backgroundUrl;
    return found;
  }, [images, backgroundUrl]);

  const close = () => {
    setOpen(false);
    setServerErrors([]);
  };

  const apply = async (next: Blueprint) => {
    if (!templateUrl) {
      // A template being added cannot be asked yet; the same rules run here.
      const local = validate(next, {
        fonts: new Set(vocabularies.fonts.map((font) => font.token)),
        fieldKinds: vocabularies.fieldKinds,
        checkLayout: false,
      });
      if (local.length === 0) {
        onChange(id, next);
        close();
      }
      return;
    }
    setApplying(true);
    try {
      const result = (await dispatch(
        validateBlueprint(templateUrl, next) as never,
      )) as unknown as { valid: boolean; errors: ServerIssue[] };
      if (result.valid) {
        onChange(id, next);
        close();
      } else {
        setServerErrors(result.errors);
      }
    } catch {
      setServerErrors([
        {
          element: null,
          path: '',
          message: intl.formatMessage(messages.noPreview, {
            detail: '@validate-blueprint',
          }),
        },
      ]);
    } finally {
      setApplying(false);
    }
  };

  const settings = (
    config.settings as { certificates?: { designer?: DesignerSettings } }
  ).certificates?.designer;

  return (
    <FormFieldWrapper {...props} className="certificate-blueprint">
      <div className="certificate-blueprint-widget">
        <TemplatePreview
          blueprint={blueprint}
          assets={assets}
          data={data}
          dateFormat={dateFormat}
          months={months}
        />
        <p className="certificate-blueprint-summary">
          {intl.formatMessage(messages.elementsCount, {
            count: blueprint.elements.length,
          })}
        </p>
        {!background && (
          <p className="certificate-blueprint-hint">
            {intl.formatMessage(messages.uploadBackgroundFirst)}
          </p>
        )}
        <button
          type="button"
          className="ui button"
          disabled={isDisabled || !background}
          onClick={() => setOpen(true)}
        >
          {intl.formatMessage(messages.openDesigner)}
        </button>
      </div>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <Designer
            blueprint={blueprint}
            templateUrl={templateUrl}
            assets={{ background, images }}
            fonts={vocabularies.fonts}
            fields={vocabularies.fields}
            fieldKinds={vocabularies.fieldKinds}
            errorCorrections={vocabularies.errorCorrections}
            data={data}
            dateFormat={dateFormat}
            months={months}
            settings={settings}
            serverErrors={serverErrors}
            applying={applying}
            onApply={apply}
            onCancel={close}
          />,
          document.body,
        )}
    </FormFieldWrapper>
  );
}
