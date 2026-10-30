/** Delay before the object URL is released, so the download can start. */
const REVOKE_DELAY_MS = 1000;

/** Byte order mark: without it, Excel reads a CSV file as Windows-1252. */
const BOM = '\uFEFF';

/**
 * Save CSV text as a file the browser downloads.
 *
 * @param csv The text of the file.
 * @param filename The name the download gets.
 */
export function saveCsvFile(csv: string, filename: string): void {
  const blob = new Blob([BOM, csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

/**
 * Read a file's bytes.
 *
 * @param file The file.
 * @returns A promise of its contents.
 */
function readBytes(file: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read a file the user chose as text.
 *
 * Spreadsheets often save CSV files in Windows-1252 rather than UTF-8, and
 * decoding those as UTF-8 turns every accented letter into U+FFFD.
 *
 * @param file The file, from an `<input type="file">`.
 * @returns A promise of the file's text: decoded as UTF-8 when it is valid
 *   UTF-8 (a byte order mark is dropped), as Windows-1252 otherwise.
 */
export async function readTextFile(file: Blob): Promise<string> {
  const bytes = await readBytes(file);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}
