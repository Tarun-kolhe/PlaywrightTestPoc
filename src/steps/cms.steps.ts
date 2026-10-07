import { expect, Then } from './fixtures';

// Example of asserting the UI against live CMS content instead of hardcoded copy.
// Usage in a feature: Then the "homepage-hero" title from the CMS is shown in "hero-title"
Then(
  'the {string} title from the CMS is shown in {string}',
  async ({ $test, cms, page }, entryId: string, testId: string) => {
    $test.skip(!cms.enabled, 'CMS is not configured for this brand/env');
    const entry = await cms.getEntry(entryId);
    await expect(page.getByTestId(testId)).toHaveText(String(entry.title));
  },
);
