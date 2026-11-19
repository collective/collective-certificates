/** The file of an issued certificate, as the REST API serializes it. */
export interface CertificateFile {
  download: string;
  filename: string;
  'content-type': string;
  size: number;
}

const TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
};

/** A short name of a file's type: `PDF`, `PNG`, else its extension. */
export function fileType(
  file: Pick<CertificateFile, 'filename' | 'content-type'>,
) {
  const known = TYPES[file['content-type']];
  if (known) return known;
  const dot = file.filename.lastIndexOf('.');
  return dot > 0 ? file.filename.slice(dot + 1).toUpperCase() : '';
}

/** A file size as a number and unit, for `Intl.NumberFormat`. */
export function sizeUnit(bytes: number): {
  value: number;
  unit: 'byte' | 'kilobyte' | 'megabyte';
} {
  if (bytes < 1024) return { value: bytes, unit: 'byte' };
  if (bytes < 1024 * 1024) return { value: bytes / 1024, unit: 'kilobyte' };
  return { value: bytes / (1024 * 1024), unit: 'megabyte' };
}
