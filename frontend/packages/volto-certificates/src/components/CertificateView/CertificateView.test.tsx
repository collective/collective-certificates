import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LOADED, fakeStore, renderWith } from '../../testing/render';
import CertificateView from './CertificateView';
import type { CertificateContent } from './CertificateView';

const UID = '257e08fdcd07ff6fa3d1bc14f6aec321';
const HASH = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

const content = (
  overrides: Partial<CertificateContent> = {},
): CertificateContent => ({
  '@id': 'http://localhost:8080/Plone/certificates/picard',
  UID,
  title: 'Star Trek: Picard — Patrick Stewart',
  created: '2026-10-30T12:00:00+00:00',
  data: {
    full_name: 'Patrick Stewart',
    event_start_date: '2026-05-26',
    certificate_uid: UID,
    total_hours: '',
  },
  file: {
    download: 'http://localhost:8080/Plone/certificates/picard/@@download/file',
    filename: 'picard.pdf',
    'content-type': 'application/pdf',
    size: 125952,
  },
  file_hash: HASH,
  ...overrides,
});

const values = () =>
  within(screen.getByRole('heading', { name: 'Details' }).parentElement!);

describe('CertificateView', () => {
  it('shows the title and the issue date', () => {
    renderWith(<CertificateView content={content()} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Star Trek: Picard — Patrick Stewart',
    );
    expect(screen.getByText('Issued on October 30, 2026')).toBeTruthy();
  });

  it('offers the file for download, with its type and size', () => {
    renderWith(<CertificateView content={content()} />);
    const link = screen.getByRole('link', { name: 'Download certificate' });
    expect(link.getAttribute('href')).toBe(
      '/certificates/picard/@@download/file',
    );
    expect(link.getAttribute('download')).toBe('picard.pdf');
    expect(screen.getByText('PDF file, 123 kB')).toBeTruthy();
  });

  it('says so when the certificate has no file', () => {
    renderWith(<CertificateView content={content({ file: null })} />);
    expect(
      screen.queryByRole('link', { name: 'Download certificate' }),
    ).toBeNull();
    expect(
      screen.getByText('The file of this certificate is not available.'),
    ).toBeTruthy();
    expect(
      screen.getByRole('link', {
        name: 'Check that this certificate is valid',
      }),
    ).toBeTruthy();
  });

  it('lists the values with their titles, dates formatted', () => {
    renderWith(<CertificateView content={content()} />);
    const list = values();
    // The test vocabulary titles each field with its token, spaced.
    expect(list.getByText('full name')).toBeTruthy();
    expect(list.getByText('Patrick Stewart')).toBeTruthy();
    expect(list.getByText('event start date')).toBeTruthy();
    expect(list.getByText('May 26, 2026')).toBeTruthy();
  });

  it('shows the values in a table, one row per field', () => {
    renderWith(<CertificateView content={content()} />);
    const table = values().getByRole('table');
    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((cell) => cell.textContent)).toEqual(['Field', 'Value']);
    const rows = within(table).getAllByRole('rowheader');
    expect(rows.map((cell) => cell.textContent)).toEqual([
      'full name',
      'event start date',
    ]);
  });

  it('leaves out computed and empty values', () => {
    renderWith(<CertificateView content={content()} />);
    const list = values();
    expect(list.getByText('full name')).toBeTruthy();
    expect(list.queryByText('certificate uid')).toBeNull();
    expect(list.queryByText(UID)).toBeNull();
    expect(list.queryByText('total hours')).toBeNull();
  });

  it('lists nothing without values', () => {
    renderWith(<CertificateView content={content({ data: null })} />);
    expect(screen.queryByRole('heading', { name: 'Details' })).toBeNull();
  });

  it('lists nothing until the field titles are loaded', () => {
    const store = fakeStore({
      certificates: { ...LOADED, fields: [], fieldKinds: {} },
    });
    renderWith(<CertificateView content={content()} />, store);
    expect(screen.queryByRole('heading', { name: 'Details' })).toBeNull();
  });

  it('shows the fingerprint of the file', () => {
    renderWith(<CertificateView content={content()} />);
    expect(
      screen.getByRole('heading', { name: 'File fingerprint (SHA-256)' }),
    ).toBeTruthy();
    expect(screen.getByText(HASH)).toBeTruthy();
  });

  it('shows no fingerprint without a hash', () => {
    renderWith(<CertificateView content={content({ file_hash: null })} />);
    expect(
      screen.queryByRole('heading', { name: 'File fingerprint (SHA-256)' }),
    ).toBeNull();
  });

  it('links to the verification page with a button beside the download', () => {
    renderWith(<CertificateView content={content()} />);
    const link = screen.getByRole('link', {
      name: 'Check that this certificate is valid',
    });
    expect(link.getAttribute('href')).toBe(`/verify/${UID}`);
    expect(link.className).toContain('ui button');
    expect(link.className).not.toContain('primary');
    const download = screen.getByRole('link', { name: 'Download certificate' });
    expect(link.parentElement).toBe(download.parentElement);
  });
});
