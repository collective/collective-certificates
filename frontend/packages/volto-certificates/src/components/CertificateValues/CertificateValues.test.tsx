import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWith } from '../../testing/render';
import CertificateValues from './CertificateValues';
import type { CertificateValue } from './CertificateValues';

const VALUES: CertificateValue[] = [
  { token: 'full_name', title: 'Full name', kind: 'text', value: 'Riker' },
  {
    token: 'event_start_date',
    title: 'Event start date',
    kind: 'date',
    value: '2026-05-26',
  },
  { token: 'total_hours', title: 'Total hours', kind: 'text', value: '' },
  {
    token: 'certificate_uid',
    title: 'Certificate ID',
    kind: 'computed',
    value: 'abc',
  },
];

describe('CertificateValues', () => {
  it('shows a field and value table', () => {
    renderWith(<CertificateValues values={VALUES} />);
    expect(screen.getByRole('heading', { name: 'Details' })).toBeTruthy();
    expect(
      screen.getAllByRole('columnheader').map((cell) => cell.textContent),
    ).toEqual(['Field', 'Value']);
  });

  it('formats dates and leaves out computed and empty values', () => {
    renderWith(<CertificateValues values={VALUES} />);
    expect(
      screen.getAllByRole('rowheader').map((cell) => cell.textContent),
    ).toEqual(['Full name', 'Event start date']);
    expect(screen.getByText('May 26, 2026')).toBeTruthy();
    expect(screen.queryByText('abc')).toBeNull();
  });

  it('shows nothing without values to show', () => {
    const { container } = renderWith(
      <CertificateValues values={VALUES.slice(2)} />,
    );
    expect(container.innerHTML).toBe('');
  });
});
