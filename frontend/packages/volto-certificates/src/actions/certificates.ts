import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import type { Blueprint } from '../blueprint/model';

export const GET_CERTIFICATE_VOCABULARIES = 'GET_CERTIFICATE_VOCABULARIES';
export const VALIDATE_BLUEPRINT = 'VALIDATE_BLUEPRINT';
export const GET_CERTIFICATE_VERIFICATION = 'GET_CERTIFICATE_VERIFICATION';
export const GET_CERTIFICATES_CSV = 'GET_CERTIFICATES_CSV';
export const CREATE_CERTIFICATES = 'CREATE_CERTIFICATES';

/**
 * Ask the site for the details of an issued certificate
 * (`@certificate-verification`, public, 404 when unknown).
 *
 * @param uid The certificate's UID, as its verification URL has it.
 */
export function getCertificateVerification(uid: string) {
  return {
    type: GET_CERTIFICATE_VERIFICATION,
    request: {
      op: 'get',
      path: `/@certificate-verification/${uid}`,
    },
  };
}

/** Vocabularies the designer reads, in the order of the request. */
export const VOCABULARIES = [
  'collective.certificates.Fonts',
  'collective.certificates.Fields',
  'collective.certificates.FieldKinds',
  'collective.certificates.QrErrorCorrection',
] as const;

/** Load fonts, fields, field kinds and QR levels in one action. */
export function getCertificateVocabularies() {
  return {
    type: GET_CERTIFICATE_VOCABULARIES,
    request: VOCABULARIES.map((name) => ({
      op: 'get',
      path: `/@vocabularies/${name}?b_size=-1`,
    })),
  };
}

/**
 * Ask a template whether a blueprint is valid for it (`@validate-blueprint`).
 *
 * @param url The template's URL.
 */
export function validateBlueprint(url: string, blueprint: Blueprint) {
  return {
    type: VALIDATE_BLUEPRINT,
    request: {
      op: 'post',
      path: `${flattenToAppURL(url)}/@validate-blueprint`,
      data: { blueprint },
    },
  };
}

/**
 * Ask a template for a CSV file to fill in with the certificates' data
 * (`@certificates-csv`).
 *
 * @param url The template's URL.
 */
export function getCertificatesCsv(url: string) {
  return {
    type: GET_CERTIFICATES_CSV,
    request: {
      op: 'get',
      path: `${flattenToAppURL(url)}/@certificates-csv`,
    },
  };
}

/**
 * Create one certificate per row of a CSV file (`@create-certificates`).
 * All or nothing: a file with any problem creates nothing.
 *
 * @param url The template's URL.
 * @param csv The text of the CSV file.
 */
export function createCertificates(url: string, csv: string) {
  return {
    type: CREATE_CERTIFICATES,
    request: {
      op: 'post',
      path: `${flattenToAppURL(url)}/@create-certificates`,
      data: { csv },
    },
  };
}
