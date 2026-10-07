import type { BrowserContext, BrowserContextOptions, Page, TestInfo } from '@playwright/test';
import type { PlaywrightWorkerArgs } from '@playwright/test';
import { capabilitiesFor, cloudTargetFor, wsEndpoint } from './capabilities';

export type CloudSession = {
  context: BrowserContext;
  close: () => Promise<void>;
};

/** Opens one LambdaTest session for one test, named after the scenario. */
export async function openCloudSession(
  playwright: PlaywrightWorkerArgs['playwright'],
  testInfo: TestInfo,
  contextOptions: BrowserContextOptions,
): Promise<CloudSession> {
  const target = cloudTargetFor(testInfo.project.name);
  const endpoint = wsEndpoint(capabilitiesFor(target, `${testInfo.title} [${testInfo.project.name}]`));

  // Real iPhones: Safari via WebKit; device emulation options don't apply to a real device.
  if (target.kind === 'ios') {
    const browser = await playwright.webkit.connect(endpoint);
    const context = await browser.newContext({ baseURL: contextOptions.baseURL, locale: contextOptions.locale });
    return {
      context,
      close: async () => {
        await context.close();
        await browser.close();
      },
    };
  }

  if (target.kind === 'android') {
    const device = await playwright._android.connect(endpoint);
    await device.shell('am force-stop com.android.chrome');
    // storageState isn't supported here; loginAs() restores the saved session cookies instead.
    const context = await device.launchBrowser({ baseURL: contextOptions.baseURL, locale: contextOptions.locale });
    return {
      context,
      close: async () => {
        await context.close();
        await device.close();
      },
    };
  }

  // Desktop browsers and emulated mobile use the project's own Playwright client.
  if (target.kind !== 'browser') throw new Error(`Unhandled LambdaTest target "${target.kind}"`);
  const browser = await playwright[target.engine].connect(endpoint);
  const context = await browser.newContext(contextOptions);
  return {
    context,
    close: async () => {
      await context.close();
      await browser.close();
    },
  };
}

/** Sends pass/fail to the LambdaTest dashboard so it matches the Playwright report. */
export async function reportCloudStatus(page: Page, testInfo: TestInfo): Promise<void> {
  const passed = testInfo.status === testInfo.expectedStatus;
  const action = {
    action: 'setTestStatus',
    arguments: {
      status: passed ? 'passed' : 'failed',
      remark: passed ? 'Passed' : (testInfo.error?.message ?? 'Failed').slice(0, 500),
    },
  };
  try {
    await page.evaluate(() => {}, `lambdatest_action: ${JSON.stringify(action)}`);
  } catch {
    // The session may already be gone (e.g. timeout); the Playwright report still has the result.
  }
}
