import type { BrandConfig } from '../schema';

// Base URLs end with "/" so the locale path is kept: page objects navigate with relative
// paths (page.goto('') or page.goto('sports')); a leading "/" would drop "/en-gb".
export const DAZN_UK: BrandConfig = {
  common: {
    displayName: 'DAZN Bet UK',
    locale: 'en-GB',
    currency: 'GBP',
    geoLocation: 'GB',
  },
  envs: {
    QA: { baseURL: 'https://qa-daznbet-uk.uatsecure.com/en-gb/' },
    UAT: { baseURL: 'https://uat-daznbet-uk.uatsecure.com/en-gb/' },
    PREPROD: { baseURL: 'https://uat-ppbet-dazn-uk.uatsecure.com/en-gb/' },
    PROD: { baseURL: 'https://www.daznbet.com/en-gb/' },
  },
};
