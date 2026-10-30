import type { ConfigType } from '@plone/registry';
import installReducers from './config/reducers';
import installRoutes from './config/routes';
import installSettings from './config/settings';
import installViews from './config/views';
import installWidgets from './config/widgets';

function applyConfig(config: ConfigType) {
  installSettings(config);
  installReducers(config);
  installWidgets(config);
  installViews(config);
  installRoutes(config);

  return config;
}

export default applyConfig;
