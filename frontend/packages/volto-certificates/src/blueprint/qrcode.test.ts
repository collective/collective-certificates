import { describe, expect, it } from 'vitest';
import vectors from '../../__fixtures__/qr-vectors.json';
import { QUIET_ZONE, qrMatrix, qrPath } from './qrcode';
import type { QrErrorCorrection } from './qrcode';

const toRows = (matrix: boolean[][]): string[] =>
  matrix.map((row) => row.map((dark) => (dark ? '1' : '0')).join(''));

describe('qrMatrix', () => {
  it.each(vectors.cases)(
    'draws the backend symbol for $ec "$content"',
    ({ content, ec, modules, matrix }) => {
      const result = qrMatrix(content, ec as QrErrorCorrection);
      expect(result).toHaveLength(modules);
      expect(toRows(result)).toEqual(matrix);
    },
  );

  it('keeps the requested error correction level', () => {
    // A boosted level would change the format information in row 8.
    const low = toRows(qrMatrix('HELLO', 'L'));
    const high = toRows(qrMatrix('HELLO', 'H'));
    expect(low).toHaveLength(21);
    expect(high).toHaveLength(21);
    expect(low[8]).not.toEqual(high[8]);
  });

  it('grows the version with the content', () => {
    expect(qrMatrix('x'.repeat(17), 'L')).toHaveLength(21);
    expect(qrMatrix('x'.repeat(18), 'L')).toHaveLength(25);
  });

  it('rejects content longer than version 40', () => {
    expect(() => qrMatrix('x'.repeat(3000), 'L')).toThrow(RangeError);
  });
});

describe('qrPath', () => {
  it('draws one rectangle per horizontal run, shifted by the quiet zone', () => {
    const matrix = [
      [true, true, false],
      [false, false, false],
      [true, false, true],
    ];
    expect(qrPath(matrix)).toBe(
      `M${QUIET_ZONE} ${QUIET_ZONE}h2v1h-2z` +
        `M${QUIET_ZONE} ${QUIET_ZONE + 2}h1v1h-1z` +
        `M${QUIET_ZONE + 2} ${QUIET_ZONE + 2}h1v1h-1z`,
    );
  });

  it('accepts another offset', () => {
    expect(qrPath([[true]], 0)).toBe('M0 0h1v1h-1z');
  });
});
