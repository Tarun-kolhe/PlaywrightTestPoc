import type { AppConfig } from '../schema';

export const PREPROD: Partial<AppConfig> = {
  // Same as the Selenium suite's EAGER page-load strategy: PREPROD's full "load" event is slow.
  waitUntil: 'domcontentloaded',
};
