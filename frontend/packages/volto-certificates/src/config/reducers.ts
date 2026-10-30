import type { ConfigType } from '@plone/registry';
import certificates from '../reducers/certificates';

export default function install(config: ConfigType) {
  config.addonReducers = {
    ...config.addonReducers,
    certificates,
  };
  return config;
}
