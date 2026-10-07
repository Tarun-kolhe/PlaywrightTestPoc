import { z } from 'zod';

export const BRANDS = ['DAZN_UK', 'DAZN_ES', 'DAZN_DE'] as const;
export const ENVS = ['QA', 'UAT', 'PREPROD', 'PROD'] as const;
export const DEVICES = ['all', 'desktop', 'mobile'] as const;
export const RUN_TARGETS = ['local', 'lambdatest'] as const;

export type Brand = (typeof BRANDS)[number];
export type Env = (typeof ENVS)[number];

const CmsSchema = z.object({
  baseUrl: z.string().url(),
  spaceId: z.string().min(1),
  environment: z.string().default('master'),
  /** Name of the env var holding the CMS read token (never the token itself). */
  tokenKey: z.string().min(1),
});

export const ConfigSchema = z.object({
  brand: z.enum(BRANDS),
  env: z.enum(ENVS),
  device: z.enum(DEVICES),
  runOn: z.enum(RUN_TARGETS),

  displayName: z.string(),
  baseURL: z.string().url(),
  apiURL: z.string().url().optional(),
  locale: z.string().default('en-GB'),
  currency: z.string().default('GBP'),
  /** Country the site must be reached from (ISO code). Used as LambdaTest geoLocation; sites geo-block elsewhere. */
  geoLocation: z.string().length(2).optional(),
  testIdAttribute: z.string().default('data-testid'),
  cms: CmsSchema.optional(),
  featureFlags: z.record(z.string(), z.boolean()).default({}),

  /** Prod runs are read-only smoke: scenarios that change data are skipped. */
  readOnly: z.boolean().default(false),

  timeouts: z.object({
    test: z.number().int().positive(),
    expect: z.number().int().positive(),
    action: z.number().int().positive(),
    navigation: z.number().int().positive(),
  }),

  /** When page.goto() resolves: 'domcontentloaded' = Selenium's EAGER strategy (used for slow PREPROD). */
  waitUntil: z.enum(['load', 'domcontentloaded', 'commit']).default('load'),

  lambdatest: z.object({
    concurrency: z.number().int().positive(),
    tunnel: z.boolean(),
    tunnelName: z.string().optional(),
    realDevices: z.boolean(),
    /** x-origin-node header value the DAZN firewall allowlists for LambdaTest traffic. */
    originHeader: z.string().optional(),
  }),
});

export type AppConfig = z.infer<typeof ConfigSchema>;
export type CmsConfig = z.infer<typeof CmsSchema>;

/** What a brand file may set: shared values plus a per-environment matrix. */
export type BrandConfig = {
  common: Partial<AppConfig> & { displayName: string };
  envs: Partial<Record<Env, Partial<AppConfig>>>;
};
