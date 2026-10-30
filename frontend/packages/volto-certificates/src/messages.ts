import { defineMessages } from 'react-intl';

/** Every user-visible string of the widget and the designer. */
const messages = defineMessages({
  openDesigner: {
    id: 'certificates.openDesigner',
    defaultMessage: 'Open designer',
  },
  uploadBackgroundFirst: {
    id: 'certificates.uploadBackgroundFirst',
    defaultMessage: 'Upload a background first.',
  },
  noPreview: {
    id: 'certificates.noPreview',
    defaultMessage: 'The preview cannot be drawn: {detail}',
  },
  elementsCount: {
    id: 'certificates.elementsCount',
    defaultMessage:
      '{count, plural, =0 {No elements} one {# element} other {# elements}}',
  },
  designer: {
    id: 'certificates.designer',
    defaultMessage: 'Certificate designer',
  },
  apply: { id: 'certificates.apply', defaultMessage: 'Apply' },
  applying: { id: 'certificates.applying', defaultMessage: 'Checking…' },
  cancel: { id: 'certificates.cancel', defaultMessage: 'Cancel' },
  confirmDiscard: {
    id: 'certificates.confirmDiscard',
    defaultMessage: 'Discard the changes made in the designer?',
  },
  addText: { id: 'certificates.addText', defaultMessage: 'Add text' },
  addImage: { id: 'certificates.addImage', defaultMessage: 'Add image' },
  addQr: { id: 'certificates.addQr', defaultMessage: 'Add QR code' },
  undo: { id: 'certificates.undo', defaultMessage: 'Undo' },
  redo: { id: 'certificates.redo', defaultMessage: 'Redo' },
  duplicate: { id: 'certificates.duplicate', defaultMessage: 'Duplicate' },
  delete: { id: 'certificates.delete', defaultMessage: 'Delete' },
  zoomIn: { id: 'certificates.zoomIn', defaultMessage: 'Zoom in' },
  zoomOut: { id: 'certificates.zoomOut', defaultMessage: 'Zoom out' },
  zoomLevel: {
    id: 'certificates.zoomLevel',
    defaultMessage: 'Zoom {percent}%',
  },
  showSample: {
    id: 'certificates.showSample',
    defaultMessage: 'Show sample data',
  },
  elements: { id: 'certificates.elements', defaultMessage: 'Elements' },
  noElements: {
    id: 'certificates.noElements',
    defaultMessage: 'No elements yet. Add one from the toolbar.',
  },
  moveBack: { id: 'certificates.moveBack', defaultMessage: 'Move {id} back' },
  moveForward: {
    id: 'certificates.moveForward',
    defaultMessage: 'Move {id} forward',
  },
  selected: { id: 'certificates.selected', defaultMessage: 'Selected: {id}' },
  nothingSelected: {
    id: 'certificates.nothingSelected',
    defaultMessage: 'Nothing selected',
  },
  properties: { id: 'certificates.properties', defaultMessage: 'Properties' },
  selectElement: {
    id: 'certificates.selectElement',
    defaultMessage: 'Select an element to edit it.',
  },
  typeText: { id: 'certificates.typeText', defaultMessage: 'Text' },
  typeImage: { id: 'certificates.typeImage', defaultMessage: 'Image' },
  typeQrcode: { id: 'certificates.typeQrcode', defaultMessage: 'QR code' },
  id: { id: 'certificates.id', defaultMessage: 'Identifier' },
  idInvalid: {
    id: 'certificates.idInvalid',
    defaultMessage:
      'Use a lowercase letter, then up to 31 lowercase letters, digits, - or _.',
  },
  idTaken: {
    id: 'certificates.idTaken',
    defaultMessage: 'Another element has this identifier.',
  },
  x: { id: 'certificates.x', defaultMessage: 'X' },
  y: { id: 'certificates.y', defaultMessage: 'Y' },
  width: { id: 'certificates.width', defaultMessage: 'Width' },
  height: { id: 'certificates.height', defaultMessage: 'Height' },
  size: { id: 'certificates.size', defaultMessage: 'Size' },
  lockRatio: {
    id: 'certificates.lockRatio',
    defaultMessage: 'Keep proportions',
  },
  content: { id: 'certificates.content', defaultMessage: 'Content' },
  font: { id: 'certificates.font', defaultMessage: 'Font' },
  color: { id: 'certificates.color', defaultMessage: 'Color' },
  colorInvalid: {
    id: 'certificates.colorInvalid',
    defaultMessage: 'Use a color like #1a2b3c.',
  },
  anchor: { id: 'certificates.anchor', defaultMessage: 'Alignment' },
  anchorStart: { id: 'certificates.anchorStart', defaultMessage: 'Start' },
  anchorMiddle: { id: 'certificates.anchorMiddle', defaultMessage: 'Center' },
  anchorEnd: { id: 'certificates.anchorEnd', defaultMessage: 'End' },
  baseline: {
    id: 'certificates.baseline',
    defaultMessage: 'Vertical position',
  },
  baselineAlphabetic: {
    id: 'certificates.baselineAlphabetic',
    defaultMessage: 'On the baseline',
  },
  baselineMiddle: {
    id: 'certificates.baselineMiddle',
    defaultMessage: 'Centered',
  },
  baselineHanging: {
    id: 'certificates.baselineHanging',
    defaultMessage: 'Hanging',
  },
  maxWidth: { id: 'certificates.maxWidth', defaultMessage: 'Maximum width' },
  shrink: {
    id: 'certificates.shrink',
    defaultMessage: 'Shrink to fit the maximum width',
  },
  asset: { id: 'certificates.asset', defaultMessage: 'Image' },
  assetBackground: {
    id: 'certificates.assetBackground',
    defaultMessage: 'Background',
  },
  previewWithSampleData: {
    id: 'certificates.previewWithSampleData',
    defaultMessage: 'The certificate drawn with the sample data.',
  },
  noDesign: {
    id: 'certificates.noDesign',
    defaultMessage: 'This template has no design yet.',
  },
  templateImages: {
    id: 'certificates.templateImages',
    defaultMessage: 'Images',
  },
  assetMissing: {
    id: 'certificates.assetMissing',
    defaultMessage: '{asset} (missing)',
  },
  addImagesHint: {
    id: 'certificates.addImagesHint',
    defaultMessage:
      'To show a signature or a logo, add it as an image inside this template.',
  },
  errorCorrection: {
    id: 'certificates.errorCorrection',
    defaultMessage: 'Error correction',
  },
  foreground: { id: 'certificates.foreground', defaultMessage: 'Foreground' },
  background: { id: 'certificates.background', defaultMessage: 'Background' },
  insertField: {
    id: 'certificates.insertField',
    defaultMessage: 'Insert field',
  },
  insert: { id: 'certificates.insert', defaultMessage: 'Insert' },
  asDate: {
    id: 'certificates.asDate',
    defaultMessage: '{title} (formatted date)',
  },
  pageMismatch: {
    id: 'certificates.pageMismatch',
    defaultMessage:
      'The page is {pageWidth}×{pageHeight} but the background is {width}×{height}.',
  },
  fitPage: {
    id: 'certificates.fitPage',
    defaultMessage: 'Fit template to background',
  },
  problems: {
    id: 'certificates.problems',
    defaultMessage: '{count, plural, one {# problem} other {# problems}}',
  },
  serverPreview: {
    id: 'certificates.serverPreview',
    defaultMessage: 'Server preview',
  },
  serverPreviewNote: {
    id: 'certificates.serverPreviewNote',
    defaultMessage:
      'The template as saved, rendered by the server. Unsaved changes are not shown.',
  },
  serverPreviewUnsaved: {
    id: 'certificates.serverPreviewUnsaved',
    defaultMessage: 'Save the template to see the server preview.',
  },
  sampleData: { id: 'certificates.sampleData', defaultMessage: 'Sample data' },
  error_schema: {
    id: 'certificates.error_schema',
    defaultMessage: 'Invalid value at {path}: {detail}',
  },
  error_placeholder_syntax: {
    id: 'certificates.error_placeholder_syntax',
    defaultMessage: '{element}: {detail}',
  },
  error_unknown_token: {
    id: 'certificates.error_unknown_token',
    defaultMessage: '{element}: unknown field {token}.',
  },
  error_unknown_filter: {
    id: 'certificates.error_unknown_filter',
    defaultMessage: '{element}: unknown filter {filter}.',
  },
  error_date_filter: {
    id: 'certificates.error_date_filter',
    defaultMessage:
      '{element}: the date filter needs a date field, not {token}.',
  },
  error_duplicate_id: {
    id: 'certificates.error_duplicate_id',
    defaultMessage: '{element}: another element has the same id.',
  },
  error_unknown_font: {
    id: 'certificates.error_unknown_font',
    defaultMessage: '{element}: unknown font {font}.',
  },
  error_missing_asset: {
    id: 'certificates.error_missing_asset',
    defaultMessage: '{element}: the {asset} image is empty.',
  },
  error_outside_page: {
    id: 'certificates.error_outside_page',
    defaultMessage: '{element}: the element does not fit on the page.',
  },
  error_page_size: {
    id: 'certificates.error_page_size',
    defaultMessage:
      'The page is {page_width}x{page_height} but the background is {width}x{height}.',
  },
  verifyChecking: {
    id: 'certificates.verifyChecking',
    defaultMessage: 'Checking the certificate…',
  },
  verifyValid: {
    id: 'certificates.verifyValid',
    defaultMessage: 'This certificate is valid',
  },
  verifyIssued: {
    id: 'certificates.verifyIssued',
    defaultMessage: 'Issued on {date}',
  },
  verifyNotFound: {
    id: 'certificates.verifyNotFound',
    defaultMessage: 'No certificate with this ID was found.',
  },
  verifyDownload: {
    id: 'certificates.verifyDownload',
    defaultMessage: 'Download the certificate (PDF)',
  },
  verifyTitle: {
    id: 'certificates.verifyTitle',
    defaultMessage: 'Certificate verification',
  },
  downloadCsvTemplate: {
    id: 'certificates.downloadCsvTemplate',
    defaultMessage: 'Download CSV template',
  },
  createFromCsv: {
    id: 'certificates.createFromCsv',
    defaultMessage: 'Create certificates from CSV',
  },
  csvDownloadFailed: {
    id: 'certificates.csvDownloadFailed',
    defaultMessage: 'The CSV template could not be downloaded.',
  },
  creatingCertificates: {
    id: 'certificates.creatingCertificates',
    defaultMessage: 'Creating certificates…',
  },
  certificatesCreated: {
    id: 'certificates.certificatesCreated',
    defaultMessage:
      '{count, plural, one {# certificate was created.} other {# certificates were created.}}',
  },
  noCertificatesCreated: {
    id: 'certificates.noCertificatesCreated',
    defaultMessage: 'No certificates were created.',
  },
  createFailed: {
    id: 'certificates.createFailed',
    defaultMessage: 'The certificates could not be created. Try again.',
  },
  csvErrorAt: {
    id: 'certificates.csvErrorAt',
    defaultMessage: 'Line {row}, {column}: {message}',
  },
  csvErrorLine: {
    id: 'certificates.csvErrorLine',
    defaultMessage: 'Line {row}: {message}',
  },
});

export default messages;
