import { describe, expect, it } from 'vitest';
import type { ConfigType } from '@plone/registry';
import applyConfig from '../index';
import certificates from '../reducers/certificates';
import installReducers from './reducers';
import installRoutes, { VERIFY_ROUTE } from './routes';
import installSettings, { DEFAULT_DESIGNER } from './settings';
import installViews, { CONTENT_TYPE_VIEWS } from './views';
import installWidgets, { WIDGETS } from './widgets';

const emptyConfig = () =>
  ({
    settings: {},
    addonReducers: {},
    views: { contentTypesViews: {} },
  }) as unknown as ConfigType;

const designer = (config: ConfigType) =>
  (config.settings as unknown as { certificates: { designer: unknown } })
    .certificates.designer;

describe('settings', () => {
  it('installs the designer defaults', () => {
    expect(designer(installSettings(emptyConfig()))).toEqual(DEFAULT_DESIGNER);
  });

  it('keeps what a project already set', () => {
    const config = emptyConfig();
    (config.settings as Record<string, unknown>).certificates = {
      designer: { snapTolerance: 3 },
      other: true,
    };
    installSettings(config);
    expect(designer(config)).toEqual({ ...DEFAULT_DESIGNER, snapTolerance: 3 });
    expect(
      (config.settings as unknown as { certificates: { other: boolean } })
        .certificates.other,
    ).toBe(true);
  });

  it('has ascending zoom steps', () => {
    const steps = DEFAULT_DESIGNER.zoomSteps;
    expect([...steps].sort((a, b) => a - b)).toEqual(steps);
  });
});

describe('reducers', () => {
  it('adds the certificates slice and keeps the others', () => {
    const config = emptyConfig();
    const other = () => ({});
    config.addonReducers = { other };
    installReducers(config);
    expect(config.addonReducers).toEqual({ other, certificates });
  });

  it('works without a reducer registry', () => {
    const config = { settings: {} } as unknown as ConfigType;
    installReducers(config);
    expect(config.addonReducers).toEqual({ certificates });
  });
});

describe('widgets', () => {
  it('registers both widgets by the names the backend uses', () => {
    const config = emptyConfig();
    const other = () => null;
    (config as unknown as { widgets: unknown }).widgets = { widget: { other } };
    installWidgets(config);
    expect(config.widgets.widget).toEqual({ other, ...WIDGETS });
    expect(Object.keys(WIDGETS)).toEqual([
      'certificate_blueprint',
      'certificate_sample_data',
    ]);
  });
});

describe('routes', () => {
  it('adds the verification page to the addon routes', () => {
    const config = emptyConfig();
    const other = { path: '/other', component: () => null };
    (config as unknown as { addonRoutes: unknown }).addonRoutes = [other];
    installRoutes(config);
    expect(config.addonRoutes).toEqual([other, VERIFY_ROUTE]);
    expect(VERIFY_ROUTE.path).toBe('/verify/:uid');
  });

  it('works without existing addon routes', () => {
    const config = emptyConfig();
    installRoutes(config);
    expect(config.addonRoutes).toEqual([VERIFY_ROUTE]);
  });
});

describe('views', () => {
  it('registers the template view and keeps the others', () => {
    const config = emptyConfig();
    const Event = () => null;
    config.views.contentTypesViews = { Event };
    installViews(config);
    expect(config.views.contentTypesViews).toEqual({
      Event,
      ...CONTENT_TYPE_VIEWS,
    });
    expect(Object.keys(CONTENT_TYPE_VIEWS)).toEqual(['CertificateTemplate']);
  });
});

describe('applyConfig', () => {
  it('installs settings, reducers and widgets', () => {
    const config = emptyConfig();
    (config as unknown as { widgets: unknown }).widgets = { widget: {} };
    applyConfig(config);
    expect(designer(config)).toEqual(DEFAULT_DESIGNER);
    expect(config.addonReducers?.certificates).toBe(certificates);
    expect(config.widgets.widget).toEqual(WIDGETS);
    expect(config.views.contentTypesViews).toEqual(CONTENT_TYPE_VIEWS);
    expect(config.addonRoutes).toEqual([VERIFY_ROUTE]);
  });
});
