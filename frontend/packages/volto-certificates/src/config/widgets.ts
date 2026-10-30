import type { ConfigType } from '@plone/registry';
import BlueprintWidget from '../components/Widgets/BlueprintWidget/BlueprintWidget';
import SampleDataWidget from '../components/Widgets/SampleDataWidget/SampleDataWidget';

/** The widget names the backend's CertificateTemplate schema asks for. */
export const WIDGETS = {
  certificate_blueprint: BlueprintWidget,
  certificate_sample_data: SampleDataWidget,
};

export default function install(config: ConfigType) {
  config.widgets.widget = { ...config.widgets.widget, ...WIDGETS };
  return config;
}
