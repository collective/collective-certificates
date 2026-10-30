/**
 * Blueprint validation: the JSON Schema, then semantic checks.
 *
 * The same checks as the backend's `blueprint/validate.py`, producing the
 * same `(element, path)` pairs for the shared invalid fixtures. The schema
 * part interprets `schema.json` itself, for the keywords it uses, the way
 * the backend's `jsonschema` does: every keyword is evaluated, errors
 * point at the instance location, and they are sorted by path.
 */

import schema from './schema.json';
import { FILTERS, TemplateSyntaxError, placeholders } from './template';
import type { Blueprint, Element, ValidationIssue } from './model';

type Json = unknown;
type Schema = Record<string, Json>;
type Path = (string | number)[];

interface SchemaError {
  path: Path;
  detail: string;
}

/** What a blueprint is checked against besides the schema. */
export interface ValidationContext {
  /** Known font tokens. */
  fonts: ReadonlySet<string>;
  /** Kind of each field token (`text`, `date`, `computed`). */
  fieldKinds: Readonly<Record<string, string>>;
  /** `[width, height]` of the background, when known. */
  background?: readonly [number, number] | null;
  /** Image fields that have an image, when known. */
  assets?: ReadonlySet<string> | null;
  /** Also check the page size and that elements fit; default `true`. */
  checkLayout?: boolean;
}

const ROOT = schema as Schema;

const isObject = (value: Json): value is Record<string, Json> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNumber = (value: Json): value is number => typeof value === 'number';

const codePoints = (value: string): number => [...value].length;

function equal(a: Json, b: Json): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => equal(item, b[i]));
  }
  if (isObject(a) && isObject(b)) {
    const keys = Object.keys(a);
    return (
      keys.length === Object.keys(b).length &&
      keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]))
    );
  }
  return a === b;
}

function hasType(value: Json, type: string): boolean {
  switch (type) {
    case 'object':
      return isObject(value);
    case 'array':
      return Array.isArray(value);
    case 'string':
      return typeof value === 'string';
    case 'integer':
      return isNumber(value) && Number.isInteger(value);
    case 'number':
      return isNumber(value);
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return value === null;
  }
}

const patterns = new Map<string, RegExp>();

// Python's `re.search`: `$` also matches before a final newline.
function pattern(source: string): RegExp {
  let regexp = patterns.get(source);
  if (regexp === undefined) {
    const python = source.endsWith('$')
      ? `${source.slice(0, -1)}(?=\\n?$)`
      : source;
    regexp = new RegExp(python, 'u');
    patterns.set(source, regexp);
  }
  return regexp;
}

function resolve(ref: string): Schema {
  const parts = ref.replace(/^#\//, '').split('/');
  let node: Json = ROOT;
  for (const part of parts) node = (node as Schema)[part];
  return node as Schema;
}

function errorsFor(value: Json, node: Schema, path: Path): SchemaError[] {
  const errors: SchemaError[] = [];
  const fail = (detail: string, at: Path = path) =>
    errors.push({ path: at, detail });

  for (const [keyword, arg] of Object.entries(node)) {
    switch (keyword) {
      case '$ref':
        errors.push(...errorsFor(value, resolve(arg as string), path));
        break;
      case 'type':
        if (!hasType(value, arg as string))
          fail(`${JSON.stringify(value)} is not of type '${arg}'`);
        break;
      case 'const':
        if (!equal(value, arg)) fail(`${JSON.stringify(arg)} was expected`);
        break;
      case 'enum':
        if (!(arg as Json[]).some((option) => equal(value, option)))
          fail(`${JSON.stringify(value)} is not one of ${JSON.stringify(arg)}`);
        break;
      case 'minimum':
        if (isNumber(value) && value < (arg as number))
          fail(`${value} is less than the minimum of ${arg}`);
        break;
      case 'maximum':
        if (isNumber(value) && value > (arg as number))
          fail(`${value} is greater than the maximum of ${arg}`);
        break;
      case 'minLength':
        if (typeof value === 'string' && codePoints(value) < (arg as number))
          fail(`${JSON.stringify(value)} is too short`);
        break;
      case 'maxLength':
        if (typeof value === 'string' && codePoints(value) > (arg as number))
          fail(`${JSON.stringify(value)} is too long`);
        break;
      case 'pattern':
        if (typeof value === 'string' && !pattern(arg as string).test(value))
          fail(`${JSON.stringify(value)} does not match '${arg}'`);
        break;
      case 'maxItems':
        if (Array.isArray(value) && value.length > (arg as number))
          fail('Too many items');
        break;
      case 'items':
        if (Array.isArray(value))
          value.forEach((item, i) =>
            errors.push(...errorsFor(item, arg as Schema, [...path, i])),
          );
        break;
      case 'required':
        if (isObject(value))
          for (const name of arg as string[])
            if (!Object.hasOwn(value, name))
              fail(`'${name}' is a required property`);
        break;
      case 'properties':
        if (isObject(value))
          for (const [name, sub] of Object.entries(arg as Schema))
            if (Object.hasOwn(value, name))
              errors.push(
                ...errorsFor(value[name], sub as Schema, [...path, name]),
              );
        break;
      case 'additionalProperties': {
        if (arg !== false || !isObject(value)) break;
        const known = Object.keys((node.properties as Schema) ?? {});
        const extra = Object.keys(value).filter((key) => !known.includes(key));
        if (extra.length > 0)
          fail(`Additional properties are not allowed (${extra.join(', ')})`);
        break;
      }
      case 'allOf':
        for (const sub of arg as Schema[])
          errors.push(...errorsFor(value, sub, path));
        break;
      case 'if':
        if (
          errorsFor(value, arg as Schema, path).length === 0 &&
          node.then !== undefined
        )
          errors.push(...errorsFor(value, node.then as Schema, path));
        break;
      default:
        // Annotations ($schema, $id, title, description, $defs, then).
        break;
    }
  }
  return errors;
}

/**
 * Build a JSON pointer.
 *
 * @returns The pointer, `""` for the document root.
 */
export function pointer(parts: Path): string {
  return parts
    .map((part) => `/${String(part).replace(/~/g, '~0').replace(/\//g, '~1')}`)
    .join('');
}

// Python sorts the paths as lists of strings.
function comparePaths(a: Path, b: Path): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const x = String(a[i]);
    const y = String(b[i]);
    if (x !== y) return x < y ? -1 : 1;
  }
  return a.length - b.length;
}

function elementId(blueprint: Json, parts: Path): string | null {
  if (parts.length < 2 || parts[0] !== 'elements' || !isNumber(parts[1]))
    return null;
  const element = (blueprint as { elements: Json[] }).elements[parts[1]];
  const value = isObject(element) ? element.id : undefined;
  return typeof value === 'string' ? value : null;
}

function issue(
  element: string | null,
  path: string,
  code: string,
  values: Record<string, string | number> = {},
): ValidationIssue {
  return { element, path, code, values };
}

/**
 * Check a blueprint against `schema.json`.
 *
 * @param blueprint Decoded JSON.
 * @returns One issue per schema error, ordered by path.
 */
export function schemaIssues(blueprint: Json): ValidationIssue[] {
  return errorsFor(blueprint, ROOT, [])
    .map((error, index) => ({ error, index }))
    .sort(
      (a, b) => comparePaths(a.error.path, b.error.path) || a.index - b.index,
    )
    .map(({ error }) =>
      issue(
        elementId(blueprint, error.path),
        pointer(error.path),
        'error_schema',
        { path: pointer(error.path) || '/', detail: error.detail },
      ),
    );
}

function contentIssues(
  element: Element & { content: string },
  index: number,
  fieldKinds: Readonly<Record<string, string>>,
): ValidationIssue[] {
  const path = `/elements/${index}/content`;
  const eid = element.id;
  let found;
  try {
    found = placeholders(element.content);
  } catch (error) {
    if (!(error instanceof TemplateSyntaxError)) throw error;
    return [
      issue(eid, path, 'error_placeholder_syntax', {
        element: eid,
        detail: error.message,
      }),
    ];
  }
  const issues: ValidationIssue[] = [];
  for (const placeholder of found) {
    const kind = Object.hasOwn(fieldKinds, placeholder.token)
      ? fieldKinds[placeholder.token]
      : null;
    if (kind === null) {
      issues.push(
        issue(eid, path, 'error_unknown_token', {
          element: eid,
          token: placeholder.token,
        }),
      );
    }
    if (
      placeholder.filter !== null &&
      !(FILTERS as readonly string[]).includes(placeholder.filter)
    ) {
      issues.push(
        issue(eid, path, 'error_unknown_filter', {
          element: eid,
          filter: placeholder.filter,
        }),
      );
    }
    if (placeholder.filter === 'date' && kind !== null && kind !== 'date') {
      issues.push(
        issue(eid, path, 'error_date_filter', {
          element: eid,
          token: placeholder.token,
        }),
      );
    }
  }
  return issues;
}

/**
 * Return the far corner an element needs on the page: the bottom-right
 * corner of images and QR codes, the anchor point of text, whose extent
 * depends on the font.
 */
export function bounds(element: Element): [number, number] {
  if (element.type === 'image')
    return [element.x + element.width, element.y + element.height];
  if (element.type === 'qrcode')
    return [element.x + element.size, element.y + element.size];
  return [element.x, element.y];
}

/**
 * Check a schema-valid blueprint against a template's context.
 *
 * @returns Issues in element order; page-level ones first.
 */
export function semanticIssues(
  blueprint: Blueprint,
  context: ValidationContext,
): ValidationIssue[] {
  const { fonts, fieldKinds, background, assets } = context;
  const checkLayout = context.checkLayout ?? true;
  const issues: ValidationIssue[] = [];
  const { page } = blueprint;
  if (
    checkLayout &&
    background &&
    (page.width !== background[0] || page.height !== background[1])
  ) {
    issues.push(
      issue(null, '/page', 'error_page_size', {
        page_width: page.width,
        page_height: page.height,
        width: background[0],
        height: background[1],
      }),
    );
  }
  const seen = new Set<string>();
  blueprint.elements.forEach((element, index) => {
    const eid = element.id;
    if (seen.has(eid)) {
      issues.push(
        issue(eid, `/elements/${index}/id`, 'error_duplicate_id', {
          element: eid,
        }),
      );
    }
    seen.add(eid);
    if (element.type === 'text' && !fonts.has(element.font)) {
      issues.push(
        issue(eid, `/elements/${index}/font`, 'error_unknown_font', {
          element: eid,
          font: element.font,
        }),
      );
    }
    if (element.type === 'text' || element.type === 'qrcode') {
      issues.push(...contentIssues(element, index, fieldKinds));
    }
    if (element.type === 'image' && assets && !assets.has(element.asset)) {
      issues.push(
        issue(eid, `/elements/${index}/asset`, 'error_missing_asset', {
          element: eid,
          asset: element.asset,
        }),
      );
    }
    const [right, bottom] = bounds(element);
    if (checkLayout && (right > page.width || bottom > page.height)) {
      issues.push(
        issue(eid, `/elements/${index}`, 'error_outside_page', {
          element: eid,
        }),
      );
    }
  });
  return issues;
}

/**
 * Validate a blueprint completely.
 *
 * @param blueprint Decoded JSON.
 * @returns Schema issues when there are any (semantic checks need a
 *   schema-valid document), else the semantic issues. Empty when valid.
 */
export function validate(
  blueprint: Json,
  context: ValidationContext,
): ValidationIssue[] {
  const found = schemaIssues(blueprint);
  if (found.length > 0) return found;
  return semanticIssues(blueprint as Blueprint, context);
}
