import type { BrandConfig } from '../schema';

// URLs follow the UK naming pattern and were checked to load; confirm them with the team.
export const DAZN_ES: BrandConfig = {
  common: {
    displayName: 'DAZN Bet España',
    locale: 'es-ES',
    currency: 'EUR',
    geoLocation: 'ES',
  },
  envs: {
    QA: { baseURL: 'https://qa-daznbet-es.uatsecure.com/es-es' },
    UAT: { baseURL: 'https://uat-daznbet-es.uatsecure.com/es-es' },
    // PREPROD: { baseURL: '' }, // TODO: add the ES pre-prod URL
    PROD: { baseURL: 'https://www.daznbet.es/es-es/' },
  },
};
