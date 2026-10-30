import { useIntl } from 'react-intl';
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

/** Adding, editing, zoom and the apply/cancel pair. */
export default function Toolbar(props: ToolbarProps) {
  const intl = useIntl();
  const button = (
    label: keyof typeof messages,
    onClick: () => void,
    disabled = false,
    className?: string,
  ) => (
    <button
      type="button"
      className={className}
      disabled={disabled}
      onClick={onClick}
    >
      {intl.formatMessage(messages[label])}
    </button>
  );
  return (
    <div
      className="certificate-toolbar"
      role="toolbar"
      aria-label={intl.formatMessage(messages.designer)}
    >
      <div className="certificate-toolbar-group">
        {button('addText', () => props.onAdd('text'))}
        {button('addImage', () => props.onAdd('image'))}
        {button('addQr', () => props.onAdd('qrcode'))}
      </div>
      <div className="certificate-toolbar-group">
        {button('undo', props.onUndo, !props.canUndo)}
        {button('redo', props.onRedo, !props.canRedo)}
        {button('duplicate', props.onDuplicate, !props.hasSelection)}
        {button('delete', props.onDelete, !props.hasSelection)}
      </div>
      <div className="certificate-toolbar-group">
        {button('zoomOut', () => props.onZoom(-1), !props.canZoomOut)}
        <span className="certificate-zoom" aria-live="polite">
          {intl.formatMessage(messages.zoomLevel, {
            percent: Math.round(props.zoom * 100),
          })}
        </span>
        {button('zoomIn', () => props.onZoom(1), !props.canZoomIn)}
        <label className="certificate-checkbox">
          <input
            type="checkbox"
            checked={props.showSample}
            onChange={(event) => props.onToggleSample(event.target.checked)}
          />
          {intl.formatMessage(messages.showSample)}
        </label>
      </div>
      <div className="certificate-toolbar-group certificate-toolbar-end">
        {button('cancel', props.onCancel)}
        <button
          type="button"
          className="primary"
          disabled={props.applying}
          onClick={props.onApply}
        >
          {intl.formatMessage(
            props.applying ? messages.applying : messages.apply,
          )}
        </button>
      </div>
    </div>
  );
}
