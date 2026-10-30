import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { canvasMeasure, shrinkSize } from '../../blueprint/metrics';
import { nominalSize } from '../../blueprint/svg';
import { BACKGROUND_ASSET } from '../../blueprint/model';
import { validate } from '../../blueprint/validate';
import { DEFAULT_DESIGNER } from '../../config/settings';
import { naturalSize } from '../../helpers/image';
import { commandFor, isTypingTarget } from '../../helpers/keyboard';
import useDesigner, { nextZoom } from '../../hooks/useDesigner';
import useFontFaces from '../../hooks/useFontFaces';
import messages from '../../messages';
import ElementsList from './ElementsList/ElementsList';
import MoveableLayer from './MoveableLayer/MoveableLayer';
import PreviewPane from './PreviewPane/PreviewPane';
import PropertiesPanel from './PropertiesPanel/PropertiesPanel';
import Stage from './Stage/Stage';
import Toolbar from './Toolbar/Toolbar';
import type {
  Blueprint,
  FieldData,
  ValidationIssue,
} from '../../blueprint/model';
import type { DesignerSettings } from '../../config/settings';
import type { ImageSource, TemplateImage } from '../../helpers/image';
import type { Guides } from '../../helpers/snapping';
import type { ServerIssue, Term } from '../../reducers/certificates';

import './Designer.scss';

export interface DesignerProps {
  blueprint: Blueprint;
  /** The saved template's URL, for the server preview; `null` when adding. */
  templateUrl: string | null;
  /** The background, and the Image items inside the template. */
  assets: { background: ImageSource | null; images: readonly TemplateImage[] };
  fonts: readonly Term[];
  fields: readonly Term[];
  fieldKinds: Readonly<Record<string, string>>;
  errorCorrections: readonly Term[];
  /** Values the stage draws placeholders with. */
  data: FieldData;
  dateFormat?: string;
  months?: readonly string[];
  settings?: DesignerSettings;
  /** Problems the server found in the last applied blueprint. */
  serverErrors?: readonly ServerIssue[];
  applying?: boolean;
  onApply: (blueprint: Blueprint) => void;
  onCancel: () => void;
}

/** The full-screen editor of a template's blueprint. */
export default function Designer({
  blueprint: initial,
  templateUrl,
  assets,
  fonts,
  fields,
  fieldKinds,
  errorCorrections,
  data,
  dateFormat,
  months,
  settings = DEFAULT_DESIGNER,
  serverErrors = [],
  applying = false,
  onApply,
  onCancel,
}: DesignerProps) {
  const intl = useIntl();
  const { zoomSteps, nudgeStep, snapTolerance } = settings;
  const { state, dispatch, blueprint, selected, canUndo, canRedo, dirty } =
    useDesigner(initial, zoomSteps[Math.floor(zoomSteps.length / 2)] ?? 0.25);
  const [showSample, setShowSample] = useState(true);
  const [guides, setGuides] = useState<Guides | null>(null);
  const tokens = useMemo(() => fonts.map((font) => font.token), [fonts]);
  const fontsReady = useFontFaces(tokens);
  const size = useMemo(() => {
    const measure = fontsReady ? canvasMeasure() : null;
    return measure ? shrinkSize(measure) : nominalSize;
  }, [fontsReady]);

  const [backgroundSize, setBackgroundSize] = useState<[number, number] | null>(
    null,
  );
  const background = assets.background;
  useEffect(() => {
    if (!background) return setBackgroundSize(null);
    if (background.width && background.height)
      return setBackgroundSize([background.width, background.height]);
    let active = true;
    naturalSize(background.url)
      .then((natural) => active && setBackgroundSize(natural))
      .catch(() => active && setBackgroundSize(null));
    return () => {
      active = false;
    };
  }, [background]);

  const urls = useMemo(() => {
    const found: Record<string, string> = {};
    for (const image of assets.images) found[image.id] = image.url;
    if (assets.background) found[BACKGROUND_ASSET] = assets.background.url;
    return found;
  }, [assets]);

  const assetOptions = useMemo(
    () => [
      {
        value: BACKGROUND_ASSET,
        label: intl.formatMessage(messages.assetBackground),
      },
      ...assets.images
        .filter((image) => image.id !== BACKGROUND_ASSET)
        .map((image) => ({ value: image.id, label: image.title })),
    ],
    [assets.images, intl],
  );

  const issues: ValidationIssue[] = useMemo(
    () =>
      validate(blueprint, {
        fonts: new Set(tokens),
        fieldKinds,
        background: backgroundSize,
        assets: new Set(Object.keys(urls)),
      }),
    [blueprint, tokens, fieldKinds, backgroundSize, urls],
  );
  const mismatch =
    backgroundSize &&
    (backgroundSize[0] !== blueprint.page.width ||
      backgroundSize[1] !== blueprint.page.height);

  const cancel = useCallback(() => {
    // A blocking question is what discarding unsaved work calls for.
    // eslint-disable-next-line no-alert
    if (!dirty || window.confirm(intl.formatMessage(messages.confirmDiscard)))
      onCancel();
  }, [dirty, intl, onCancel]);

  const zoom = useCallback(
    (direction: 1 | -1) =>
      dispatch({
        type: 'zoom',
        zoom: nextZoom(zoomSteps, state.zoom, direction),
      }),
    [dispatch, zoomSteps, state.zoom],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const command = commandFor(event, nudgeStep);
      if (!command) return;
      const id = state.selection;
      switch (command.type) {
        case 'cancel':
          cancel();
          break;
        case 'undo':
        case 'redo':
          dispatch({ type: command.type });
          break;
        case 'zoomIn':
          zoom(1);
          break;
        case 'zoomOut':
          zoom(-1);
          break;
        case 'delete':
          if (id) dispatch({ type: 'remove', id });
          break;
        case 'duplicate':
          if (id) dispatch({ type: 'duplicate', id });
          break;
        default:
          if (id)
            dispatch({ type: 'nudge', id, dx: command.dx, dy: command.dy });
      }
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cancel, dispatch, nudgeStep, state.selection, zoom]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const problemCount = issues.length + serverErrors.length;
  return (
    <div
      className="certificate-designer"
      role="dialog"
      aria-modal="true"
      aria-label={intl.formatMessage(messages.designer)}
    >
      <Toolbar
        hasSelection={selected !== null}
        canUndo={canUndo}
        canRedo={canRedo}
        canZoomIn={state.zoom < zoomSteps[zoomSteps.length - 1]}
        canZoomOut={state.zoom > zoomSteps[0]}
        zoom={state.zoom}
        showSample={showSample}
        applying={applying}
        onAdd={(elementType) =>
          dispatch({
            type: 'add',
            elementType,
            font: tokens[0],
            asset: assets.images[0]?.id ?? BACKGROUND_ASSET,
          })
        }
        onUndo={() => dispatch({ type: 'undo' })}
        onRedo={() => dispatch({ type: 'redo' })}
        onDuplicate={() =>
          selected && dispatch({ type: 'duplicate', id: selected.id })
        }
        onDelete={() =>
          selected && dispatch({ type: 'remove', id: selected.id })
        }
        onZoom={zoom}
        onToggleSample={setShowSample}
        onApply={() => onApply(blueprint)}
        onCancel={cancel}
      />
      <p className="certificate-announce" aria-live="polite">
        {selected
          ? intl.formatMessage(messages.selected, { id: selected.id })
          : intl.formatMessage(messages.nothingSelected)}
      </p>
      {mismatch && backgroundSize && (
        <div className="certificate-banner" role="status">
          {intl.formatMessage(messages.pageMismatch, {
            pageWidth: blueprint.page.width,
            pageHeight: blueprint.page.height,
            width: backgroundSize[0],
            height: backgroundSize[1],
          })}{' '}
          <button
            type="button"
            onClick={() =>
              dispatch({
                type: 'fitPage',
                width: backgroundSize[0],
                height: backgroundSize[1],
              })
            }
          >
            {intl.formatMessage(messages.fitPage)}
          </button>
        </div>
      )}
      <div className="certificate-designer-body">
        <ElementsList
          elements={blueprint.elements}
          selection={state.selection}
          onSelect={(id) => dispatch({ type: 'select', id })}
          onReorder={(id, step) => dispatch({ type: 'reorder', id, step })}
        />
        <main className="certificate-designer-main">
          <Stage
            blueprint={blueprint}
            assets={urls}
            data={data}
            showSample={showSample}
            dateFormat={dateFormat}
            months={months}
            size={size}
            zoom={state.zoom}
            selection={state.selection}
            guides={guides}
            onSelect={(id) => dispatch({ type: 'select', id })}
            renderSelection={(element, box) => (
              <MoveableLayer
                key={element.id}
                element={element}
                box={box}
                zoom={state.zoom}
                blueprint={blueprint}
                snapTolerance={snapTolerance}
                onMove={(x, y) =>
                  dispatch({ type: 'move', id: element.id, x, y })
                }
                onResize={(patch) =>
                  dispatch({ type: 'update', id: element.id, patch })
                }
                onGuides={setGuides}
              />
            )}
          />
          {problemCount > 0 && (
            <section className="certificate-problems" role="alert">
              <h3>
                {intl.formatMessage(messages.problems, { count: problemCount })}
              </h3>
              <ul>
                {issues.map((issue) => (
                  <li key={`local${issue.path}${issue.code}`}>
                    {intl.formatMessage(
                      messages[issue.code as keyof typeof messages] ??
                        messages.error_schema,
                      issue.values,
                    )}
                  </li>
                ))}
                {serverErrors.map((issue) => (
                  <li key={`server${issue.path}${issue.message}`}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
        <aside className="certificate-designer-side">
          <PropertiesPanel
            element={selected}
            blueprint={blueprint}
            fonts={fonts}
            fields={fields}
            kinds={fieldKinds}
            errorCorrections={errorCorrections}
            assets={assetOptions}
            onChange={(patch) =>
              selected && dispatch({ type: 'update', id: selected.id, patch })
            }
            onRename={(newId) =>
              selected && dispatch({ type: 'rename', id: selected.id, newId })
            }
          />
          <PreviewPane templateUrl={templateUrl} />
        </aside>
      </div>
    </div>
  );
}
