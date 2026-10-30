import { render } from '@testing-library/react';
import type { ComponentType, ReactElement, ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
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
  return {
    getState: () => state,
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
