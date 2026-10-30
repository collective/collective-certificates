import type { ConfigType } from '@plone/registry';

/** Designer settings, at `config.settings.certificates.designer`. */
export interface DesignerSettings {
  /** Zoom levels the + and - keys step through. */
  zoomSteps: number[];
  /** Page pixels an arrow key moves the selection; shift moves ten times as far. */
  nudgeStep: number;
  /** Distance in page pixels at which a moved element snaps. */
  snapTolerance: number;
}

export const DEFAULT_DESIGNER: DesignerSettings = {
  zoomSteps: [0.1, 0.15, 0.2, 0.25, 0.33, 0.5, 0.75, 1],
  nudgeStep: 1,
  snapTolerance: 10,
};

export default function install(config: ConfigType) {
  const current = (
    config.settings as {
      certificates?: { designer?: Partial<DesignerSettings> };
    }
  ).certificates;
  // Keep what a project already set; fill in the rest.
  (config.settings as Record<string, unknown>).certificates = {
    ...current,
    designer: { ...DEFAULT_DESIGNER, ...current?.designer },
  };
  return config;
}
