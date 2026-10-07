import type { AppConfig } from './schema';

/** Defaults shared by every brand and environment. */
export const base: Partial<AppConfig> = {
  testIdAttribute: 'data-testid',
  featureFlags: {},
  readOnly: false,
  // The DAZN Bet front end renders client-side; the header can take ~10s on QA/UAT.
  timeouts: {
    test: 90_000,
    expect: 20_000,
    action: 15_000,
    navigation: 45_000,
  },
};
