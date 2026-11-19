import { describe, expect, it } from 'vitest';
import { fileType, sizeUnit } from './files';

describe('fileType', () => {
  it.each([
    ['a.pdf', 'application/pdf', 'PDF'],
    ['a.png', 'image/png', 'PNG'],
    ['a.svg', 'image/svg+xml', 'SVG'],
    ['certificate', 'application/octet-stream', ''],
  ])('%s (%s) is %s', (filename, contentType, expected) => {
    expect(fileType({ filename, 'content-type': contentType })).toBe(expected);
  });
});

describe('sizeUnit', () => {
  it.each([
    [512, { value: 512, unit: 'byte' }],
    [2048, { value: 2, unit: 'kilobyte' }],
    [3 * 1024 * 1024, { value: 3, unit: 'megabyte' }],
  ])('%d bytes', (bytes, expected) => {
    expect(sizeUnit(bytes)).toEqual(expected);
  });
});
