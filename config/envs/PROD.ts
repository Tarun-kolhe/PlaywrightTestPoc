import type { AppConfig } from '../schema';

export const PROD: Partial<AppConfig> = {
  // Prod is read-only smoke: scenarios tagged @writes are skipped.
  readOnly: true,
};
