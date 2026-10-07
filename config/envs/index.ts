import type { AppConfig, Env } from '../schema';
import { PREPROD } from './PREPROD';
import { PROD } from './PROD';
import { QA } from './QA';
import { UAT } from './UAT';

export const envs: Record<Env, Partial<AppConfig>> = { QA, UAT, PREPROD, PROD };
