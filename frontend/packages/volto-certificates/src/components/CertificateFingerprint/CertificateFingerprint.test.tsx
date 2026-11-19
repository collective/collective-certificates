import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWith } from '../../testing/render';
import CertificateFingerprint from './CertificateFingerprint';

const HASH = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

const setClipboard = (clipboard: unknown) =>
  Object.defineProperty(navigator, 'clipboard', {
    value: clipboard,
    configurable: true,
  });

describe('CertificateFingerprint', () => {
  afterEach(() => setClipboard(undefined));

  it('shows the hash and what to compare it with', () => {
    renderWith(<CertificateFingerprint hash={HASH} />);
    expect(screen.getByText(HASH)).toBeTruthy();
    expect(
      screen.getByText(/if they match, the file has not been changed/),
    ).toBeTruthy();
  });

  it('copies the hash', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    setClipboard({ writeText });
    renderWith(<CertificateFingerprint hash={HASH} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith(HASH);
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeTruthy();
  });

  it('keeps the copy button when the browser refuses', async () => {
    const writeText = vi.fn(() => Promise.reject(new Error('denied')));
    setClipboard({ writeText });
    renderWith(<CertificateFingerprint hash={HASH} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
  });

  it('offers no copy without a clipboard', () => {
    setClipboard(undefined);
    renderWith(<CertificateFingerprint hash={HASH} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
