import { useIntl } from 'react-intl';
import messages from '../../../messages';
import type { Element } from '../../../blueprint/model';

export interface ElementsListProps {
  elements: readonly Element[];
  selection: string | null;
  onSelect: (id: string) => void;
  onReorder: (id: string, step: -1 | 1) => void;
}

const TYPE_LABELS = {
  text: messages.typeText,
  image: messages.typeImage,
  qrcode: messages.typeQrcode,
};

/**
 * The elements in drawing order, last on top; the keyboard way to select
 * and reorder them.
 */
export default function ElementsList({
  elements,
  selection,
  onSelect,
  onReorder,
}: ElementsListProps) {
  const intl = useIntl();
  return (
    <nav
      className="certificate-elements"
      aria-labelledby="certificate-elements-title"
    >
      <h3 id="certificate-elements-title">
        {intl.formatMessage(messages.elements)}
      </h3>
      {elements.length === 0 ? (
        <p>{intl.formatMessage(messages.noElements)}</p>
      ) : (
        <ol>
          {elements.map((element, index) => (
            <li
              key={element.id}
              className={element.id === selection ? 'selected' : undefined}
            >
              <button
                type="button"
                className="certificate-element-select"
                aria-pressed={element.id === selection}
                onClick={() => onSelect(element.id)}
              >
                <span className="certificate-element-type">
                  {intl.formatMessage(TYPE_LABELS[element.type])}
                </span>{' '}
                {element.id}
              </button>
              <button
                type="button"
                aria-label={intl.formatMessage(messages.moveBack, {
                  id: element.id,
                })}
                disabled={index === 0}
                onClick={() => onReorder(element.id, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={intl.formatMessage(messages.moveForward, {
                  id: element.id,
                })}
                disabled={index === elements.length - 1}
                onClick={() => onReorder(element.id, 1)}
              >
                ↓
              </button>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
