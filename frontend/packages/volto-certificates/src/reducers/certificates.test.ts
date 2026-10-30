import { describe, expect, it } from 'vitest';
import {
  CREATE_CERTIFICATES,
  GET_CERTIFICATE_VERIFICATION,
  GET_CERTIFICATE_VOCABULARIES,
  GET_CERTIFICATES_CSV,
  VALIDATE_BLUEPRINT,
  VOCABULARIES,
  createCertificates,
  getCertificateVerification,
  getCertificateVocabularies,
  getCertificatesCsv,
  validateBlueprint,
} from '../actions/certificates';
import { emptyBlueprint } from '../blueprint/model';
import certificates, { batchIssues, initialState } from './certificates';
import type { CertificateVerification } from './certificates';

const CERTIFICATE: CertificateVerification = {
  uid: '257e08fdcd07ff6fa3d1bc14f6aec321',
  title: 'Star Trek: Picard — Patrick Stewart',
  issued: '2026-10-30T12:00:00+00:00',
  data: { full_name: 'Patrick Stewart' },
  fields: [
    {
      token: 'full_name',
      title: 'Full name',
      kind: 'text',
      value: 'Patrick Stewart',
    },
  ],
  template: null,
  file: null,
};

describe('actions', () => {
  it('loads every vocabulary unbatched in one action', () => {
    const action = getCertificateVocabularies();
    expect(action.type).toBe(GET_CERTIFICATE_VOCABULARIES);
    expect(action.request.map((r) => r.path)).toEqual(
      VOCABULARIES.map((name) => `/@vocabularies/${name}?b_size=-1`),
    );
    expect(action.request.every((r) => r.op === 'get')).toBe(true);
  });

  it('gets the certificate by its UID, anonymously', () => {
    expect(getCertificateVerification(CERTIFICATE.uid)).toEqual({
      type: GET_CERTIFICATE_VERIFICATION,
      request: {
        op: 'get',
        path: `/@certificate-verification/${CERTIFICATE.uid}`,
      },
    });
  });

  it('posts the blueprint to the template', () => {
    const blueprint = emptyBlueprint();
    expect(validateBlueprint('/templates/a', blueprint)).toEqual({
      type: VALIDATE_BLUEPRINT,
      request: {
        op: 'post',
        path: '/templates/a/@validate-blueprint',
        data: { blueprint },
      },
    });
  });
});

describe('CSV actions', () => {
  it('gets the CSV template of the template', () => {
    expect(getCertificatesCsv('http://localhost:3000/templates/a')).toEqual({
      type: GET_CERTIFICATES_CSV,
      request: {
        op: 'get',
        path: '/templates/a/@certificates-csv',
      },
    });
  });

  it('posts the CSV text to create the certificates', () => {
    const csv = 'parent_container,full_name\n/events/2026,Ana\n';
    expect(createCertificates('/templates/a', csv)).toEqual({
      type: CREATE_CERTIFICATES,
      request: {
        op: 'post',
        path: '/templates/a/@create-certificates',
        data: { csv },
      },
    });
  });
});

describe('certificates reducer', () => {
  it('starts empty', () => {
    expect(certificates(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('stores the vocabularies', () => {
    const term = (token: string, title = token) => ({ token, title, x: 1 });
    const state = certificates(initialState, {
      type: `${GET_CERTIFICATE_VOCABULARIES}_SUCCESS`,
      result: [
        { items: [term('inter', 'Inter')] },
        { items: [term('full_name', 'Full name')] },
        {
          items: [term('full_name', 'text'), term('event_start_date', 'date')],
        },
        { items: [term('L', 'Low (7%)')] },
      ],
    });
    expect(state.fonts).toEqual([{ token: 'inter', title: 'Inter' }]);
    expect(state.fields).toEqual([{ token: 'full_name', title: 'Full name' }]);
    expect(state.fieldKinds).toEqual({
      full_name: 'text',
      event_start_date: 'date',
    });
    expect(state.errorCorrections).toEqual([{ token: 'L', title: 'Low (7%)' }]);
    expect(state.vocabularies).toEqual({
      loading: false,
      loaded: true,
      error: null,
    });
  });

  it('tracks loading and failure', () => {
    const pending = certificates(initialState, {
      type: `${GET_CERTIFICATE_VOCABULARIES}_PENDING`,
    });
    expect(pending.vocabularies.loading).toBe(true);
    const failed = certificates(pending, {
      type: `${GET_CERTIFICATE_VOCABULARIES}_FAIL`,
      error: 'boom',
    });
    expect(failed.vocabularies).toEqual({
      loading: false,
      loaded: false,
      error: 'boom',
    });
  });

  it('tolerates a vocabulary without items', () => {
    const state = certificates(initialState, {
      type: `${GET_CERTIFICATE_VOCABULARIES}_SUCCESS`,
      result: [{}, {}, {}, {}],
    });
    expect(state.fonts).toEqual([]);
    expect(state.fieldKinds).toEqual({});
  });

  it('stores the last validation', () => {
    const pending = certificates(initialState, {
      type: `${VALIDATE_BLUEPRINT}_PENDING`,
    });
    expect(pending.validation.loading).toBe(true);
    const errors = [{ element: 'a', path: '/elements/0', message: 'Bad' }];
    const done = certificates(pending, {
      type: `${VALIDATE_BLUEPRINT}_SUCCESS`,
      result: { valid: false, errors },
    });
    expect(done.validation).toEqual({
      loading: false,
      valid: false,
      errors,
      error: null,
    });
    const failed = certificates(pending, {
      type: `${VALIDATE_BLUEPRINT}_FAIL`,
      error: 'down',
    });
    expect(failed.validation.error).toBe('down');
  });

  it('stores the certificate being verified', () => {
    const pending = certificates(initialState, {
      type: `${GET_CERTIFICATE_VERIFICATION}_PENDING`,
    });
    expect(pending.verification).toEqual({
      loading: true,
      loaded: false,
      error: null,
      result: null,
    });
    const done = certificates(pending, {
      type: `${GET_CERTIFICATE_VERIFICATION}_SUCCESS`,
      result: CERTIFICATE,
    });
    expect(done.verification).toEqual({
      loading: false,
      loaded: true,
      error: null,
      result: CERTIFICATE,
    });
  });

  it('forgets the certificate when verification fails', () => {
    const loaded = certificates(initialState, {
      type: `${GET_CERTIFICATE_VERIFICATION}_SUCCESS`,
      result: CERTIFICATE,
    });
    const failed = certificates(loaded, {
      type: `${GET_CERTIFICATE_VERIFICATION}_FAIL`,
      error: { status: 404 },
    });
    expect(failed.verification).toEqual({
      loading: false,
      loaded: false,
      error: { status: 404 },
      result: null,
    });
  });

  it('tracks an upload and the certificates it created', () => {
    const pending = certificates(initialState, {
      type: `${CREATE_CERTIFICATES}_PENDING`,
    });
    expect(pending.batch).toEqual({
      loading: true,
      result: null,
      errors: [],
      error: null,
    });
    const items = [
      {
        '@id': 'http://localhost:3000/events/2026/ana',
        '@type': 'Certificate',
        title: 'William Riker',
      },
    ];
    const done = certificates(pending, {
      type: `${CREATE_CERTIFICATES}_SUCCESS`,
      result: { items, items_total: 1 },
    });
    expect(done.batch).toEqual({
      loading: false,
      result: { items, items_total: 1 },
      errors: [],
      error: null,
    });
  });

  it('keeps the row errors of a rejected CSV file', () => {
    const rejected = {
      response: {
        status: 400,
        body: {
          error: {
            type: 'BadRequest',
            message: 'Invalid CSV',
            errors: [
              {
                row: 3,
                column: 'event_start_date',
                message: "Not a valid date: '2026-02-30'",
              },
              { row: 0, column: null, message: 'The file has no rows.' },
            ],
          },
        },
      },
    };
    const failed = certificates(initialState, {
      type: `${CREATE_CERTIFICATES}_FAIL`,
      error: rejected,
    });
    expect(failed.batch).toEqual({
      loading: false,
      result: null,
      errors: rejected.response.body.error.errors,
      error: null,
    });
  });

  it('keeps the error of a failed upload without a list', () => {
    const failed = certificates(initialState, {
      type: `${CREATE_CERTIFICATES}_FAIL`,
      error: { response: { status: 500, body: {} } },
    });
    expect(failed.batch.errors).toEqual([]);
    expect(failed.batch.error).toEqual({ response: { status: 500, body: {} } });
  });

  it('reads the errors of a request error only from its body', () => {
    expect(batchIssues(undefined)).toEqual([]);
    expect(batchIssues('down')).toEqual([]);
    expect(batchIssues({ response: { body: { error: {} } } })).toEqual([]);
    expect(
      batchIssues({
        response: { body: { error: { errors: [{ message: 'Bad' }] } } },
      }),
    ).toEqual([{ message: 'Bad' }]);
  });

  it('ignores other actions', () => {
    expect(certificates(initialState, { type: 'OTHER' })).toBe(initialState);
  });
});
