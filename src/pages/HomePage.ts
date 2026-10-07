import type { Page } from '@playwright/test';
import { SportsbookIframe } from '../components/SportsbookIframe';
import { BasePage } from './BasePage';

/** DAZN Bet home page (the brand base URL, e.g. /en-gb/): header + embedded sportsbook. */
export class HomePage extends BasePage {
  readonly sportsbook: SportsbookIframe;

  constructor(page: Page, isMobile: boolean) {
    super(page, isMobile);
    this.sportsbook = new SportsbookIframe(page);
  }
}
