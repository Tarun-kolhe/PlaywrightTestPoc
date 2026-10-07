import { test as base, type BrowserContextOptions } from '@playwright/test';
import { config, type AppConfig } from '../../config';
import { CmsClient } from '../api/cmsClient';
import { openCloudSession, reportCloudStatus } from '../lambdatest/connect';
import { HomePage } from '../pages/HomePage';
import { getData } from '../utils/data';

/** Shape of data/<BRAND>/common/site.json. */
export type SiteData = {
  pages: Record<string, { path: string; titleContains: string }>;
  countryBlockedHeading: string;
};

export type AppFixtures = {
  config: AppConfig;
  cms: CmsClient;
  testData: { site: SiteData };
  homePage: HomePage;
};

const appTest = base.extend<AppFixtures>({
  config: async ({}, use) => {
    await use(config);
  },

  cms: async ({ playwright }, use) => {
    const cms = await CmsClient.create(playwright, config);
    await use(cms);
    await cms.dispose();
  },

  testData: async ({}, use) => {
    await use({ site: getData<SiteData>('site') });
  },

  homePage: async ({ page, isMobile }, use) => {
    await use(new HomePage(page, isMobile));
  },
});

/**
 * RUN_ON=lambdatest: every test gets its own LambdaTest session, named after the scenario,
 * with the project's emulation options (viewport, touch, UA, baseURL). The result is reported
 * back to the dashboard. RUN_ON=local keeps Playwright's built-in browser/context/page.
 */
const cloudTest = appTest.extend({
  context: async (
    {
      playwright,
      baseURL,
      viewport,
      userAgent,
      isMobile,
      hasTouch,
      deviceScaleFactor,
      locale,
      timezoneId,
      colorScheme,
      ignoreHTTPSErrors,
      storageState,
      contextOptions,
    },
    use,
    testInfo,
  ) => {
    const options: BrowserContextOptions = {
      ...contextOptions,
      baseURL,
      viewport,
      userAgent,
      isMobile,
      hasTouch,
      deviceScaleFactor,
      locale,
      timezoneId,
      colorScheme,
      ignoreHTTPSErrors,
      storageState,
    };
    const session = await openCloudSession(playwright, testInfo, options);
    await use(session.context);
    await session.close();
  },
  page: async ({ context }, use, testInfo) => {
    const page = context.pages()[0] ?? (await context.newPage());
    await use(page);
    await reportCloudStatus(page, testInfo);
  },
});

export const test = config.runOn === 'lambdatest' ? cloudTest : appTest;
export { expect } from '@playwright/test';
