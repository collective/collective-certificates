import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import schema from './schema.json';
import {
  ANCHORS,
  BASELINES,
  ELEMENT_TYPES,
  ERROR_CORRECTIONS,
  FITS,
} from './model';
import type { ImageElement, QrElement, TextElement } from './model';

const defs = schema.$defs;

// Every key of each element interface, as a value the compiler checks:
// a key missing here, or one the interface lacks, fails `make typecheck`.
const TEXT_KEYS: Record<keyof TextElement, true> = {
  id: true,
  type: true,
  x: true,
  y: true,
  anchor: true,
  baseline: true,
  font: true,
  size: true,
  color: true,
  content: true,
  rotation: true,
  max_width: true,
  fit: true,
};
const IMAGE_KEYS: Record<keyof ImageElement, true> = {
  id: true,
  type: true,
  x: true,
  y: true,
  width: true,
  height: true,
  asset: true,
  rotation: true,
};
const QR_KEYS: Record<keyof QrElement, true> = {
  id: true,
  type: true,
  x: true,
  y: true,
  size: true,
  content: true,
  ec: true,
  fg: true,
  bg: true,
  rotation: true,
};

describe('schema.json', () => {
  it('is byte-identical to the backend', () => {
    const backend = path.resolve(
      __dirname,
      '../../../../../backend/src/collective/certificates/blueprint/schema.json',
    );
    expect(readFileSync(path.join(__dirname, 'schema.json'))).toEqual(
      readFileSync(backend),
    );
  });
});

describe('model.ts follows the schema', () => {
  it('names an image by the background or an item id', () => {
    expect(defs.image.properties.asset.$ref).toBe('#/$defs/asset');
    const pattern = new RegExp(defs.asset.pattern);
    for (const ok of ['background', 'signature', 'logo.png', 'Signature_2'])
      expect(pattern.test(ok)).toBe(true);
    for (const bad of ['', '../x', '.hidden', 'a b'])
      expect(pattern.test(bad)).toBe(false);
  });

  it('has the enums of the schema', () => {
    expect(defs.element.properties.type.enum).toEqual([...ELEMENT_TYPES]);
    expect(defs.text.properties.anchor.enum).toEqual([...ANCHORS]);
    expect(defs.text.properties.baseline.enum).toEqual([...BASELINES]);
    expect(defs.text.properties.fit.enum).toEqual([...FITS]);
    expect(defs.qrcode.properties.ec.enum).toEqual([...ERROR_CORRECTIONS]);
  });

  it.each([
    ['text', TEXT_KEYS],
    ['image', IMAGE_KEYS],
    ['qrcode', QR_KEYS],
  ] as const)('the %s element has the schema properties', (name, keys) => {
    expect(Object.keys(defs[name].properties).sort()).toEqual(
      Object.keys(keys).sort(),
    );
  });

  it('has a version 1 blueprint of page and elements', () => {
    expect(schema.properties.version.const).toBe(1);
    expect(schema.required).toEqual(['version', 'page', 'elements']);
    expect(defs.page.required).toEqual(['width', 'height']);
  });
});
