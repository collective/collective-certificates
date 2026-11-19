import type { ConfigType } from '@plone/registry';
import nibSVG from '@plone/volto/icons/nib.svg';
import verifiedSVG from '@plone/volto/icons/verified.svg';

/** Icons by the portal type the backend registers. */
export const CONTENT_ICONS = {
  Certificate: verifiedSVG,
  CertificateTemplate: nibSVG,
};

export default function install(config: ConfigType) {
  config.settings.contentIcons = {
    ...config.settings.contentIcons,
    ...CONTENT_ICONS,
  };
  return config;
}
