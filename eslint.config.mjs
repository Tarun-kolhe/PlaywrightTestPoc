import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['node_modules/', '.features-gen/', 'playwright-report/', 'test-results/', 'results/'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'setup/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-standalone-expect': 'off', // steps call expect outside test()
    },
  },
  {
    rules: {
      'no-empty-pattern': 'off', // Playwright fixtures use ({}, use) =>
    },
  },
);
