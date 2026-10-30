/*
 * QR code encoder, byte mode only, ported from Project Nayuki's
 * QR Code generator library (TypeScript), commit 3c6d0b3c:
 * https://github.com/nayuki/QR-Code-generator
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/qr-code-generator-library
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 *
 * Changes from the original: only byte mode with UTF-8 input, no error
 * correction boost, plain functions instead of namespaced classes. Two
 * changes make it draw exactly the symbol of the backend encoder (segno
 * 1.6, mode="byte", boost_error=False), both readable by any decoder:
 * - padding bits: a whole zero byte follows the terminator when the bit
 *   stream is already byte-aligned (segno's `8 - length % 8`);
 * - mask choice: segno's penalty score, evaluated before the format and
 *   version information are drawn, one N3 hit per 1:1:3:1:1 pattern, and
 *   N4 truncated.
 */

/** Error correction level. */
export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

/** Light modules around the symbol, inside the element's box. */
export const QUIET_ZONE = 4;

const ECC: Record<QrErrorCorrection, { ordinal: number; formatBits: number }> =
  {
    L: { ordinal: 0, formatBits: 1 },
    M: { ordinal: 1, formatBits: 0 },
    Q: { ordinal: 2, formatBits: 3 },
    H: { ordinal: 3, formatBits: 2 },
  };

const MAX_VERSION = 40;
const PENALTY_N2 = 3;
const PENALTY_N3 = 40;
const PENALTY_N4 = 10;
const FINDER_LIKE = [1, 0, 1, 1, 1, 0, 1];

// Index 0 is padding; rows are L, M, Q, H.
// prettier-ignore
const ECC_CODEWORDS_PER_BLOCK: number[][] = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];

// prettier-ignore
const NUM_ERROR_CORRECTION_BLOCKS: number[][] = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];

function appendBits(val: number, len: number, bb: number[]): void {
  for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1);
}

function getBit(x: number, i: number): boolean {
  return ((x >>> i) & 1) !== 0;
}

function numRawDataModules(ver: number): number {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (ver >= 7) result -= 36;
  }
  return result;
}

function numDataCodewords(ver: number, ordinal: number): number {
  return (
    Math.floor(numRawDataModules(ver) / 8) -
    ECC_CODEWORDS_PER_BLOCK[ordinal][ver] *
      NUM_ERROR_CORRECTION_BLOCKS[ordinal][ver]
  );
}

function rsMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsDivisor(degree: number): number[] {
  const result: number[] = new Array(degree - 1).fill(0);
  result.push(1);
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = rsMultiply(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = rsMultiply(root, 0x02);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result: number[] = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => {
      result[i] ^= rsMultiply(coef, factor);
    });
  }
  return result;
}

class QrSymbol {
  readonly version: number;
  readonly size: number;
  readonly modules: boolean[][] = [];
  private readonly ecc: { ordinal: number; formatBits: number };
  private readonly isFunction: boolean[][] = [];
  // Format and version information, light while masks are evaluated.
  private readonly isInfo: boolean[][] = [];

  constructor(
    version: number,
    ecc: { ordinal: number; formatBits: number },
    dataCodewords: number[],
  ) {
    this.version = version;
    this.ecc = ecc;
    this.size = version * 4 + 17;
    for (let i = 0; i < this.size; i++) {
      this.modules.push(new Array(this.size).fill(false));
      this.isFunction.push(new Array(this.size).fill(false));
      this.isInfo.push(new Array(this.size).fill(false));
    }
    this.drawFunctionPatterns();
    this.drawCodewords(this.addEccAndInterleave(dataCodewords));

    let mask = 0;
    let minPenalty = Infinity;
    for (let i = 0; i < 8; i++) {
      this.applyMask(i);
      const penalty = this.penaltyScore();
      if (penalty < minPenalty) {
        mask = i;
        minPenalty = penalty;
      }
      this.applyMask(i);
    }
    this.applyMask(mask);
    this.drawFormatBits(mask);
  }

  private setFunctionModule(x: number, y: number, isDark: boolean): void {
    this.modules[y][x] = isDark;
    this.isFunction[y][x] = true;
  }

  private setInfoModule(x: number, y: number, isDark: boolean): void {
    this.setFunctionModule(x, y, isDark);
    this.isInfo[y][x] = true;
  }

  private drawFunctionPatterns(): void {
    for (let i = 0; i < this.size; i++) {
      this.setFunctionModule(6, i, i % 2 === 0);
      this.setFunctionModule(i, 6, i % 2 === 0);
    }
    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(this.size - 4, 3);
    this.drawFinderPattern(3, this.size - 4);

    const positions = this.alignmentPatternPositions();
    const n = positions.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const corner =
          (i === 0 && j === 0) ||
          (i === 0 && j === n - 1) ||
          (i === n - 1 && j === 0);
        if (!corner) this.drawAlignmentPattern(positions[i], positions[j]);
      }
    }
    this.drawFormatBits(0);
    this.drawVersion();
  }

  private drawFormatBits(mask: number): void {
    const data = (this.ecc.formatBits << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;

    for (let i = 0; i <= 5; i++) this.setInfoModule(8, i, getBit(bits, i));
    this.setInfoModule(8, 7, getBit(bits, 6));
    this.setInfoModule(8, 8, getBit(bits, 7));
    this.setInfoModule(7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i++) this.setInfoModule(14 - i, 8, getBit(bits, i));

    for (let i = 0; i < 8; i++)
      this.setInfoModule(this.size - 1 - i, 8, getBit(bits, i));
    for (let i = 8; i < 15; i++)
      this.setInfoModule(8, this.size - 15 + i, getBit(bits, i));
    this.setInfoModule(8, this.size - 8, true);
  }

  private drawVersion(): void {
    if (this.version < 7) return;
    let rem = this.version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (this.version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const color = getBit(bits, i);
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.setInfoModule(a, b, color);
      this.setInfoModule(b, a, color);
    }
  }

  private drawFinderPattern(x: number, y: number): void {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (0 <= xx && xx < this.size && 0 <= yy && yy < this.size)
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
      }
    }
  }

  private drawAlignmentPattern(x: number, y: number): void {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++)
        this.setFunctionModule(
          x + dx,
          y + dy,
          Math.max(Math.abs(dx), Math.abs(dy)) !== 1,
        );
    }
  }

  private alignmentPatternPositions(): number[] {
    if (this.version === 1) return [];
    const numAlign = Math.floor(this.version / 7) + 2;
    const step =
      Math.floor((this.version * 8 + numAlign * 3 + 5) / (numAlign * 4 - 4)) *
      2;
    const result = [6];
    for (let pos = this.size - 7; result.length < numAlign; pos -= step)
      result.splice(1, 0, pos);
    return result;
  }

  private addEccAndInterleave(data: number[]): number[] {
    const ver = this.version;
    const { ordinal } = this.ecc;
    const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ordinal][ver];
    const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ordinal][ver];
    const rawCodewords = Math.floor(numRawDataModules(ver) / 8);
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);

    const blocks: number[][] = [];
    const divisor = rsDivisor(blockEccLen);
    for (let i = 0, k = 0; i < numBlocks; i++) {
      const dat = data.slice(
        k,
        k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1),
      );
      k += dat.length;
      const ecc = rsRemainder(dat, divisor);
      if (i < numShortBlocks) dat.push(0);
      blocks.push(dat.concat(ecc));
    }

    const result: number[] = [];
    for (let i = 0; i < blocks[0].length; i++) {
      blocks.forEach((block, j) => {
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks)
          result.push(block[i]);
      });
    }
    return result;
  }

  private drawCodewords(data: number[]): void {
    let i = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  }

  private applyMask(mask: number): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let invert: boolean;
        switch (mask) {
          case 0:
            invert = (x + y) % 2 === 0;
            break;
          case 1:
            invert = y % 2 === 0;
            break;
          case 2:
            invert = x % 3 === 0;
            break;
          case 3:
            invert = (x + y) % 3 === 0;
            break;
          case 4:
            invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
            break;
          case 5:
            invert = ((x * y) % 2) + ((x * y) % 3) === 0;
            break;
          case 6:
            invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
            break;
          default:
            invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
        }
        if (!this.isFunction[y][x] && invert)
          this.modules[y][x] = !this.modules[y][x];
      }
    }
  }

  // segno's evaluation: N1 runs of five or more, N2 2x2 blocks, N3
  // 1:1:3:1:1 patterns with four light modules on one side, N4 balance.
  private penaltyScore(): number {
    const size = this.size;
    const rows: number[][] = this.modules.map((row, y) =>
      row.map((dark, x) => (dark && !this.isInfo[y][x] ? 1 : 0)),
    );
    const columns: number[][] = rows[0].map((_, x) => rows.map((r) => r[x]));
    let result = 0;
    let dark = 0;
    for (const line of [...rows, ...columns]) {
      let run = 0;
      for (let i = 0; i < size; i++) {
        if (i > 0 && line[i] === line[i - 1]) {
          run++;
        } else {
          if (run >= 5) result += run - 2;
          run = 1;
        }
      }
      if (run >= 5) result += run - 2;
      result += finderLikeCount(line) * PENALTY_N3;
    }
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        dark += rows[y][x];
        if (
          y > 0 &&
          x > 0 &&
          rows[y][x] === rows[y][x - 1] &&
          rows[y][x] === rows[y - 1][x] &&
          rows[y][x] === rows[y - 1][x - 1]
        )
          result += PENALTY_N2;
      }
    }
    const percent = dark / (size * size);
    result += PENALTY_N4 * Math.trunc(Math.abs(percent * 100 - 50) / 5);
    return result;
  }
}

function findFrom(line: number[], from: number): number {
  for (let i = from; i + FINDER_LIKE.length <= line.length; i++) {
    if (FINDER_LIKE.every((bit, k) => line[i + k] === bit)) return i;
  }
  return -1;
}

function finderLikeCount(line: number[]): number {
  const size = line.length;
  const light = (from: number, to: number): boolean =>
    line.slice(Math.max(from, 0), Math.min(to, size)).every((m) => m === 0);
  let count = 0;
  let idx = findFrom(line, 0);
  while (idx !== -1) {
    let next = idx + 7;
    if (
      idx === 0 ||
      idx === size - 7 ||
      light(idx - 4, idx) ||
      light(next, next + 4)
    ) {
      count++;
    } else {
      next = idx + 4;
    }
    idx = findFrom(line, next);
  }
  return count;
}

/**
 * Encode text as a QR code.
 *
 * @param content Text to encode, as UTF-8 bytes.
 * @param ec Error correction level, never boosted.
 * @returns Rows of modules, `true` for dark, without quiet zone.
 */
export function qrMatrix(content: string, ec: QrErrorCorrection): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(content));
  const ecc = ECC[ec];
  let version = 1;
  for (; ; version++) {
    const countBits = version <= 9 ? 8 : 16;
    const usedBits = 4 + countBits + bytes.length * 8;
    const fits =
      bytes.length < 1 << countBits &&
      usedBits <= numDataCodewords(version, ecc.ordinal) * 8;
    if (fits) break;
    if (version >= MAX_VERSION) throw new RangeError('Data too long');
  }

  const countBits = version <= 9 ? 8 : 16;
  const bb: number[] = [];
  appendBits(0x4, 4, bb);
  appendBits(bytes.length, countBits, bb);
  for (const b of bytes) appendBits(b, 8, bb);

  const capacityBits = numDataCodewords(version, ecc.ordinal) * 8;
  appendBits(0, Math.min(4, capacityBits - bb.length), bb);
  appendBits(0, 8 - (bb.length % 8), bb);
  // A full symbol has no room for that extra byte.
  bb.length = Math.min(bb.length, capacityBits);
  for (let pad = 0xec; bb.length < capacityBits; pad ^= 0xec ^ 0x11)
    appendBits(pad, 8, bb);

  const codewords: number[] = new Array(bb.length / 8).fill(0);
  bb.forEach((b, i) => {
    codewords[i >>> 3] |= b << (7 - (i & 7));
  });
  return new QrSymbol(version, ecc, codewords).modules;
}

/**
 * Draw dark modules as one SVG path, a rectangle per horizontal run.
 *
 * @param matrix Module rows.
 * @param offset Shift applied to both axes, in modules.
 * @returns Path data such as `M4 4h7v1h-7z`.
 */
export function qrPath(matrix: boolean[][], offset = QUIET_ZONE): string {
  const parts: string[] = [];
  matrix.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < row.length && row[x]) x++;
      const run = x - start;
      parts.push(`M${start + offset} ${y + offset}h${run}v1h-${run}z`);
    }
  });
  return parts.join('');
}
