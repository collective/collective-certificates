/**
 * The context of the shared fixtures, for tests: see the backend's
 * `scripts/update_fixtures.py`.
 */

import context from '../../__fixtures__/contract-context.json';
import type { Blueprint, FieldData, TextElement } from '../blueprint/model';
import type { SizeFunction } from '../blueprint/svg';
import type { ValidationContext } from '../blueprint/validate';

import every from '../../__fixtures__/blueprints/every-element.json';
import minimal from '../../__fixtures__/blueprints/minimal.json';
import sample from '../../__fixtures__/blueprints/sample.json';

export const BLUEPRINTS: Record<string, Blueprint> = {
  sample: sample as Blueprint,
  minimal: minimal as Blueprint,
  'every-element': every as Blueprint,
};

/** Every field's sample, computed ones included. */
export const DATA: FieldData = Object.fromEntries(
  Object.entries(context.fields).map(([token, field]) => [token, field.sample]),
);

export const FIELD_KINDS: Record<string, string> = Object.fromEntries(
  Object.entries(context.fields).map(([token, field]) => [token, field.kind]),
);

export const GOLDEN_ASSETS: Record<string, string> = context.golden_assets;

export const VALIDATION_CONTEXT: ValidationContext = {
  fonts: new Set(context.fonts),
  fieldKinds: FIELD_KINDS,
  background: [context.page[0], context.page[1]],
  assets: new Set(context.assets),
};

/** Size function drawing each golden's text at the server's size. */
export function goldenSize(name: string): SizeFunction {
  const sizes = (
    context.golden_sizes as Record<string, Record<string, number>>
  )[name];
  return (element: TextElement) => sizes[element.id];
}
