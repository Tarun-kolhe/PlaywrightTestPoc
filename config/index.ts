import './loadEnv';
import { z } from 'zod';
import { base } from './base';
import { brands } from './brands';
import { envs } from './envs';
import { BRANDS, ConfigSchema, DEVICES, ENVS, RUN_TARGETS, type AppConfig } from './schema';

/** Reads a run variable; case-insensitive, so TEST_ENV=qa and TEST_ENV=QA both work. */
function pick<T extends readonly string[]>(name: string, allowed: T, fallback: T[number]): T[number] {
  const value = process.env[name] || fallback;
  const match = allowed.find((a) => a.toLowerCase() === value.toLowerCase());
  if (!match) {
    throw new Error(`${name}="${value}" is not valid. Use one of: ${allowed.join(', ')}`);
  }
  return match;
}

function resolveConfig(): AppConfig {
  const brand = pick('BRAND', BRANDS, 'DAZN_UK');
  const env = pick('TEST_ENV', ENVS, 'QA');
  const device = pick('DEVICE', DEVICES, 'all');
  const runOn = pick('RUN_ON', RUN_TARGETS, 'local');

  const brandEnv = brands[brand].envs[env];
  if (!brandEnv) {
    throw new Error(`Brand "${brand}" has no "${env}" environment in config/brands/${brand}.ts`);
  }

  // base -> environment -> brand -> brand x environment
  const merged = {
    ...base,
    ...envs[env],
    ...brands[brand].common,
    ...brandEnv,
    featureFlags: {
      ...base.featureFlags,
      ...envs[env].featureFlags,
      ...brands[brand].common.featureFlags,
      ...brandEnv.featureFlags,
    },
    brand,
    env,
    device,
    runOn,
    lambdatest: {
      concurrency: Number(process.env.LT_CONCURRENCY || 2),
      tunnel: process.env.LT_TUNNEL === 'true',
      tunnelName: process.env.LT_TUNNEL_NAME || undefined,
      realDevices: process.env.LT_REAL_DEVICES === 'true',
      originHeader: process.env.LT_ORIGIN_HEADER || undefined,
    },
  };

  const parsed = ConfigSchema.safeParse(merged);
  if (!parsed.success) {
    throw new Error(`Invalid config for BRAND=${brand} TEST_ENV=${env}:\n${z.prettifyError(parsed.error)}`);
  }

  if (runOn === 'lambdatest' && (!process.env.LT_USERNAME || !process.env.LT_ACCESS_KEY)) {
    throw new Error(
      'RUN_ON=lambdatest needs LT_USERNAME and LT_ACCESS_KEY (.env locally, Jenkins Credentials in CI).',
    );
  }
  return parsed.data;
}

export const config = resolveConfig();
export type { AppConfig } from './schema';
