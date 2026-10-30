import type { ComponentType } from 'react';
import type { ConfigType } from '@plone/registry';
import CertificateTemplateView from '../components/CertificateTemplateView/CertificateTemplateView';

/** Views by the portal type the backend registers. */
export const CONTENT_TYPE_VIEWS = {
  // Volto passes the content as a prop; its registry types views as props-less.
  CertificateTemplate: CertificateTemplateView as ComponentType,
};

export default function install(config: ConfigType) {
  config.views.contentTypesViews = {
    ...config.views.contentTypesViews,
    ...CONTENT_TYPE_VIEWS,
  };
  return config;
}
