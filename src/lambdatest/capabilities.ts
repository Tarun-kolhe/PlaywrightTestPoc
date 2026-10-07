import { createRequire } from 'node:module';
import { config } from '../../config';

const require = createRequire(__filename);
// LambdaTest real iOS/Android devices only accept specific Playwright versions (1.53.2 at the
// time of writing), which is why @playwright/test is pinned to that exact version in package.json.
const playwrightClientVersion: string = require('@playwright/test/package.json').version;

/** How a Playwright project maps to a LambdaTest machine. Edit devices/platforms here. */
type CloudTarget =
  | { kind: 'browser'; engine: 'chromium' | 'webkit' | 'firefox'; browserName: string; platform: string }
  | { kind: 'android' | 'ios'; deviceName: string; platformVersion: string };

const EMULATED: Record<string, CloudTarget> = {
  'desktop-chrome': { kind: 'browser', engine: 'chromium', browserName: 'Chrome', platform: 'Windows 11' },
  // WebKit on Windows, not macOS: LambdaTest's Windows machines egress from Mumbai, which the DAZN
  // QA/UAT sportsbook allowlists; its macOS machines egress from Dublin and are blocked.
  'desktop-safari': { kind: 'browser', engine: 'webkit', browserName: 'pw-webkit', platform: 'Windows 11' },
  // Mobile projects run as emulated devices on cloud desktops by default (viewport, touch, UA)...
  'mobile-android': { kind: 'browser', engine: 'chromium', browserName: 'Chrome', platform: 'Windows 11' },
  'mobile-ios': { kind: 'browser', engine: 'webkit', browserName: 'pw-webkit', platform: 'Windows 11' },
};

// ...or on real devices with LT_REAL_DEVICES=true. Override the device per run via .env.
// LambdaTest real iPhones for Playwright need iOS >= 17.
const REAL_DEVICES: Record<string, CloudTarget> = {
  'mobile-android': {
    kind: 'android',
    deviceName: process.env.LT_ANDROID_DEVICE || 'Galaxy S26 Ultra',
    platformVersion: process.env.LT_ANDROID_VERSION || '16',
  },
  'mobile-ios': {
    kind: 'ios',
    deviceName: process.env.LT_IOS_DEVICE || 'iPhone 15',
    platformVersion: process.env.LT_IOS_VERSION || '17',
  },
};

export function cloudTargetFor(projectName: string): CloudTarget {
  const target = (config.lambdatest.realDevices && REAL_DEVICES[projectName]) || EMULATED[projectName];
  if (!target) throw new Error(`No LambdaTest mapping for project "${projectName}" in src/lambdatest/capabilities.ts`);
  return target;
}

/** x-origin-node: the header DAZN's firewall allowlists for LambdaTest traffic (sportsbook iframe on QA/UAT). */
export function originHeaders(): Record<string, string> {
  return config.lambdatest.originHeader ? { 'x-origin-node': config.lambdatest.originHeader } : {};
}

export function buildName(): string {
  return process.env.LT_BUILD || `${config.brand}-${config.env}-${process.env.BUILD_NUMBER ?? 'local'}`;
}

export function capabilitiesFor(target: CloudTarget, testName: string): Record<string, unknown> {
  const ltOptions: Record<string, unknown> = {
    build: buildName(),
    project: `${config.brand}-${config.env}`,
    name: testName,
    user: process.env.LT_USERNAME,
    accessKey: process.env.LT_ACCESS_KEY,
    network: true,
    video: true,
    console: true,
    playwrightClientVersion,
  };
  // PROD geo-blocks outside the brand's market, so PROD runs from the brand's country.
  // QA/UAT/PREPROD must NOT use geoLocation: the geo proxy's IPs are blocked by the sportsbook's
  // firewall, while LambdaTest's own Mumbai egress (no geoLocation) is allowlisted.
  if (config.geoLocation && config.env === 'PROD') ltOptions.geoLocation = config.geoLocation;
  // Sent by LambdaTest's proxy, as in the Selenium suite (not via browser extraHTTPHeaders, which
  // would also hit the sportsbook's cross-origin API calls and break them via CORS).
  const headers = originHeaders();
  if (Object.keys(headers).length) ltOptions.customHeaders = headers;
  if (config.lambdatest.tunnel) {
    ltOptions.tunnel = true;
    if (config.lambdatest.tunnelName) ltOptions.tunnelName = config.lambdatest.tunnelName;
  }

  if (target.kind === 'browser') {
    return {
      browserName: target.browserName,
      browserVersion: 'latest',
      'LT:Options': { ...ltOptions, platform: target.platform },
    };
  }
  return {
    'LT:Options': {
      ...ltOptions,
      platformName: target.kind,
      deviceName: target.deviceName,
      platformVersion: target.platformVersion,
      isRealMobile: true,
    },
  };
}

export function wsEndpoint(capabilities: Record<string, unknown>): string {
  return `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(JSON.stringify(capabilities))}`;
}
