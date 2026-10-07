import type { Locator, Page, Response } from '@playwright/test';
import { config } from '../../config';
import { Header } from '../components/Header';

/** What every DAZN Bet page shares: the header, the geo-block page, and how it was opened. */
export class BasePage {
  readonly header: Header;
  /** Response of the last main-document navigation made through open(). */
  response: Response | null = null;

  constructor(
    readonly page: Page,
    isMobile: boolean,
  ) {
    this.header = new Header(page, isMobile);
  }

  /** The "Country blocked" page shown outside the brand's market; the text comes from test data. */
  countryBlocked(heading: string): Locator {
    // Plain substring match: LambdaTest's real iOS devices reject exact-text and escaped regex selectors.
    return this.page.getByText(heading).first();
  }

  /** Path relative to the brand base URL ('' = home); never start it with "/" or the locale is lost. */
  async open(path: string): Promise<void> {
    this.response = await this.page.goto(path.replace(/^\//, ''), { waitUntil: config.waitUntil });
  }
}
