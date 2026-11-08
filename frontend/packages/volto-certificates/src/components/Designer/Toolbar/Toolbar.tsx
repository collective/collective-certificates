import { useIntl } from 'react-intl';
import clearSVG from '@plone/volto/icons/clear.svg';
import copySVG from '@plone/volto/icons/copy.svg';
import deleteSVG from '@plone/volto/icons/delete.svg';
import hideSVG from '@plone/volto/icons/hide.svg';
import imageSVG from '@plone/volto/icons/image.svg';
import redoSVG from '@plone/volto/icons/redo.svg';
import saveSVG from '@plone/volto/icons/save.svg';
import showSVG from '@plone/volto/icons/show.svg';
import textSVG from '@plone/volto/icons/text.svg';
import undoSVG from '@plone/volto/icons/undo.svg';
import zoomInSVG from '@plone/volto/icons/zoom-in.svg';
import zoomOutSVG from '@plone/volto/icons/zoom-out.svg';
import { Icon } from '../../../helpers/widgets';
import qrcodeSVG from '../../../icons/qrcode.svg';
import messages from '../../../messages';
import type { ElementType } from '../../../blueprint/model';

export interface ToolbarProps {
  hasSelection: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
  zoom: number;
  showSample: boolean;
  applying: boolean;
  onAdd: (type: ElementType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onZoom: (direction: 1 | -1) => void;
  onToggleSample: (show: boolean) => void;
  onApply: () => void;
  onCancel: () => void;
}

interface ToolProps {
  label: string;
  icon: unknown;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  className?: string;
}

/** An icon button; its label is its accessible name and its tooltip. */
function Tool({
  label,
  icon,
  onClick,
  disabled = false,
  pressed,
  className,
}: ToolProps) {
  return (
    <button
      type="button"
      className={['certificate-tool', className].filter(Boolean).join(' ')}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name={icon} size="24px" ariaHidden />
    </button>
  );
}

/** Adding, editing, zoom and the apply/cancel pair, as icon buttons. */
export default function Toolbar(props: ToolbarProps) {
  const intl = useIntl();
  const t = (key: keyof typeof messages) => intl.formatMessage(messages[key]);
  return (
    <div
      className="certificate-toolbar"
      role="toolbar"
      aria-label={t('designer')}
    >
      <div className="certificate-toolbar-group">
        <Tool
          label={t('addText')}
          icon={textSVG}
          onClick={() => props.onAdd('text')}
        />
        <Tool
          label={t('addImage')}
          icon={imageSVG}
          onClick={() => props.onAdd('image')}
        />
        <Tool
          label={t('addQr')}
          icon={qrcodeSVG}
          onClick={() => props.onAdd('qrcode')}
        />
      </div>
      <div className="certificate-toolbar-group">
        <Tool
          label={t('undo')}
          icon={undoSVG}
          onClick={props.onUndo}
          disabled={!props.canUndo}
        />
        <Tool
          label={t('redo')}
          icon={redoSVG}
          onClick={props.onRedo}
          disabled={!props.canRedo}
        />
        <Tool
          label={t('duplicate')}
          icon={copySVG}
          onClick={props.onDuplicate}
          disabled={!props.hasSelection}
        />
        <Tool
          label={t('delete')}
          icon={deleteSVG}
          onClick={props.onDelete}
          disabled={!props.hasSelection}
        />
      </div>
      <div className="certificate-toolbar-group">
        <Tool
          label={t('zoomOut')}
          icon={zoomOutSVG}
          onClick={() => props.onZoom(-1)}
          disabled={!props.canZoomOut}
        />
        <span className="certificate-zoom" aria-live="polite">
          {intl.formatMessage(messages.zoomLevel, {
            percent: Math.round(props.zoom * 100),
          })}
        </span>
        <Tool
          label={t('zoomIn')}
          icon={zoomInSVG}
          onClick={() => props.onZoom(1)}
          disabled={!props.canZoomIn}
        />
        <Tool
          label={t('showSample')}
          icon={props.showSample ? showSVG : hideSVG}
          pressed={props.showSample}
          onClick={() => props.onToggleSample(!props.showSample)}
        />
      </div>
      <div className="certificate-toolbar-group certificate-toolbar-end">
        <Tool label={t('cancel')} icon={clearSVG} onClick={props.onCancel} />
        <Tool
          label={t(props.applying ? 'applying' : 'apply')}
          icon={saveSVG}
          onClick={props.onApply}
          disabled={props.applying}
          className="primary"
        />
      </div>
    </div>
  );
}
