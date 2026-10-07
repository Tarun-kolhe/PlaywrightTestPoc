import type { Brand, BrandConfig } from '../schema';
import { DAZN_DE } from './DAZN_DE';
import { DAZN_ES } from './DAZN_ES';
import { DAZN_UK } from './DAZN_UK';

export const brands: Record<Brand, BrandConfig> = { DAZN_UK, DAZN_ES, DAZN_DE };
