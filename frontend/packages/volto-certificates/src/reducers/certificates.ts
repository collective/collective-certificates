import {
  CREATE_CERTIFICATES,
  GET_CERTIFICATE_VERIFICATION,
  GET_CERTIFICATE_VOCABULARIES,
  VALIDATE_BLUEPRINT,
} from '../actions/certificates';

/** A vocabulary term as `@vocabularies` returns it. */
export interface Term {
  token: string;
  title: string;
}

/** An issue as `@validate-blueprint` returns it, message translated. */
export interface ServerIssue {
  element: string | null;
  path: string;
  message: string;
}

/** A field of an issued certificate, as `@certificate-verification` gives it. */
export interface VerificationField {
  token: string;
  title: string;
  /** `text`, `date` or `computed`. */
  kind: string;
  value: string;
}

/** The public details of an issued certificate. */
export interface CertificateVerification {
  uid: string;
  title: string;
  issued: string;
  data: Record<string, unknown>;
  fields: VerificationField[];
  template: { uid: string; title: string } | null;
  file: {
    download: string;
    filename: string;
    'content-type': string;
    size: number;
  } | null;
}

/**
 * A problem in a CSV file, as `@create-certificates` returns it in a 400.
 * `row` is the line in the file (the header is 1, 0 is the whole file);
 * the blueprint errors of `@validate-blueprint` have no row.
 */
export interface BatchIssue {
  row?: number;
  column?: string | null;
  element?: string | null;
  path?: string;
  message: string;
}

/** A certificate created by `@create-certificates`, as a summary. */
export interface BatchItem {
  '@id': string;
  '@type'?: string;
  title: string;
}

export interface CertificatesState {
  fonts: Term[];
  fields: Term[];
  /** Kind of each field token: `text`, `date` or `computed`. */
  fieldKinds: Record<string, string>;
  errorCorrections: Term[];
  vocabularies: { loading: boolean; loaded: boolean; error: unknown };
  validation: {
    loading: boolean;
    valid: boolean | null;
    errors: ServerIssue[];
    error: unknown;
  };
  /** The last certificate the verification page asked for. */
  verification: {
    loading: boolean;
    loaded: boolean;
    error: unknown;
    result: CertificateVerification | null;
  };
  /** The last CSV upload: the certificates created, or why none were. */
  batch: {
    loading: boolean;
    result: { items: BatchItem[]; items_total: number } | null;
    errors: BatchIssue[];
    error: unknown;
  };
}

export const initialState: CertificatesState = {
  fonts: [],
  fields: [],
  fieldKinds: {},
  errorCorrections: [],
  vocabularies: { loading: false, loaded: false, error: null },
  validation: { loading: false, valid: null, errors: [], error: null },
  verification: { loading: false, loaded: false, error: null, result: null },
  batch: { loading: false, result: null, errors: [], error: null },
};

interface VocabularyResult {
  items?: Term[];
}

type Action =
  | { type: `${typeof GET_CERTIFICATE_VOCABULARIES}_PENDING` }
  | {
      type: `${typeof GET_CERTIFICATE_VOCABULARIES}_SUCCESS`;
      result: VocabularyResult[];
    }
  | { type: `${typeof GET_CERTIFICATE_VOCABULARIES}_FAIL`; error: unknown }
  | { type: `${typeof VALIDATE_BLUEPRINT}_PENDING` }
  | {
      type: `${typeof VALIDATE_BLUEPRINT}_SUCCESS`;
      result: { valid: boolean; errors: ServerIssue[] };
    }
  | { type: `${typeof VALIDATE_BLUEPRINT}_FAIL`; error: unknown }
  | { type: `${typeof GET_CERTIFICATE_VERIFICATION}_PENDING` }
  | {
      type: `${typeof GET_CERTIFICATE_VERIFICATION}_SUCCESS`;
      result: CertificateVerification;
    }
  | { type: `${typeof GET_CERTIFICATE_VERIFICATION}_FAIL`; error: unknown }
  | { type: `${typeof CREATE_CERTIFICATES}_PENDING` }
  | {
      type: `${typeof CREATE_CERTIFICATES}_SUCCESS`;
      result: { items: BatchItem[]; items_total: number };
    }
  | { type: `${typeof CREATE_CERTIFICATES}_FAIL`; error: unknown }
  | { type: string };

const items = (result: VocabularyResult | undefined): Term[] =>
  (result?.items ?? []).map(({ token, title }) => ({ token, title }));

/**
 * The problems a failed upload carries. Volto's api middleware passes the
 * request error as `error.response.body`, and a 400 from
 * `@create-certificates` puts its list in `body.error.errors`.
 *
 * @param error The `_FAIL` action's error.
 * @returns The issues, or an empty list when the body has none.
 */
export function batchIssues(error: unknown): BatchIssue[] {
  const body = (
    error as { response?: { body?: { error?: { errors?: unknown } } } }
  )?.response?.body;
  const errors = body?.error?.errors;
  return Array.isArray(errors) ? (errors as BatchIssue[]) : [];
}

/** The `certificates` slice: vocabularies and the last validation. */
export default function certificates(
  state: CertificatesState = initialState,
  action: Action = { type: '' },
): CertificatesState {
  switch (action.type) {
    case `${GET_CERTIFICATE_VOCABULARIES}_PENDING`:
      return {
        ...state,
        vocabularies: { ...state.vocabularies, loading: true, error: null },
      };
    case `${GET_CERTIFICATE_VOCABULARIES}_SUCCESS`: {
      const [fonts, fields, kinds, levels] = (
        action as { result: VocabularyResult[] }
      ).result;
      return {
        ...state,
        fonts: items(fonts),
        fields: items(fields),
        fieldKinds: Object.fromEntries(
          items(kinds).map(({ token, title }) => [token, title]),
        ),
        errorCorrections: items(levels),
        vocabularies: { loading: false, loaded: true, error: null },
      };
    }
    case `${GET_CERTIFICATE_VOCABULARIES}_FAIL`:
      return {
        ...state,
        vocabularies: {
          loading: false,
          loaded: false,
          error: (action as { error: unknown }).error,
        },
      };
    case `${VALIDATE_BLUEPRINT}_PENDING`:
      return {
        ...state,
        validation: { loading: true, valid: null, errors: [], error: null },
      };
    case `${VALIDATE_BLUEPRINT}_SUCCESS`: {
      const { result } = action as {
        result: { valid: boolean; errors: ServerIssue[] };
      };
      return {
        ...state,
        validation: {
          loading: false,
          valid: result.valid,
          errors: result.errors,
          error: null,
        },
      };
    }
    case `${VALIDATE_BLUEPRINT}_FAIL`:
      return {
        ...state,
        validation: {
          loading: false,
          valid: null,
          errors: [],
          error: (action as { error: unknown }).error,
        },
      };
    case `${GET_CERTIFICATE_VERIFICATION}_PENDING`:
      return {
        ...state,
        verification: {
          loading: true,
          loaded: false,
          error: null,
          result: null,
        },
      };
    case `${GET_CERTIFICATE_VERIFICATION}_SUCCESS`:
      return {
        ...state,
        verification: {
          loading: false,
          loaded: true,
          error: null,
          result: (action as { result: CertificateVerification }).result,
        },
      };
    case `${GET_CERTIFICATE_VERIFICATION}_FAIL`:
      return {
        ...state,
        verification: {
          loading: false,
          loaded: false,
          error: (action as { error: unknown }).error,
          result: null,
        },
      };
    case `${CREATE_CERTIFICATES}_PENDING`:
      return {
        ...state,
        batch: { loading: true, result: null, errors: [], error: null },
      };
    case `${CREATE_CERTIFICATES}_SUCCESS`:
      return {
        ...state,
        batch: {
          loading: false,
          result: (action as { result: CertificatesState['batch']['result'] })
            .result,
          errors: [],
          error: null,
        },
      };
    case `${CREATE_CERTIFICATES}_FAIL`: {
      const { error } = action as { error: unknown };
      const errors = batchIssues(error);
      return {
        ...state,
        batch: {
          loading: false,
          result: null,
          errors,
          // A 400 with a list is explained by the list; anything else is not.
          error: errors.length > 0 ? null : error,
        },
      };
    }
    default:
      return state;
  }
}
