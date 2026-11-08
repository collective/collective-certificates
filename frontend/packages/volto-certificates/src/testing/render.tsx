import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentType, ReactElement, ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { expect } from 'vitest';
import { initialState } from '../reducers/certificates';
import type { CertificatesState, Term } from '../reducers/certificates';
import { FIELD_KINDS } from './fixtures';

// react-intl 3 types predate React 18's explicit `children`.
const Intl = IntlProvider as unknown as ComponentType<{
  locale: string;
  messages: Record<string, string>;
  onError: () => void;
  children: ReactNode;
}>;

export const FONTS: Term[] = [
  { token: 'inter', title: 'Inter' },
  { token: 'eb-garamond', title: 'EB Garamond' },
  { token: 'caveat', title: 'Caveat' },
];

export const FIELDS: Term[] = Object.keys(FIELD_KINDS).map((token) => ({
  token,
  title: token.replace(/_/g, ' '),
}));

export const LEVELS: Term[] = ['L', 'M', 'Q', 'H'].map((token) => ({
  token,
  title: `Level ${token}`,
}));

/** The certificates slice with the vocabularies loaded. */
export const LOADED: CertificatesState = {
  ...initialState,
  fonts: FONTS,
  fields: FIELDS,
  fieldKinds: FIELD_KINDS,
  errorCorrections: LEVELS,
  vocabularies: { loading: false, loaded: true, error: null },
};

const INTL = { locale: 'en', messages: {} };

/**
 * Load the lazy libraries of Volto's widgets, react-select among them.
 * A test file that renders a select also mocks the loader:
 * `vi.mock('@plone/volto/helpers/Loadable/Loadable')`.
 */
export async function loadSelect(): Promise<void> {
  const { __setLoadables } = (await import(
    '@plone/volto/helpers/Loadable/Loadable'
  )) as unknown as { __setLoadables: () => Promise<void> };
  await __setLoadables();
}

/** The input of the select widget whose title is `label`. */
export const selectInput = (label: string): HTMLInputElement =>
  screen.getByLabelText(label, { selector: 'input' });

/** Open the menu of a select widget and return its options. */
export async function openMenu(label: string): Promise<HTMLElement[]> {
  const input = selectInput(label);
  input.focus();
  fireEvent.keyDown(input, { key: 'ArrowDown', keyCode: 40 });
  await waitFor(() =>
    expect(document.querySelector('.react-select__option')).not.toBeNull(),
  );
  return Array.from(
    document.querySelectorAll<HTMLElement>('.react-select__option'),
  );
}

/** Choose the option labelled `option` in a select widget. */
export async function choose(label: string, option: string): Promise<void> {
  const options = await openMenu(label);
  const target = options.find((element) => element.textContent === option);
  if (!target) throw new Error(`No option "${option}" in "${label}"`);
  fireEvent.click(target);
}

export interface FakeStore {
  getState: () => Record<string, unknown>;
  subscribe: () => () => void;
  dispatch: (action: { type: string }) => unknown;
  actions: { type: string }[];
}

/**
 * A store that records actions; `answer` plays the api middleware,
 * returning what `dispatch` resolves to for an action.
 */
export function fakeStore(
  state: Record<string, unknown> = { certificates: LOADED },
  answer: (action: { type: string }) => unknown = () => undefined,
): FakeStore {
  const actions: { type: string }[] = [];
  // Volto's widgets read the locale from the store.
  const full = { intl: INTL, ...state };
  return {
    getState: () => full,
    subscribe: () => () => {},
    dispatch: (action) => {
      actions.push(action);
      return answer(action);
    },
    actions,
  };
}

/**
 * Render with react-intl (English defaults), a fake store and a memory
 * router, as links inside the app need one; `rerender` keeps them.
 */
export function renderWith(ui: ReactElement, store: FakeStore = fakeStore()) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store as never}>
      <Intl locale="en" messages={{}} onError={() => {}}>
        <MemoryRouter>{children}</MemoryRouter>
      </Intl>
    </Provider>
  );
  return { ...render(ui, { wrapper }), store };
}
