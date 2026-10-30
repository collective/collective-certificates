/** Data for the stories: a small certificate on a plain page. */

import type { Blueprint, FieldData } from '../../blueprint/model';
import type { Term } from '../../reducers/certificates';

export const STORY_BLUEPRINT: Blueprint = {
  version: 1,
  page: { width: 1754, height: 1240 },
  elements: [
    {
      id: 'title',
      type: 'text',
      x: 877,
      y: 260,
      anchor: 'middle',
      baseline: 'alphabetic',
      font: 'eb-garamond-bold',
      size: 90,
      color: '#102030',
      content: 'Certificate',
    },
    {
      id: 'name',
      type: 'text',
      x: 877,
      y: 520,
      anchor: 'middle',
      baseline: 'middle',
      font: 'inter-bold',
      size: 70,
      color: '#000000',
      content: '{{ full_name|upper }}',
      max_width: 1400,
      fit: 'shrink',
    },
    {
      id: 'period',
      type: 'text',
      x: 877,
      y: 700,
      anchor: 'middle',
      baseline: 'alphabetic',
      font: 'inter',
      size: 36,
      color: '#405060',
      content:
        'from {{ event_start_date|date }} to {{ event_end_date|date }}, a total of {{ total_hours }} hours.',
    },
    {
      id: 'qr',
      type: 'qrcode',
      x: 1450,
      y: 920,
      size: 240,
      content: '{{ verification_url }}',
      ec: 'M',
      fg: '#000000',
      bg: '#ffffff',
    },
  ],
};

export const STORY_FONTS: Term[] = [
  { token: 'inter', title: 'Inter' },
  { token: 'inter-bold', title: 'Inter Bold' },
  { token: 'eb-garamond', title: 'EB Garamond' },
  { token: 'eb-garamond-bold', title: 'EB Garamond Bold' },
  { token: 'caveat', title: 'Caveat' },
];

export const STORY_FIELDS: Term[] = [
  { token: 'full_name', title: 'Full name' },
  { token: 'event_name', title: 'Event name' },
  { token: 'event_start_date', title: 'Event start date' },
  { token: 'event_end_date', title: 'Event end date' },
  { token: 'responsible_person', title: 'Responsible person' },
  { token: 'total_hours', title: 'Total hours' },
  { token: 'certificate_uid', title: 'Certificate ID' },
  { token: 'verification_url', title: 'Verification URL' },
];

export const STORY_KINDS: Record<string, string> = {
  full_name: 'text',
  event_name: 'text',
  event_start_date: 'date',
  event_end_date: 'date',
  responsible_person: 'text',
  total_hours: 'text',
  certificate_uid: 'computed',
  verification_url: 'computed',
};

export const STORY_LEVELS: Term[] = [
  { token: 'L', title: 'Low (7%)' },
  { token: 'M', title: 'Medium (15%)' },
  { token: 'Q', title: 'Quartile (25%)' },
  { token: 'H', title: 'High (30%)' },
];

export const STORY_DATA: FieldData = {
  full_name: 'Patrick Stewart',
  event_name: 'Star Trek: Picard',
  event_start_date: '2026-05-26',
  event_end_date: '2026-06-09',
  responsible_person: 'Jean-Luc Picard',
  total_hours: '47',
  certificate_uid: '257e08fdcd07ff6fa3d1bc14f6aec321',
  verification_url:
    'https://example.org/verify/257e08fdcd07ff6fa3d1bc14f6aec321',
};

/** A plain background with a border, as a data URL. */
export const STORY_BACKGROUND = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1754" height="1240">' +
    '<rect width="1754" height="1240" fill="#fbf8f1"/>' +
    '<rect x="40" y="40" width="1674" height="1160" fill="none" ' +
    'stroke="#c9a14a" stroke-width="12"/></svg>',
)}`;
