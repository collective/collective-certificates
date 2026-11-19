import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWith } from '../../testing/render';
import CertificateCard from './CertificateCard';

const FILE = {
  filename: 'picard.png',
  'content-type': 'image/png',
  size: 3 * 1024 * 1024,
};

describe('CertificateCard', () => {
  it('shows the issue date and a download button', () => {
    renderWith(
      <CertificateCard
        issued="2026-10-30T12:00:00+00:00"
        file={FILE}
        downloadUrl="/picard/@@download/file"
      />,
    );
    expect(screen.getByText('Issued on October 30, 2026')).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Download certificate' });
    expect(link.getAttribute('href')).toBe('/picard/@@download/file');
    expect(link.getAttribute('download')).toBe('picard.png');
    expect(link.className).toContain('primary');
    expect(screen.getByText('PNG file, 3 MB')).toBeTruthy();
  });

  it('shows more buttons after the download', () => {
    renderWith(
      <CertificateCard issued="2026-10-30" file={FILE} downloadUrl="/f">
        <button type="button">More</button>
      </CertificateCard>,
    );
    const download = screen.getByRole('link', { name: 'Download certificate' });
    const more = screen.getByRole('button', { name: 'More' });
    expect(download.nextElementSibling).toBe(more);
  });

  it('says so when there is no file, and keeps the other buttons', () => {
    renderWith(
      <CertificateCard issued="2026-10-30" file={null} downloadUrl="">
        <button type="button">More</button>
      </CertificateCard>,
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(
      screen.getByText('The file of this certificate is not available.'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'More' })).toBeTruthy();
  });
});
