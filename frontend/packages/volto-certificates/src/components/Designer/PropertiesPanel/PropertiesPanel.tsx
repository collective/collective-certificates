import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { ERROR_CORRECTIONS } from '../../../blueprint/model';
import { idProblem } from '../../../blueprint/ops';
import { insertAt } from '../../../helpers/text';
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

/** An integer input; empty clears an optional value. */
function NumberField({
  id,
  label,
  value,
  min,
  onChange,
  optional = false,
}: NumberFieldProps) {
  return (
    <div className="certificate-number-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        step={1}
        min={min}
        value={value ?? ''}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === '') {
            if (optional) onChange(undefined);
            return;
          }
          const parsed = Math.round(Number(raw));
          if (Number.isFinite(parsed) && parsed >= min) onChange(parsed);
        }}
      />
    </div>
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
    <div className="certificate-content-field">
      <label htmlFor={id}>{intl.formatMessage(messages.content)}</label>
      <textarea
        id={id}
        ref={ref}
        rows={3}
        maxLength={500}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
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
    </div>
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
  const inputId = `certificate-property-id`;
  return (
    <div className="certificate-id-field">
      <label htmlFor={inputId}>{intl.formatMessage(messages.id)}</label>
      <input
        id={inputId}
        type="text"
        value={text}
        maxLength={32}
        aria-invalid={problem ? 'true' : undefined}
        aria-describedby={problem ? `${inputId}-error` : undefined}
        onChange={(event) => {
          setText(event.target.value);
          if (
            event.target.value !== element.id &&
            !idProblem(blueprint, event.target.value, element.id)
          )
            onRename(event.target.value);
        }}
      />
      {problem && (
        <p id={`${inputId}-error`} className="certificate-field-error">
          {intl.formatMessage(
            problem === 'invalid' ? messages.idInvalid : messages.idTaken,
          )}
        </p>
      )}
    </div>
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
      <label className="certificate-checkbox">
        <input
          type="checkbox"
          checked={element.fit === 'shrink'}
          disabled={element.max_width === undefined}
          onChange={(event) =>
            onChange({ fit: event.target.checked ? 'shrink' : undefined })
          }
        />
        {intl.formatMessage(messages.shrink)}
      </label>
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
      <label htmlFor="certificate-property-asset">
        {intl.formatMessage(messages.asset)}
      </label>
      <select
        id="certificate-property-asset"
        value={element.asset}
        onChange={(event) => onChange({ asset: event.target.value })}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {assets.length < 2 && (
        <p className="certificate-property-hint">
          {intl.formatMessage(messages.addImagesHint)}
        </p>
      )}
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
      <label className="certificate-checkbox">
        <input
          type="checkbox"
          checked={locked}
          onChange={(event) => setLocked(event.target.checked)}
        />
        {intl.formatMessage(messages.lockRatio)}
      </label>
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
      <label htmlFor="certificate-property-ec">
        {intl.formatMessage(messages.errorCorrection)}
      </label>
      <select
        id="certificate-property-ec"
        value={element.ec}
        onChange={(event) =>
          onChange({ ec: event.target.value as ErrorCorrection })
        }
      >
        {levels.map((level) => (
          <option key={level.token} value={level.token}>
            {level.title}
          </option>
        ))}
      </select>
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

/** Edit the selected element; every type has its id and position. */
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
      <h3 id="certificate-properties-title">
        {intl.formatMessage(messages.properties)}
        {element && ` — ${intl.formatMessage(TYPE_LABELS[element.type])}`}
      </h3>
      {!element ? (
        <p>{intl.formatMessage(messages.selectElement)}</p>
      ) : (
        <form onSubmit={(event) => event.preventDefault()}>
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
        </form>
      )}
    </section>
  );
}
