import { defineConfig, devices, type Project } from '@playwright/test';
import { cucumberReporter, defineBddConfig } from 'playwright-bdd';
import { config } from './config';
import { BRANDS } from './config/schema';
import { buildName } from './src/lambdatest/capabilities';

const isCI = !!process.env.CI || !!process.env.JENKINS_URL;
const isCloud = config.runOn === 'lambdatest';
// Jenkins sets REPORT_SUBDIR per brand so parallel brand runs keep separate reports.
const sub = process.env.REPORT_SUBDIR ? `${process.env.REPORT_SUBDIR}/` : '';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'src/steps/**/*.ts',
  missingSteps: 'fail-on-gen',
});

/** Scenarios tagged for another brand, the other layout, or data-changing on a read-only env are skipped. */
function excludedTags(layout: 'desktop' | 'mobile'): RegExp {
  const tags = BRANDS.filter((b) => b !== config.brand).map((b) => `@${b}-only\\b`);
  tags.push(layout === 'desktop' ? '@mobile-only\\b' : '@desktop-only\\b');
  if (config.readOnly) tags.push('@writes\\b');
  return new RegExp(tags.join('|'));
}

const all: Project[] = [
  { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
  { name: 'desktop-safari', use: { ...devices['Desktop Safari'] } },
  { name: 'mobile-android', use: { ...devices['Pixel 7'] } }, // here we can add more devices like Pixel 6, Galaxy S21, etc. if needed
  { name: 'mobile-ios', use: { ...devices['iPhone 14'] } },
];

const selected = all
  .filter((p) => config.device === 'all' || p.name!.startsWith(config.device))
  .map<Project>((p) => ({
    ...p,
    testDir,
    // When login scenarios arrive, add a "setup" project that saves storageState per role and list it here.
    grepInvert: excludedTags(p.name!.startsWith('mobile') ? 'mobile' : 'desktop'),
  }));

// Playwright loads this file more than once per run; print the build link only once.
if (isCloud && !process.env.TEST_WORKER_INDEX && !process.env.LT_BUILD_LOGGED) {
  process.env.LT_BUILD_LOGGED = '1';
  console.log(`LambdaTest build "${buildName()}": https://automation.lambdatest.com/build`);
}

export default defineConfig({
  testDir,
  outputDir: `test-results/${sub}`,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // Local: 2 browsers at a time by default; the live sportsbook is heavy and 4 at once can exhaust memory.
  workers: isCloud ? config.lambdatest.concurrency : Number(process.env.WORKERS || 2),
  timeout: config.timeouts.test,
  expect: { timeout: config.timeouts.expect },

  reporter: [
    ['list'],
    ['html', { outputFolder: `playwright-report/${sub}`, open: 'never' }],
    ['junit', { outputFile: `results/${sub}junit.xml` }],
    cucumberReporter('html', { outputFile: `results/${sub}cucumber-report.html` }),
    cucumberReporter('json', { outputFile: `results/${sub}cucumber-report.json` }),
  ],

  use: {
    baseURL: config.baseURL,
    testIdAttribute: config.testIdAttribute,
    locale: config.locale,
    actionTimeout: config.timeouts.action,
    navigationTimeout: config.timeouts.navigation,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: selected,
});
