import type { ComponentType } from 'react';
import type { ConfigType } from '@plone/registry';
import VerifyCertificate from '../components/VerifyCertificate/VerifyCertificate';

/**
 * The route the QR code of a certificate points to. Volto renders addon
 * routes inside the app, so the header and footer show around it.
 */
export const VERIFY_ROUTE = {
  path: '/verify/:uid',
  // Volto's registry types route components as props-less, like the views.
  component: VerifyCertificate as ComponentType,
};

export default function install(config: ConfigType) {
  config.addonRoutes = [...(config.addonRoutes ?? []), VERIFY_ROUTE];
  return config;
}
