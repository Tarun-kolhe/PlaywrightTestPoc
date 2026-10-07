import { mergeTests } from '@playwright/test';
import { createBdd, test as bddTest } from 'playwright-bdd';
import { test as appTest } from '../fixtures/app.fixtures';

export const test = mergeTests(bddTest, appTest);
export const { Given, When, Then, Before, After } = createBdd(test);
export { expect } from '@playwright/test';
