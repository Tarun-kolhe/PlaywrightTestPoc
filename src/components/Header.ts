import type { Locator, Page } from '@playwright/test';

/** DAZN Bet site header (logo, main navigation). Shared by every page. */
export class Header {
  readonly root: Locator;
  readonly logo: Locator;

  constructor(
    page: Page,
    private readonly isMobile: boolean,
  ) {
    this.root = page.locator('header');
    // Several logo variants exist (desktop/mobile); only one is visible per layout.
    this.logo = this.root.getByRole('img', { name: /daznbet logo/i }).filter({ visible: true }).first();
  }

  /** Opens a main navigation entry (e.g. "Sports"); on mobile the menu is opened first if needed. */
  async goTo(item: string): Promise<void> {
    const entry = this.root
      .getByRole('link', { name: item, exact: true })
      .or(this.root.getByRole('button', { name: item, exact: true }))
      .first();
    if (this.isMobile && !(await entry.isVisible())) {
      await this.root.getByRole('button', { name: /menu/i }).first().click();
    }
    await entry.click();
  }
}
