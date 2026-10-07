import type { BrandConfig } from '../schema';

// URLs follow the UK naming pattern and were checked to load; confirm them with the team.
export const DAZN_DE: BrandConfig = {
  common: {
    displayName: 'DAZN Bet Deutschland',
    locale: 'de-DE',
    currency: 'EUR',
    geoLocation: 'DE',
  },
  envs: {
    QA: { baseURL: 'https://qa-daznbet-de.uatsecure.com/de-de' },
     UAT: { baseURL: 'https://uat-daznbet-de.uatsecure.com/de-de' },
    // PREPROD: { baseURL: '' },
    PROD: { baseURL: 'https://www.daznbet.de/de-de/' },
  },
};
