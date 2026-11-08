import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Segment } from 'semantic-ui-react';
import { ERROR_CORRECTIONS } from '../../../blueprint/model';
import { idProblem } from '../../../blueprint/ops';
import { insertAt } from '../../../helpers/text';
import {
  CheckboxWidget,
  FormFieldWrapper,
  NumberWidget,
  SelectWidget,
  TextWidget,
} from '../../../helpers/widgets';
import messages from '../../../messages';
import AnchorField from '../AnchorField/AnchorField';
import ColorField from '../ColorField/ColorField';
import FieldPicker from '../FieldPicker/FieldPicker';
import FontPicker from '../FontPicker/FontPicker';
import type {
  Blueprint,
  Element,
  ErrorCorrection,
  ImageElement,
  QrElement,
  TextElement,
} from '../../../blueprint/model';
import type { Term } from '../../../reducers/certificates';

export interface PropertiesPanelProps {
  element: Element | null;
  blueprint: Blueprint;
  fonts: readonly Term[];
  fields: readonly Term[];
  kinds: Readonly<Record<string, string>>;
  errorCorrections: readonly Term[];
  /** The images an image element can show, by asset name. */
  assets: readonly AssetOption[];
  onChange: (patch: Partial<Element>) => void;
  onRename: (newId: string) => void;
}

export interface AssetOption {
  value: string;
  label: string;
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: number | undefined;
  min: number;
  onChange: (value: number | undefined) => void;
  optional?: boolean;
}

/** An integer field; empty clears an optional value. */
function NumberField({
  id,
  label,
  value,
  min,
  onChange,
  optional = false,
}: NumberFieldProps) {
  return (
    <NumberWidget
      id={id}
      title={label}
      value={value ?? ''}
      minimum={min}
      step={1}
      onChange={(_id, raw) => {
        if (raw === undefined || raw === '') {
          if (optional) onChange(undefined);
          return;
        }
        const parsed = Math.round(Number(raw));
        if (Number.isFinite(parsed) && parsed >= min) onChange(parsed);
      }}
    />
  );
}

interface ContentFieldProps {
  id: string;
  value: string;
  fields: readonly Term[];
  kinds: Readonly<Record<string, string>>;
  onChange: (value: string) => void;
}

/** The content textarea; the field picker inserts at the cursor. */
function ContentField({
  id,
  value,
  fields,
  kinds,
  onChange,
}: ContentFieldProps) {
  const intl = useIntl();
  const ref = useRef<HTMLTextAreaElement>(null);
  const caret = useRef<number | null>(null);
  useEffect(() => {
    if (caret.current !== null && ref.current) {
      ref.current.focus();
      ref.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  });
  return (
    <>
      <FormFieldWrapper
        id={id}
        title={intl.formatMessage(messages.content)}
        className="textarea"
      >
        <textarea
          id={`field-${id}`}
          name={id}
          ref={ref}
          rows={3}
          maxLength={500}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </FormFieldWrapper>
      <FieldPicker
        id={`${id}-field`}
        fields={fields}
        kinds={kinds}
        onInsert={(placeholder) => {
          const node = ref.current;
          const [next, position] = insertAt(
            value,
            node?.selectionStart,
            node?.selectionEnd,
            placeholder,
          );
          caret.current = position;
          onChange(next);
        }}
      />
    </>
  );
}

/** The element's id, renamed only once the new value is valid and free. */
function IdField({
  element,
  blueprint,
  onRename,
}: {
  element: Element;
  blueprint: Blueprint;
  onRename: (id: string) => void;
}) {
  const intl = useIntl();
  const [text, setText] = useState(element.id);
  useEffect(() => setText(element.id), [element.id]);
  const problem = idProblem(blueprint, text, element.id);
  return (
    <TextWidget
      id="certificate-property-id"
      title={intl.formatMessage(messages.id)}
      required
      value={text}
      error={
        problem
          ? [
              intl.formatMessage(
                problem === 'invalid' ? messages.idInvalid : messages.idTaken,
              ),
            ]
          : []
      }
      onChange={(_id, raw) => {
        const next = raw ?? '';
        setText(next);
        if (next !== element.id && !idProblem(blueprint, next, element.id))
          onRename(next);
      }}
    />
  );
}

function TextProperties({
  element,
  fonts,
  fields,
  kinds,
  onChange,
}: {
  element: TextElement;
  fonts: readonly Term[];
  fields: readonly Term[];
  kinds: Readonly<Record<string, string>>;
  onChange: (patch: Partial<TextElement>) => void;
}) {
  const intl = useIntl();
  return (
    <>
      <ContentField
        id="certificate-property-content"
        value={element.content}
        fields={fields}
        kinds={kinds}
        onChange={(content) => onChange({ content })}
      />
      <FontPicker
        id="certificate-property-font"
        value={element.font}
        fonts={fonts}
        onChange={(font) => onChange({ font })}
      />
      <NumberField
        id="certificate-property-size"
        label={intl.formatMessage(messages.size)}
        value={element.size}
        min={1}
        onChange={(size) => size && onChange({ size })}
      />
      <ColorField
        id="certificate-property-color"
        label={intl.formatMessage(messages.color)}
        value={element.color}
        onChange={(color) => onChange({ color })}
      />
      <AnchorField
        id="certificate-property"
        anchor={element.anchor}
        baseline={element.baseline}
        onChange={onChange}
      />
      <NumberField
        id="certificate-property-max-width"
        label={intl.formatMessage(messages.maxWidth)}
        value={element.max_width}
        min={1}
        optional
        onChange={(max_width) => onChange({ max_width })}
      />
      <CheckboxWidget
        id="certificate-property-shrink"
        title={intl.formatMessage(messages.shrink)}
        value={element.fit === 'shrink'}
        isDisabled={element.max_width === undefined}
        onChange={(_id, checked) =>
          onChange({ fit: checked ? 'shrink' : undefined })
        }
      />
    </>
  );
}

function ImageProperties({
  element,
  assets,
  onChange,
}: {
  element: ImageElement;
  assets: readonly AssetOption[];
  onChange: (patch: Partial<ImageElement>) => void;
}) {
  const intl = useIntl();
  const [locked, setLocked] = useState(true);
  const ratio = element.width / element.height;
  // Keep an asset that no longer exists selectable, so it shows as missing.
  const options = assets.some((option) => option.value === element.asset)
    ? assets
    : [
        ...assets,
        {
          value: element.asset,
          label: intl.formatMessage(messages.assetMissing, {
            asset: element.asset,
          }),
        },
      ];
  return (
    <>
      <SelectWidget
        id="certificate-property-asset"
        title={intl.formatMessage(messages.asset)}
        description={
          assets.length < 2
            ? intl.formatMessage(messages.addImagesHint)
            : undefined
        }
        value={element.asset}
        choices={options.map((option) => [option.value, option.label])}
        required
        noValueOption={false}
        onChange={(_id, asset) => asset && onChange({ asset })}
      />
      <NumberField
        id="certificate-property-width"
        label={intl.formatMessage(messages.width)}
        value={element.width}
        min={1}
        onChange={(width) =>
          width &&
          onChange(
            locked
              ? { width, height: Math.max(1, Math.round(width / ratio)) }
              : { width },
          )
        }
      />
      <NumberField
        id="certificate-property-height"
        label={intl.formatMessage(messages.height)}
        value={element.height}
        min={1}
        onChange={(height) =>
          height &&
          onChange(
            locked
              ? { height, width: Math.max(1, Math.round(height * ratio)) }
              : { height },
          )
        }
      />
      <CheckboxWidget
        id="certificate-property-lock"
        title={intl.formatMessage(messages.lockRatio)}
        value={locked}
        onChange={(_id, checked) => setLocked(Boolean(checked))}
      />
    </>
  );
}

function QrProperties({
  element,
  fields,
  kinds,
  errorCorrections,
  onChange,
}: {
  element: QrElement;
  fields: readonly Term[];
  kinds: Readonly<Record<string, string>>;
  errorCorrections: readonly Term[];
  onChange: (patch: Partial<QrElement>) => void;
}) {
  const intl = useIntl();
  const levels = errorCorrections.length
    ? errorCorrections
    : ERROR_CORRECTIONS.map((level) => ({ token: level, title: level }));
  return (
    <>
      <ContentField
        id="certificate-property-content"
        value={element.content}
        fields={fields}
        kinds={kinds}
        onChange={(content) => onChange({ content })}
      />
      <NumberField
        id="certificate-property-size"
        label={intl.formatMessage(messages.size)}
        value={element.size}
        min={1}
        onChange={(size) => size && onChange({ size })}
      />
      <SelectWidget
        id="certificate-property-ec"
        title={intl.formatMessage(messages.errorCorrection)}
        value={element.ec}
        choices={levels.map((level) => [level.token, level.title])}
        required
        noValueOption={false}
        onChange={(_id, ec) => ec && onChange({ ec: ec as ErrorCorrection })}
      />
      <ColorField
        id="certificate-property-fg"
        label={intl.formatMessage(messages.foreground)}
        value={element.fg}
        onChange={(fg) => onChange({ fg })}
      />
      <ColorField
        id="certificate-property-bg"
        label={intl.formatMessage(messages.background)}
        value={element.bg}
        onChange={(bg) => onChange({ bg })}
      />
    </>
  );
}

const TYPE_LABELS = {
  text: messages.typeText,
  image: messages.typeImage,
  qrcode: messages.typeQrcode,
};

/**
 * Edit the selected element; every type has its id and position. The
 * panel is laid out as a Volto block sidebar, with Volto's own widgets.
 */
export default function PropertiesPanel({
  element,
  blueprint,
  fonts,
  fields,
  kinds,
  errorCorrections,
  assets,
  onChange,
  onRename,
}: PropertiesPanelProps) {
  const intl = useIntl();
  return (
    <section
      className="certificate-properties"
      aria-labelledby="certificate-properties-title"
    >
      <div className="ui form">
        <header className="header pulled">
          <h2 id="certificate-properties-title">
            {intl.formatMessage(messages.properties)}
            {element && ` — ${intl.formatMessage(TYPE_LABELS[element.type])}`}
          </h2>
        </header>
        {!element ? (
          <Segment className="attached">
            <p>{intl.formatMessage(messages.selectElement)}</p>
          </Segment>
        ) : (
          <Segment className="form attached">
            <IdField
              element={element}
              blueprint={blueprint}
              onRename={onRename}
            />
            <NumberField
              id="certificate-property-x"
              label={intl.formatMessage(messages.x)}
              value={element.x}
              min={0}
              onChange={(x) => x !== undefined && onChange({ x })}
            />
            <NumberField
              id="certificate-property-y"
              label={intl.formatMessage(messages.y)}
              value={element.y}
              min={0}
              onChange={(y) => y !== undefined && onChange({ y })}
            />
            {element.type === 'text' && (
              <TextProperties
                element={element}
                fonts={fonts}
                fields={fields}
                kinds={kinds}
                onChange={onChange as (patch: Partial<TextElement>) => void}
              />
            )}
            {element.type === 'image' && (
              <ImageProperties
                element={element}
                assets={assets}
                onChange={onChange as (patch: Partial<ImageElement>) => void}
              />
            )}
            {element.type === 'qrcode' && (
              <QrProperties
                element={element}
                fields={fields}
                kinds={kinds}
                errorCorrections={errorCorrections}
                onChange={onChange as (patch: Partial<QrElement>) => void}
              />
            )}
          </Segment>
        )}
      </div>
    </section>
  );
}
