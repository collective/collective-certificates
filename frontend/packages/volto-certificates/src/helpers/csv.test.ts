import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readTextFile, saveCsvFile } from './csv';

describe('saveCsvFile', () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let clicked: { href: string; download: string }[];

  beforeEach(() => {
    vi.useFakeTimers();
    createObjectURL = vi.fn(() => 'blob:certificates');
    revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL as never;
    URL.revokeObjectURL = revokeObjectURL as never;
    clicked = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push({ href: this.href, download: this.download });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('downloads the text as a CSV file with the given name', () => {
    saveCsvFile('full_name\nAna\n', 'starfleet-academy-certificate.csv');
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/csv;charset=utf-8');
    // Byte order mark (3 bytes) first, so Excel reads it as UTF-8.
    expect(blob.size).toBe(3 + 'full_name\nAna\n'.length);
    expect(clicked).toEqual([
      {
        href: 'blob:certificates',
        download: 'starfleet-academy-certificate.csv',
      },
    ]);
  });

  it('removes the link and releases the object URL afterwards', () => {
    saveCsvFile('a,b\n', 'x.csv');
    expect(document.querySelector('a[download]')).toBeNull();
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:certificates');
  });
});

describe('readTextFile', () => {
  it('reads the text of a file as UTF-8', async () => {
    const file = new File(['full_name,event_name\nAna,Curso\n'], 'a.csv', {
      type: 'text/csv',
    });
    await expect(readTextFile(file)).resolves.toBe(
      'full_name,event_name\nAna,Curso\n',
    );
  });

  it('reads accented text', async () => {
    const file = new File(['name\nChâteau Picard\n'], 'b.csv');
    await expect(readTextFile(file)).resolves.toBe('name\nChâteau Picard\n');
  });

  it('drops the byte order mark of a UTF-8 file', async () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0xc3, 0x89, 0x0a]);
    await expect(readTextFile(new File([bytes], 'c.csv'))).resolves.toBe('É\n');
  });

  it('reads a Windows-1252 file, as spreadsheets often save', async () => {
    // "Érico Andrei" in Windows-1252: É is the single byte 0xC9.
    const bytes = new Uint8Array([
      0xc9, 0x72, 0x69, 0x63, 0x6f, 0x20, 0x41, 0x6e, 0x64, 0x72, 0x65, 0x69,
    ]);
    await expect(readTextFile(new File([bytes], 'd.csv'))).resolves.toBe(
      'Érico Andrei',
    );
  });

  it('rejects when the file cannot be read', async () => {
    const file = new File(['x'], 'e.csv');
    const error = new DOMException('gone');
    vi.spyOn(FileReader.prototype, 'readAsArrayBuffer').mockImplementation(
      function (this: FileReader) {
        Object.defineProperty(this, 'error', { value: error });
        this.onerror?.(new ProgressEvent('error') as never);
      },
    );
    await expect(readTextFile(file)).rejects.toBe(error);
    vi.restoreAllMocks();
  });
});
