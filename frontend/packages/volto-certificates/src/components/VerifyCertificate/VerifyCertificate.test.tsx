import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GET_CERTIFICATE_VERIFICATION } from '../../actions/certificates';
import { LOADED, fakeStore, renderWith } from '../../testing/render';
import type { CertificateVerification } from '../../reducers/certificates';
import VerifyCertificate from './VerifyCertificate';

const UID = '257e08fdcd07ff6fa3d1bc14f6aec321';

const CERTIFICATE: CertificateVerification = {
  uid: UID,
  title: 'Star Trek: Picard — Patrick Stewart',
  issued: '2026-10-30T12:00:00+00:00',
  data: {},
  fields: [
    {
      token: 'full_name',
      title: 'Full name',
      kind: 'text',
      value: 'Patrick Stewart',
    },
    {
      token: 'event_start_date',
      title: 'Event start date',
      kind: 'date',
      value: '2026-05-26',
    },
    {
      token: 'verification_url',
      title: 'Verification URL',
      kind: 'computed',
      value: `https://example.org/verify/${UID}`,
    },
  ],
  template: null,
  file: {
    download: `http://localhost:8080/@@certificate-file/${UID}`,
    filename: 'certificate.pdf',
    'content-type': 'application/pdf',
    size: 123,
  },
};

const match = { params: { uid: UID } };

const storeWith = (verification: Record<string, unknown>) =>
  fakeStore({
    certificates: {
      ...LOADED,
      verification: {
        loading: false,
        loaded: false,
        error: null,
        result: null,
        ...verification,
      },
    },
  });

describe('VerifyCertificate', () => {
  it('asks for the certificate it was given on mount', () => {
    const store = storeWith({});
    renderWith(<VerifyCertificate match={match} />, store);
    expect(store.actions.map((action) => action.type)).toEqual([
      GET_CERTIFICATE_VERIFICATION,
    ]);
  });

  it('does not ask again for a certificate the store holds', () => {
    const store = storeWith({ loaded: true, result: CERTIFICATE });
    renderWith(<VerifyCertificate match={match} />, store);
    expect(store.actions).toEqual([]);
  });

  it('says the certificate is valid and shows its details', () => {
    const store = storeWith({ loaded: true, result: CERTIFICATE });
    renderWith(<VerifyCertificate match={match} />, store);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'This certificate is valid',
    );
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      'Star Trek: Picard — Patrick Stewart',
    );
    expect(screen.getByText('Issued on October 30, 2026')).toBeTruthy();
    expect(screen.getByText('Full name')).toBeTruthy();
    expect(screen.getByText('Patrick Stewart')).toBeTruthy();
  });

  it('formats dates and leaves out computed fields', () => {
    const store = storeWith({ loaded: true, result: CERTIFICATE });
    renderWith(<VerifyCertificate match={match} />, store);
    expect(screen.getByText('May 26, 2026')).toBeTruthy();
    expect(screen.queryByText('Verification URL')).toBeNull();
  });

  it('links to the PDF through the API', () => {
    const store = storeWith({ loaded: true, result: CERTIFICATE });
    renderWith(<VerifyCertificate match={match} />, store);
    const link = screen.getByRole('link', {
      name: 'Download the certificate (PDF)',
    });
    expect(link.getAttribute('href')).toBe(
      `/++api++/@@certificate-file/${UID}`,
    );
  });

  it('offers no download when the certificate has no file', () => {
    const store = storeWith({
      loaded: true,
      result: { ...CERTIFICATE, file: null },
    });
    renderWith(<VerifyCertificate match={match} />, store);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('says no certificate was found when verification fails', () => {
    const store = storeWith({ error: { status: 404 } });
    renderWith(<VerifyCertificate match={match} />, store);
    expect(
      screen.getByText('No certificate with this ID was found.'),
    ).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('says it is checking while the answer is pending', () => {
    const store = storeWith({ loading: true });
    renderWith(<VerifyCertificate match={match} />, store);
    expect(screen.getByText('Checking the certificate…')).toBeTruthy();
  });
});
