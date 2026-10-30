/** Designer commands bound to keys. */
export type Command =
  | { type: 'delete' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'duplicate' }
  | { type: 'zoomIn' }
  | { type: 'zoomOut' }
  | { type: 'nudge'; dx: number; dy: number }
  | { type: 'cancel' };

/** The subset of a keyboard event the bindings read. */
export interface KeyInput {
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/**
 * Map a key press to a designer command.
 *
 * @param event The key press.
 * @param nudgeStep Page pixels moved by an arrow; shift moves ten times as far.
 * @returns The command, or `null` for keys the designer ignores.
 */
export function commandFor(event: KeyInput, nudgeStep = 1): Command | null {
  const mod = event.ctrlKey || event.metaKey;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (mod && key === 'z') return { type: event.shiftKey ? 'redo' : 'undo' };
  if (mod && key === 'd') return { type: 'duplicate' };
  if (mod) return null;
  if (key === 'Delete' || key === 'Backspace') return { type: 'delete' };
  if (key === 'Escape') return { type: 'cancel' };
  if (key === '+' || key === '=') return { type: 'zoomIn' };
  if (key === '-') return { type: 'zoomOut' };
  if (key in ARROWS) {
    const step = event.shiftKey ? nudgeStep * 10 : nudgeStep;
    const [dx, dy] = ARROWS[key];
    return { type: 'nudge', dx: dx * step, dy: dy * step };
  }
  return null;
}

/** Whether a key press comes from a control where typing must not be hijacked. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  );
}
