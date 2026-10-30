import { describe, expect, it } from 'vitest';
import { BLUEPRINTS, VALIDATION_CONTEXT } from '../testing/fixtures';
import { emptyBlueprint } from './model';
import {
  DUPLICATE_OFFSET,
  HISTORY_LIMIT,
  addElement,
  dropUndefined,
  duplicateElement,
  findElement,
  fitPageToBackground,
  idProblem,
  initHistory,
  moveElement,
  newElement,
  nudgeElement,
  pushHistory,
  redo,
  removeElement,
  renameElement,
  reorderElement,
  undo,
  uniqueId,
  updateElement,
} from './ops';
import { validate } from './validate';
import type { Blueprint, ElementType } from './model';

const sample = BLUEPRINTS.sample;
const ids = (blueprint: Blueprint) => blueprint.elements.map((e) => e.id);

describe('uniqueId', () => {
  it('keeps a free id and numbers a taken one', () => {
    const blueprint = addElement(
      emptyBlueprint(),
      newElement(emptyBlueprint(), 'text'),
    );
    expect(uniqueId(blueprint, 'image')).toBe('image');
    expect(uniqueId(blueprint, 'text')).toBe('text-2');
  });

  it('stays within 32 characters', () => {
    const long = 'a'.repeat(32);
    const blueprint = addElement(emptyBlueprint(), {
      ...newElement(emptyBlueprint(), 'qrcode'),
      id: long,
    });
    const id = uniqueId(blueprint, long);
    expect(id).toBe(`${'a'.repeat(30)}-2`);
    expect(id).toHaveLength(32);
  });
});

describe('newElement', () => {
  it.each(['text', 'image', 'qrcode'] as ElementType[])(
    'makes a valid %s on the page',
    (type) => {
      const blueprint = addElement(
        emptyBlueprint(),
        newElement(emptyBlueprint(), type),
      );
      expect(validate(blueprint, VALIDATION_CONTEXT)).toEqual([]);
    },
  );

  it('shows the background unless given another asset', () => {
    const plain = newElement(emptyBlueprint(), 'image');
    expect(plain.type === 'image' && plain.asset).toBe('background');
    const signed = newElement(emptyBlueprint(), 'image', 'inter', 'signature');
    expect(signed.type === 'image' && signed.asset).toBe('signature');
  });

  it('uses the given font for text', () => {
    const element = newElement(emptyBlueprint(), 'text', 'caveat');
    expect(element.type === 'text' && element.font).toBe('caveat');
  });

  it('gives the second element of a type a new id', () => {
    const one = addElement(
      emptyBlueprint(),
      newElement(emptyBlueprint(), 'qrcode'),
    );
    expect(newElement(one, 'qrcode').id).toBe('qr-2');
  });
});

describe('element operations', () => {
  it('do not change their input', () => {
    const before = JSON.stringify(sample);
    updateElement(sample, 'name', { size: 1 });
    removeElement(sample, 'name');
    duplicateElement(sample, 'name');
    moveElement(sample, 'name', 1, 1);
    reorderElement(sample, 'name', 1);
    renameElement(sample, 'name', 'other');
    fitPageToBackground(sample, 1, 1);
    expect(JSON.stringify(sample)).toBe(before);
  });

  it('update changes fields but never id or type', () => {
    const result = updateElement(sample, 'name', {
      size: 99,
      id: 'x',
      type: 'image',
    } as never);
    const name = findElement(result, 'name');
    expect(name).toMatchObject({ id: 'name', type: 'text', size: 99 });
  });

  it('update removes a field set to undefined, keeping the element valid', () => {
    const result = updateElement(sample, 'name', {
      max_width: undefined,
      fit: undefined,
    });
    const name = findElement(result, 'name');
    expect(name && 'max_width' in name).toBe(false);
    expect(name && 'fit' in name).toBe(false);
    expect(validate(result, VALIDATION_CONTEXT)).toEqual([]);
  });

  it('remove drops only that element', () => {
    const result = removeElement(sample, 'name');
    expect(ids(result)).toEqual(ids(sample).filter((id) => id !== 'name'));
  });

  it('duplicate inserts an offset copy right after the original', () => {
    const [result, copyId] = duplicateElement(sample, 'name');
    const index = ids(result).indexOf('name');
    expect(ids(result)[index + 1]).toBe(copyId);
    expect(copyId).toBe('name-2');
    const original = findElement(sample, 'name');
    const copy = findElement(result, copyId);
    expect(copy?.x).toBe((original?.x ?? 0) + DUPLICATE_OFFSET);
    expect(copy?.y).toBe((original?.y ?? 0) + DUPLICATE_OFFSET);
    expect(validate(result, VALIDATION_CONTEXT)).toEqual([]);
  });

  it('duplicate of an unknown id changes nothing', () => {
    expect(duplicateElement(sample, 'nope')).toEqual([sample, null]);
  });

  it('move rounds and keeps coordinates on the page', () => {
    const result = moveElement(sample, 'name', -5.4, 10.6);
    expect(findElement(result, 'name')).toMatchObject({ x: 0, y: 11 });
  });

  it('nudge moves by a delta and ignores unknown ids', () => {
    const before = findElement(sample, 'name');
    const result = nudgeElement(sample, 'name', 10, -10);
    expect(findElement(result, 'name')).toMatchObject({
      x: (before?.x ?? 0) + 10,
      y: (before?.y ?? 0) - 10,
    });
    expect(nudgeElement(sample, 'nope', 1, 1)).toBe(sample);
  });

  it('reorder swaps with the neighbour, and stops at the ends', () => {
    const [first, second] = ids(sample);
    expect(ids(reorderElement(sample, first, 1)).slice(0, 2)).toEqual([
      second,
      first,
    ]);
    expect(reorderElement(sample, first, -1)).toBe(sample);
    const last = ids(sample)[ids(sample).length - 1];
    expect(reorderElement(sample, last, 1)).toBe(sample);
    expect(reorderElement(sample, 'nope', 1)).toBe(sample);
  });

  it('rename accepts a free valid id only', () => {
    expect(ids(renameElement(sample, 'name', 'full'))).toContain('full');
    expect(renameElement(sample, 'name', 'Bad Id')).toBe(sample);
    expect(renameElement(sample, 'name', ids(sample)[0])).toBe(sample);
  });

  it('idProblem explains a refused id', () => {
    expect(idProblem(sample, 'Bad', 'name')).toBe('invalid');
    expect(idProblem(sample, ids(sample)[0], 'name')).toBe('taken');
    expect(idProblem(sample, 'name', 'name')).toBeNull();
    expect(idProblem(sample, 'fresh', 'name')).toBeNull();
  });

  it('fitPageToBackground rewrites the page only', () => {
    const result = fitPageToBackground(sample, 1000, 700);
    expect(result.page).toEqual({ width: 1000, height: 700 });
    expect(result.elements).toBe(sample.elements);
  });

  it('dropUndefined removes cleared optional fields', () => {
    expect(dropUndefined({ a: 1, b: undefined })).toEqual({ a: 1 });
  });
});

describe('history', () => {
  const a = emptyBlueprint(100, 100);
  const b = emptyBlueprint(200, 200);
  const c = emptyBlueprint(300, 300);

  it('undoes and redoes in order', () => {
    let history = pushHistory(pushHistory(initHistory(a), b), c);
    history = undo(history);
    expect(history.present).toBe(b);
    history = undo(history);
    expect(history.present).toBe(a);
    expect(undo(history)).toBe(history);
    history = redo(redo(history));
    expect(history.present).toBe(c);
    expect(redo(history)).toBe(history);
  });

  it('a new change clears redo', () => {
    const history = pushHistory(undo(pushHistory(initHistory(a), b)), c);
    expect(history.future).toEqual([]);
    expect(history.past).toEqual([a]);
  });

  it('ignores a change that returns the same blueprint', () => {
    const history = initHistory(a);
    expect(pushHistory(history, a)).toBe(history);
  });

  it(`keeps at most ${HISTORY_LIMIT} undo steps`, () => {
    let history = initHistory(a);
    for (let i = 0; i < HISTORY_LIMIT + 10; i++)
      history = pushHistory(history, emptyBlueprint(i + 1, 1));
    expect(history.past).toHaveLength(HISTORY_LIMIT);
  });
});
