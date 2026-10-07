import { SportsbookIframe, type SportsbookState } from '../components/SportsbookIframe';
import { dataByKey } from '../utils/data';
import { expect, Given, Then, When } from './fixtures';

Given('I open the {string} page', async ({ homePage, testData }, key: string) => {
  const target = dataByKey(testData.site.pages, key, 'page');
  await homePage.open(target.path);
});

Then('the site should load correctly', async ({ $testInfo, homePage, testData, config }) => {
  // Real iOS devices on LambdaTest don't return the navigation response; the checks below still apply.
  if (homePage.response) {
    expect(homePage.response.status(), 'main document HTTP status').toBeLessThan(400);
  } else {
    $testInfo.annotations.push({ type: 'note', description: 'HTTP status not available on this device; skipped' });
  }
  expect(new URL(homePage.page.url()).host, 'should stay on the brand domain (no redirect)').toBe(
    new URL(config.baseURL).host,
  );

  // Wait for the app to render either the header or the geo-block page, then tell them apart.
  // Built on isVisible() polling because locator.or() and toBeHidden() don't work on LambdaTest real iOS devices.
  const blocked = homePage.countryBlocked(testData.site.countryBlockedHeading);
  let state: 'loaded' | 'blocked' | 'pending' = 'pending';
  await expect(async () => {
    if (await blocked.isVisible()) state = 'blocked';
    else if (await homePage.header.logo.isVisible()) state = 'loaded';
    expect(state, 'DAZN Bet header (logo) or the geo-block page').not.toBe('pending');
  }).toPass({ timeout: config.timeouts.expect });
  expect(
    state,
    `${config.displayName} is geo-blocked from this machine. Run from ${config.geoLocation} (e.g. RUN_ON=lambdatest) or via VPN.`,
  ).toBe('loaded');
});

Then('the page title should be correct for the {string} page', async ({ homePage, testData }, key: string) => {
  const { titleContains } = dataByKey(testData.site.pages, key, 'page');
  // page.title() polling instead of toHaveTitle(): the latter reads "" on LambdaTest real iOS devices.
  await expect.poll(() => homePage.page.title(), { message: 'page title' }).toContain(titleContains);
});

Then('the sportsbook should load correctly', async ({ homePage, config }) => {
  let last: SportsbookState | undefined;
  // The sportsbook app inside the iframe renders after the shell; give it longer than a normal expect.
  const healthy = await expect
    .poll(async () => SportsbookIframe.isHealthy((last = await homePage.sportsbook.state())), {
      timeout: config.timeouts.expect * 2,
    })
    .toBe(true)
    .then(
      () => true,
      () => false,
    );
  expect(
    healthy,
    `Sportsbook iframe (#pragmaticSportsIframe) did not load correctly on ${config.displayName} ${config.env}: ` +
      `visible=${last?.visible}, title="${last?.title}", elements=${last?.elements}, url=${last?.url}`,
  ).toBe(true);
});

// Deliberate static pause so a person can watch the loaded page (headed run or LambdaTest video).
// Remove it from the feature for normal CI runs; it only adds time.
When('I wait {int} seconds to review the page', async ({ page }, seconds: number) => {
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(seconds * 1000);
});
