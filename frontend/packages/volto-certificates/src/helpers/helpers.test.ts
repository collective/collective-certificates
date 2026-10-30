import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import config from '@plone/volto/registry';
import { BLUEPRINTS } from '../testing/fixtures';
import { emptyBlueprint } from '../blueprint/model';
import { fontFaceCss, fontUrl } from './fontUrl';
import { imageSource, naturalSize, templateImages } from './image';
import { commandFor, isTypingTarget } from './keyboard';
import { clampToPage, elementBox, snap, toPage } from './snapping';
import type { Blueprint } from '../blueprint/model';
import type { KeyInput } from './keyboard';

describe('fontUrl', () => {
  let apiPath: string;

  beforeEach(() => {
    apiPath = config.settings.apiPath;
    config.settings.apiPath = 'http://localhost:3000';
  });

  afterEach(() => {
    config.settings.apiPath = apiPath;
  });

  it('points at the backend font view', () => {
    expect(fontUrl('eb-garamond')).toMatch(
      /^http:\/\/localhost:3000(\/\+\+api\+\+)?\/@@certificate-font\/eb-garamond$/,
    );
  });

  it('declares one family per token', () => {
    const css = fontFaceCss(['inter', 'caveat']);
    expect(css.split('\n')).toHaveLength(2);
    expect(css).toContain('font-family: "caveat"');
    expect(css).toContain(`url("${fontUrl('inter')}")`);
  });
});

describe('imageSource', () => {
  it('draws an upload as a data URL, size unknown', () => {
    expect(
      imageSource({
        data: 'AAAA',
        encoding: 'base64',
        'content-type': 'image/png',
        filename: 'bg.png',
      }),
    ).toEqual({ url: 'data:image/png;base64,AAAA' });
  });

  it('draws a stored image from its download URL, with its size', () => {
    const settings = config.settings;
    expect(
      imageSource({
        download: `${settings.apiPath}/tpl/@@download/background`,
        width: 3508,
        height: 2480,
      }),
    ).toEqual({ url: '/tpl/@@download/background', width: 3508, height: 2480 });
  });

  it('is null for an empty or unknown value', () => {
    expect(imageSource(null)).toBeNull();
    expect(imageSource(undefined)).toBeNull();
    expect(imageSource({} as never)).toBeNull();
  });
});

describe('templateImages', () => {
  it('keeps the Image items, by id, with their addresses', () => {
    const api = config.settings.apiPath;
    expect(
      templateImages([
        {
          '@id': `${api}/tpl/signature`,
          '@type': 'Image',
          id: 'signature',
          title: 'Signature',
        },
        { '@id': `${api}/tpl/notes`, '@type': 'Document', id: 'notes' },
        { '@id': `${api}/tpl/logo.png`, '@type': 'Image' },
      ]),
    ).toEqual([
      {
        id: 'signature',
        title: 'Signature',
        href: '/tpl/signature',
        url: '/tpl/signature/@@images/image',
      },
      {
        id: 'logo.png',
        title: 'logo.png',
        href: '/tpl/logo.png',
        url: '/tpl/logo.png/@@images/image',
      },
    ]);
  });

  it('is empty without items', () => {
    expect(templateImages(undefined)).toEqual([]);
    expect(templateImages(null)).toEqual([]);
  });
});

describe('naturalSize', () => {
  const OriginalImage = globalThis.Image;

  afterEach(() => {
    globalThis.Image = OriginalImage;
  });

  const fakeImage = (ok: boolean) =>
    class {
      naturalWidth = 640;
      naturalHeight = 480;
      onload: () => void = () => {};
      onerror: () => void = () => {};
      set src(_value: string) {
        setTimeout(() => (ok ? this.onload() : this.onerror()));
      }
    } as unknown as typeof Image;

  it('resolves with the loaded size', async () => {
    globalThis.Image = fakeImage(true);
    await expect(naturalSize('x.png')).resolves.toEqual([640, 480]);
  });

  it('rejects when the image does not load', async () => {
    globalThis.Image = fakeImage(false);
    await expect(naturalSize('x.png')).rejects.toThrow('x.png');
  });
});

describe('commandFor', () => {
  const key = (k: string, extra: Partial<KeyInput> = {}): KeyInput => ({
    key: k,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    ...extra,
  });

  it.each([
    [key('Delete'), { type: 'delete' }],
    [key('Backspace'), { type: 'delete' }],
    [key('z', { ctrlKey: true }), { type: 'undo' }],
    [key('Z', { metaKey: true, shiftKey: true }), { type: 'redo' }],
    [key('d', { ctrlKey: true }), { type: 'duplicate' }],
    [key('+'), { type: 'zoomIn' }],
    [key('='), { type: 'zoomIn' }],
    [key('-'), { type: 'zoomOut' }],
    [key('Escape'), { type: 'cancel' }],
    [key('ArrowLeft'), { type: 'nudge', dx: -2, dy: 0 }],
    [key('ArrowDown', { shiftKey: true }), { type: 'nudge', dx: 0, dy: 20 }],
  ])('maps %o', (input, command) => {
    expect(commandFor(input, 2)).toEqual(command);
  });

  it('ignores other keys and other shortcuts', () => {
    expect(commandFor(key('a'))).toBeNull();
    expect(commandFor(key('s', { ctrlKey: true }))).toBeNull();
    expect(commandFor(key('Delete', { ctrlKey: true }))).toBeNull();
  });
});

describe('isTypingTarget', () => {
  it('is true for form controls and editable content', () => {
    for (const tag of ['input', 'textarea', 'select']) {
      expect(isTypingTarget(document.createElement(tag))).toBe(true);
    }
    const div = document.createElement('div');
    Object.defineProperty(div, 'isContentEditable', { value: true });
    expect(isTypingTarget(div)).toBe(true);
  });

  it('is false for anything else', () => {
    expect(isTypingTarget(document.createElement('div'))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe('snapping', () => {
  const blueprint: Blueprint = {
    ...emptyBlueprint(1000, 800),
    elements: [
      {
        id: 'logo',
        type: 'image',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        asset: 'background',
      },
    ],
  };

  it('snaps an edge to another element within the tolerance', () => {
    const result = snap(
      { x: 305, y: 400, width: 50, height: 50 },
      blueprint,
      'moving',
      10,
    );
    expect(result.x).toBe(300);
    expect(result.guides.vertical).toEqual([300]);
  });

  it('snaps a center to the page center', () => {
    const result = snap(
      { x: 470, y: 600, width: 50, height: 50 },
      blueprint,
      'moving',
      10,
    );
    expect(result.x).toBe(475);
    expect(result.guides.vertical).toEqual([500]);
  });

  it('leaves a box alone outside the tolerance', () => {
    const result = snap(
      { x: 640, y: 450, width: 50, height: 50 },
      blueprint,
      'moving',
      10,
    );
    expect(result).toEqual({
      x: 640,
      y: 450,
      guides: { vertical: [], horizontal: [] },
    });
  });

  it('ignores the element being moved', () => {
    const result = snap(
      { x: 105, y: 450, width: 50, height: 50 },
      blueprint,
      'logo',
      10,
    );
    expect(result.x).toBe(105);
  });

  it('elementBox gives image, QR and text boxes', () => {
    const [image] = blueprint.elements;
    expect(elementBox(image)).toEqual({
      x: 100,
      y: 100,
      width: 200,
      height: 100,
    });
    const qr = BLUEPRINTS.sample.elements.find((e) => e.type === 'qrcode');
    const text = BLUEPRINTS.sample.elements.find((e) => e.type === 'text');
    if (qr?.type !== 'qrcode' || !text) throw new Error('sample changed');
    expect(elementBox(qr)).toEqual({
      x: qr.x,
      y: qr.y,
      width: qr.size,
      height: qr.size,
    });
    expect(elementBox(text)).toEqual({
      x: text.x,
      y: text.y,
      width: 0,
      height: 0,
    });
  });

  it('toPage and clampToPage convert and clamp', () => {
    expect(toPage(50, 0.5)).toBe(100);
    expect(clampToPage(-3.2, 7.6)).toEqual([0, 8]);
  });
});
