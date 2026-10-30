import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import {
  CREATE_CERTIFICATES,
  GET_CERTIFICATES_CSV,
} from '../../actions/certificates';
import { saveCsvFile } from '../../helpers/csv';
import { BLUEPRINTS } from '../../testing/fixtures';
import { LOADED, fakeStore, renderWith } from '../../testing/render';
import CertificateTemplateView from './CertificateTemplateView';
import type { CertificateTemplateContent } from './CertificateTemplateView';
import type { CertificatesState } from '../../reducers/certificates';

vi.mock('../../helpers/csv', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../helpers/csv')>()),
  saveCsvFile: vi.fn(),
}));

const EDIT = { actions: { actions: { object: [{ id: 'edit' }] } } };
const VIEW_ONLY = { actions: { actions: { object: [{ id: 'view' }] } } };

const EMPTY_BATCH: CertificatesState['batch'] = {
  loading: false,
  result: null,
  errors: [],
  error: null,
};

const content = (
  overrides: Partial<CertificateTemplateContent> = {},
): CertificateTemplateContent => ({
  '@id': 'http://localhost:3000/templates/a',
  title: 'Certificado',
  description: 'Modelo de certificado.',
  background: {
    download: 'http://localhost:3000/templates/a/@@download/background',
    width: 3508,
    height: 2480,
  },
  blueprint: BLUEPRINTS.sample,
  items: [
    {
      '@id': 'http://localhost:3000/templates/a/signature',
      '@type': 'Image',
      id: 'signature',
      title: 'Signature',
    },
  ],
  ...overrides,
});

const withBatch = (batch: Partial<CertificatesState['batch']>) => ({
  certificates: { ...LOADED, batch: { ...EMPTY_BATCH, ...batch } },
  ...EDIT,
});

const uploadButton = () =>
  screen.getByRole('button', { name: 'Create certificates from CSV' });

const fileInput = (container: HTMLElement) =>
  container.querySelector('input[type="file"]') as HTMLInputElement;

describe('CertificateTemplateView', () => {
  it('draws the certificate with the background and its images', () => {
    const { container } = renderWith(
      <CertificateTemplateView content={content()} />,
    );
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Certificado',
    );
    expect(screen.getByText('Modelo de certificado.')).toBeTruthy();
    const preview = container.querySelector('.certificate-blueprint-preview');
    expect(preview?.querySelector('svg')).toBeTruthy();
    expect(preview?.innerHTML).toContain('/templates/a/@@download/background');
    expect(preview?.innerHTML).toContain(
      '/templates/a/signature/@@images/image',
    );
  });

  it('lists the images inside the template', () => {
    renderWith(<CertificateTemplateView content={content()} />);
    const link = screen.getByRole('link', { name: /Signature/ });
    expect(link.getAttribute('href')).toBe('/templates/a/signature');
    expect(screen.getByText('signature')).toBeTruthy();
  });

  it('explains how to add images when there are none', () => {
    renderWith(<CertificateTemplateView content={content({ items: [] })} />);
    expect(screen.getByText(/add it as an image inside/)).toBeTruthy();
  });

  it('says so when there is no design', () => {
    const { container } = renderWith(
      <CertificateTemplateView content={content({ blueprint: null })} />,
    );
    expect(screen.getByText('This template has no design yet.')).toBeTruthy();
    expect(
      container.querySelector('.certificate-blueprint-preview'),
    ).toBeNull();
  });

  it('hides the CSV tools without the edit action', () => {
    renderWith(<CertificateTemplateView content={content()} />);
    expect(
      screen.queryByRole('button', { name: 'Download CSV template' }),
    ).toBeNull();
    expect(screen.queryByRole('button', { name: /from CSV/ })).toBeNull();
  });

  it('hides the CSV tools when only view actions are allowed', () => {
    const store = fakeStore({ certificates: LOADED, ...VIEW_ONLY });
    renderWith(<CertificateTemplateView content={content()} />, store);
    expect(screen.queryByRole('button', { name: /CSV/ })).toBeNull();
  });

  it('shows the CSV tools to users who can edit', () => {
    const store = fakeStore({ certificates: LOADED, ...EDIT });
    const { container } = renderWith(
      <CertificateTemplateView content={content()} />,
      store,
    );
    expect(
      screen.getByRole('button', { name: 'Download CSV template' }),
    ).toBeTruthy();
    expect(uploadButton()).toBeTruthy();
    expect(fileInput(container).getAttribute('accept')).toBe('.csv,text/csv');
  });

  it('downloads the CSV template and saves it', async () => {
    const seen: { type: string; request: { path: string } }[] = [];
    const store = fakeStore({ certificates: LOADED, ...EDIT }, (action) => {
      seen.push(action as (typeof seen)[number]);
      return {
        filename: 'starfleet-academy-certificate.csv',
        csv: 'parent_container,full_name\n/events/2026,Ana\n',
      };
    });
    renderWith(<CertificateTemplateView content={content()} />, store);
    fireEvent.click(
      screen.getByRole('button', { name: 'Download CSV template' }),
    );
    await waitFor(() =>
      expect(saveCsvFile).toHaveBeenCalledWith(
        'parent_container,full_name\n/events/2026,Ana\n',
        'starfleet-academy-certificate.csv',
      ),
    );
    expect(seen[0].type).toBe(GET_CERTIFICATES_CSV);
    expect(seen[0].request.path).toBe('/templates/a/@certificates-csv');
  });

  it('says when the CSV template cannot be downloaded', async () => {
    const store = fakeStore({ certificates: LOADED, ...EDIT }, () => {
      throw new Error('down');
    });
    renderWith(<CertificateTemplateView content={content()} />, store);
    fireEvent.click(
      screen.getByRole('button', { name: 'Download CSV template' }),
    );
    expect(
      await screen.findByText('The CSV template could not be downloaded.'),
    ).toBeTruthy();
  });

  it('sends the chosen file to the template', async () => {
    const seen: unknown[] = [];
    const store = fakeStore({ certificates: LOADED, ...EDIT }, (action) => {
      seen.push(action);
      return undefined;
    });
    const { container } = renderWith(
      <CertificateTemplateView content={content()} />,
      store,
    );
    const file = new File(['full_name\nAna\n'], 'people.csv', {
      type: 'text/csv',
    });
    fireEvent.change(fileInput(container), { target: { files: [file] } });
    await waitFor(() => expect(seen.length).toBe(1));
    const action = seen[0] as {
      type: string;
      request: { path: string; data: unknown };
    };
    expect(action.type).toBe(CREATE_CERTIFICATES);
    expect(action.request.path).toBe('/templates/a/@create-certificates');
    expect(action.request.data).toEqual({ csv: 'full_name\nAna\n' });
  });

  it('shows the progress of an upload', () => {
    const store = fakeStore(withBatch({ loading: true }));
    renderWith(<CertificateTemplateView content={content()} />, store);
    expect(screen.getByRole('status').textContent).toBe(
      'Creating certificates…',
    );
  });

  it('lists the certificates created by an upload', () => {
    const store = fakeStore(
      withBatch({
        result: {
          items: [
            {
              '@id': 'http://localhost:3000/events/2026/riker',
              '@type': 'Certificate',
              title: 'William Riker',
            },
            {
              '@id': 'http://localhost:3000/events/2026/troi',
              '@type': 'Certificate',
              title: 'Deanna Troi',
            },
            {
              '@id': 'http://localhost:3000/events/2026/la-forge',
              '@type': 'Certificate',
              title: 'Geordi La Forge',
            },
          ],
          items_total: 3,
        },
      }),
    );
    renderWith(<CertificateTemplateView content={content()} />, store);
    expect(screen.getByRole('status').textContent).toContain(
      '3 certificates were created.',
    );
    const link = screen.getByRole('link', { name: 'William Riker' });
    expect(link.getAttribute('href')).toBe('/events/2026/riker');
    expect(screen.getByRole('link', { name: 'Geordi La Forge' })).toBeTruthy();
  });

  it('opens a created certificate with a route change, not a page load', () => {
    const store = fakeStore(
      withBatch({
        result: {
          items: [
            {
              '@id': 'http://localhost:3000/events/2026/riker',
              '@type': 'Certificate',
              title: 'William Riker',
            },
          ],
          items_total: 1,
        },
      }),
    );
    renderWith(
      <>
        <CertificateTemplateView content={content()} />
        <Route
          render={({ location }) => (
            <output data-testid="location">{location.pathname}</output>
          )}
        />
      </>,
      store,
    );
    fireEvent.click(screen.getByRole('link', { name: 'William Riker' }));
    expect(screen.getByTestId('location').textContent).toBe(
      '/events/2026/riker',
    );
  });

  it('uses the singular for one certificate', () => {
    const store = fakeStore(
      withBatch({
        result: {
          items: [
            {
              '@id': 'http://localhost:3000/events/a',
              '@type': 'Certificate',
              title: 'A',
            },
          ],
          items_total: 1,
        },
      }),
    );
    renderWith(<CertificateTemplateView content={content()} />, store);
    expect(screen.getByRole('status').textContent).toContain(
      '1 certificate was created.',
    );
  });

  it('lists the problems of a CSV file that creates nothing', () => {
    const store = fakeStore(
      withBatch({
        errors: [
          {
            row: 3,
            column: 'event_start_date',
            message: "Not a valid date: '2026-02-30'",
          },
          { row: 0, column: null, message: 'The file has no rows.' },
          { row: 4, column: null, message: 'Too many columns.' },
        ],
      }),
    );
    renderWith(<CertificateTemplateView content={content()} />, store);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('No certificates were created.');
    expect(
      screen.getByText(
        "Line 3, event_start_date: Not a valid date: '2026-02-30'",
      ),
    ).toBeTruthy();
    expect(screen.getByText('The file has no rows.')).toBeTruthy();
    expect(screen.getByText('Line 4: Too many columns.')).toBeTruthy();
  });

  it('shows the messages of a blueprint problem without a line', () => {
    const store = fakeStore(
      withBatch({
        errors: [
          {
            element: 'name',
            path: '/elements/0/font',
            message: 'Unknown font.',
          },
        ],
      }),
    );
    renderWith(<CertificateTemplateView content={content()} />, store);
    expect(screen.getByText('Unknown font.')).toBeTruthy();
  });

  it('says so when the upload failed without a list of problems', () => {
    const store = fakeStore(withBatch({ error: { status: 500 } }));
    renderWith(<CertificateTemplateView content={content()} />, store);
    expect(
      screen.getByText('The certificates could not be created. Try again.'),
    ).toBeTruthy();
  });
});
