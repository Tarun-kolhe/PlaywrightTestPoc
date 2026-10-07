# DAZN Bet Playwright BDD Automation Framework

One TypeScript codebase that runs any **brand × environment × device × execution target** by changing four variables, never the test code. Gherkin features run on the Playwright Test runner via [playwright-bdd](https://vitalets.github.io/playwright-bdd/).

## Quick start

```bash
npm ci
npx playwright install chromium webkit
cp .env.example .env        # LambdaTest credentials; user passwords once login scenarios exist
npm test                    # bddgen + all scenarios on all 4 device projects (DAZN_UK, QA)
npx playwright show-report  # HTML report
```

## Choosing what runs

| Variable   | Values                                  | Default   | Controls |
|------------|-----------------------------------------|-----------|----------|
| `BRAND`    | `DAZN_UK` `DAZN_ES` `DAZN_DE`           | `DAZN_UK` | base URL, locale, country, test data, users |
| `TEST_ENV` | `QA` `UAT` `PREPROD` `PROD`             | `QA`      | URLs, read-only mode (PROD) |
| `DEVICE`   | `all` `desktop` `mobile`                | `all`     | which Playwright projects run |
| `RUN_ON`   | `local` `lambdatest`                    | `local`   | local browsers or the LambdaTest grid |

`BRAND` and `TEST_ENV` are case-insensitive (`TEST_ENV=uat` works).

| Brand | QA | UAT | PREPROD | PROD |
|---|---|---|---|---|
| DAZN_UK | qa-daznbet-uk.uatsecure.com/en-gb | uat-daznbet-uk.uatsecure.com/en-gb | _not set_ | www.daznbet.com/en-gb |
| DAZN_ES | qa-daznbet-es.uatsecure.com/es-es | uat-daznbet-es.uatsecure.com/es-es | _not set_ | www.daznbet.es/es-es |
| DAZN_DE | qa-daznbet-de.uatsecure.com/de-de | _not set_ | _not set_ | www.daznbet.de/de-de |

A combination that is _not set_ stops at startup with a clear error. Add the URL in `config/brands/<BRAND>.ts`.

```bash
# bash / Git Bash
BRAND=DAZN_ES TEST_ENV=UAT DEVICE=mobile npm test -- --grep @smoke
RUN_ON=lambdatest BRAND=DAZN_DE TEST_ENV=PROD npm run test:smoke
```

```powershell
# PowerShell
$env:BRAND='DAZN_ES'; $env:TEST_ENV='UAT'; npm test -- --grep "@smoke"
```

Useful scripts: `test:smoke`, `test:regression`, `test:desktop`, `test:mobile`, `test:lt`, `test:headed`, `steps` (lists every registered step), `typecheck`, `lint`.

## Current scenarios

`features/home/site-health.feature` (`@smoke @critical`) opens the home page and checks that:

1. The page returns an HTTP status below 400 and stays on the brand's domain (no redirect).
2. The site is not showing the "Country blocked" page. This fails with a clear message naming the country to run from.
3. The DAZN Bet logo is visible in the header.
4. The page title contains the expected text from `data/<BRAND>/common/site.json`.

## Layout

```
config/            base.ts → envs/<ENV>.ts → brands/<BRAND>.ts merged in index.ts, validated by zod (schema.ts)
data/<BRAND>/      test data: common/site.json (pages, titles, geo-block text), overridable per <ENV>/
data/users/        who the users are per brand/env/role (no passwords; secretKey names an env var)
features/          Gherkin .feature files (business language, data referenced by key)
src/steps/         fixtures.ts (createBdd) + thin *.steps.ts, no locators
src/fixtures/      config, testData, cms, page objects, LambdaTest switch
src/pages/         BasePage (header, geo-block, open), HomePage
src/components/    Header (logo, main navigation, mobile menu)
src/api/           cmsClient           src/lambdatest/  capabilities + per-test cloud sessions
src/utils/         getData, getUser, faker factories
Jenkinsfile        one parameterized job for every combination
```

## How the pieces work

- **Fail fast.** Config is resolved and validated before any browser starts. This catches an unknown brand or env, a brand with no URL for that env, a missing password variable, and `RUN_ON=lambdatest` without `LT_USERNAME`/`LT_ACCESS_KEY`.
- **Locale path.** Base URLs end in `/` (e.g. `.../en-gb/`). Page objects navigate with relative paths (`open('')`, `open('sports')`); a leading `/` would drop the locale.
- **Where LambdaTest runs from.** PROD geo-blocks outside the market, so PROD sessions use the brand's `geoLocation` (GB, ES, DE). QA/UAT/PREPROD sessions use **no** geoLocation: LambdaTest's own Mumbai egress is allowlisted by the sportsbook firewall, while its geo-proxy IPs (and its Dublin macOS machines) are blocked. WebKit therefore runs on LambdaTest's Windows machines. The `x-origin-node` header from the Selenium suite (`LT_ORIGIN_HEADER`) is also sent via LambdaTest's `customHeaders`, but runs pass without it.
- **Secrets.** `.env` locally. In Jenkins, a Secret file credential passed as `USERS_ENV_FILE`, plus the `lambdatest` username/password credential.
- **Desktop + mobile.** Projects `desktop-chrome`, `desktop-safari`, `mobile-android` (Pixel 7), `mobile-ios` (iPhone 14). Page objects absorb layout differences.
- **Tags.** `@smoke`, `@regression`, `@critical` for suites. `@desktop-only`, `@mobile-only` and `@<BRAND>-only` are skipped automatically where they don't apply. `@writes` scenarios are skipped on PROD.
- **LambdaTest.** With `RUN_ON=lambdatest`, every scenario opens its own session, named after the scenario, with the project's emulation and the brand's country. Pass/fail is sent back to the dashboard. The build name is `<BRAND>-<ENV>-<BUILD_NUMBER|local>`. Workers are capped at `LT_CONCURRENCY`.
  - `LT_REAL_DEVICES=true` runs the mobile projects on real devices (default iPhone 15 / iOS 17 and Pixel 7 / Android 13; override with `LT_IOS_DEVICE`, `LT_IOS_VERSION`, `LT_ANDROID_DEVICE`, `LT_ANDROID_VERSION`). Example: `RUN_ON=lambdatest LT_REAL_DEVICES=true npm test -- --project=mobile-ios`.
  - **Playwright is pinned to 1.53.2** because LambdaTest real devices only accept that version. Do not upgrade `@playwright/test` until LambdaTest supports a newer one, and keep the Jenkins Docker image tag in step.
  - `LT_TUNNEL=true` (+ `LT_TUNNEL_NAME`) if QA/UAT are only reachable from the office network.
- **Reports.** Playwright HTML (`playwright-report/`), JUnit (`results/junit.xml`), Cucumber HTML/JSON (`results/`). Traces on first retry, screenshots and video on failure.

## Adding things

- **A page check:** add the page to `pages` in `data/<BRAND>/common/site.json` (`"sports": { "path": "sports", "titleContains": "..." }`) and use `Given I open the "sports" page` in a feature.
- **A brand:** add `config/brands/<BRAND>.ts`, register it in `config/brands/index.ts` and `BRANDS` in `config/schema.ts`, then add `data/<BRAND>/common/site.json`.
- **An environment URL:** add it to the brand's `envs` map.
- **Login:** fill `data/users/<BRAND>.json` and the `<BRAND>_<ENV>_<ROLE>_PWD` variables, add a login page object, and add a `setup` project that saves `storageState` per role.

## Jenkins

`Jenkinsfile` exposes `BRAND` (or `all`, which runs the three brands as parallel branches with separate reports), `TEST_ENV`, `DEVICE`, `RUN_ON`, `TAGS`, `LT_TUNNEL`, `LT_REAL_DEVICES` and `LT_CONCURRENCY`. Required credentials are `lambdatest` (username/password) and `test-users-<ENV>` (secret file). `BRAND=all` on LambdaTest uses up to 3 × `LT_CONCURRENCY` sessions. Keep the Docker image tag in step with `@playwright/test`.
