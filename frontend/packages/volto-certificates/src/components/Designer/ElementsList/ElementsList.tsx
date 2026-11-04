import type { CSSProperties, ReactNode, Ref } from 'react';
import { useIntl } from 'react-intl';
import dragSVG from '@plone/volto/icons/drag.svg';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';
import { Icon } from '../../../helpers/widgets';
import messages from '../../../messages';
import type { Element } from '../../../blueprint/model';

export interface ElementsListProps {
  elements: readonly Element[];
  selection: string | null;
  onSelect: (id: string) => void;
  /** Move `id` to the place of `target`, as a dragged item lands. */
  onReorder: (id: string, target: string) => void;
}

/** The lazy libraries the items drag with, as `config.settings.loadables` names them. */
export const DND_LIBRARIES = [
  'dndKitCore',
  'dndKitSortable',
  'dndKitUtilities',
];

const TYPE_LABELS = {
  text: messages.typeText,
  image: messages.typeImage,
  qrcode: messages.typeQrcode,
};

/** The loaded libraries, keyed as `config.settings.loadables` names them. */
type Libraries = Record<string, any>;

type ItemProps = {
  element: Element;
  selected: boolean;
  onSelect: (id: string) => void;
};

/** One element: its drag handle and the button that selects it. */
function Item({
  element,
  selected,
  onSelect,
  handle,
  itemRef,
  style,
  dragging = false,
}: ItemProps & {
  handle: ReactNode;
  itemRef: Ref<HTMLLIElement>;
  style: CSSProperties;
  dragging?: boolean;
}) {
  const intl = useIntl();
  const classes = [selected && 'selected', dragging && 'dragging']
    .filter(Boolean)
    .join(' ');
  return (
    <li
      ref={itemRef}
      style={style}
      data-element={element.id}
      className={classes || undefined}
    >
      {handle}
      <button
        type="button"
        className="certificate-element-select"
        aria-pressed={selected}
        onClick={() => onSelect(element.id)}
      >
        <span className="certificate-element-type">
          {intl.formatMessage(TYPE_LABELS[element.type])}
        </span>{' '}
        {element.id}
      </button>
    </li>
  );
}

/** An element that drags by its handle. */
function SortableItem({
  libraries,
  ...props
}: ItemProps & { libraries: Libraries }) {
  const intl = useIntl();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = libraries.dndKitSortable.useSortable({ id: props.element.id });
  const label = intl.formatMessage(messages.moveElement, {
    id: props.element.id,
  });
  return (
    <Item
      {...props}
      itemRef={setNodeRef}
      // Translate rather than Transform: an item stretched to the height of
      // the one it passes over reads as a glitch.
      style={{
        transform: libraries.dndKitUtilities.CSS.Translate.toString(transform),
        transition,
      }}
      dragging={isDragging}
      handle={
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="certificate-element-handle"
          aria-label={label}
          title={label}
        >
          <Icon name={dragSVG} size="18px" ariaHidden />
        </button>
      }
    />
  );
}

/** The sortable list, rendered once Volto has loaded the drag library. */
function SortableListBase({
  elements,
  selection,
  onSelect,
  onReorder,
  ...libraries
}: ElementsListProps & Libraries) {
  const {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
  } = libraries.dndKitCore;
  const {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
  } = libraries.dndKitSortable;
  const sensors = useSensors(
    // A few pixels before a drag starts, so a click on the handle stays one.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const ids = elements.map((element) => element.id);
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }: { active: any; over: any }) => {
        // A drop outside the list, or where it started, changes nothing.
        if (over && active.id !== over.id)
          onReorder(String(active.id), String(over.id));
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol>
          {elements.map((element) => (
            <SortableItem
              key={element.id}
              libraries={libraries}
              element={element}
              selected={element.id === selection}
              onSelect={onSelect}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

const SortableList = injectLazyLibs(DND_LIBRARIES)(SortableListBase) as (
  props: ElementsListProps,
) => ReactNode;

/**
 * The elements in drawing order, last on top. Selecting one here is the
 * keyboard way to reach it; dragging a handle, by pointer or with the
 * keyboard (Space, the arrows, Space), changes the order.
 */
export default function ElementsList(props: ElementsListProps) {
  const intl = useIntl();
  return (
    <nav
      className="certificate-elements"
      aria-labelledby="certificate-elements-title"
    >
      <h3 id="certificate-elements-title">
        {intl.formatMessage(messages.elements)}
      </h3>
      {props.elements.length === 0 ? (
        <p>{intl.formatMessage(messages.noElements)}</p>
      ) : (
        <>
          <p className="certificate-elements-hint">
            {intl.formatMessage(messages.elementsOrder)}
          </p>
          <SortableList {...props} />
        </>
      )}
    </nav>
  );
}
