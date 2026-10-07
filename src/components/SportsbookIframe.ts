import type { Frame, Locator, Page } from '@playwright/test';

export type SportsbookState = {
  visible: boolean;
  url: string;
  title: string;
  /** Number of elements rendered inside the iframe; the real sportsbook renders thousands. */
  elements: number;
};

/**
 * The embedded Pragmatic sportsbook (#pragmaticSportsIframe) that fills the home page under the header.
 * Uses ElementHandle/Frame APIs rather than frameLocator() so it also works on LambdaTest real iOS devices.
 */
export class SportsbookIframe {
  readonly iframe: Locator;

  /** Fewer elements than this means the app inside the iframe didn't render (error page, blank). */
  static readonly MIN_ELEMENTS = 200;
  /** Iframe page titles that mean the sportsbook backend failed (e.g. "503 Service Temporarily Unavailable"). */
  static readonly ERROR_TITLE = /\b[45]\d\d\b|error|unavailable|not found|bad gateway/i;

  constructor(page: Page) {
    this.iframe = page.locator('#pragmaticSportsIframe');
  }

  private async frame(): Promise<Frame | null> {
    const handle = await this.iframe.elementHandle({ timeout: 1_000 }).catch(() => null);
    return handle ? handle.contentFrame() : null;
  }

  /** Snapshot of what the iframe currently shows. */
  async state(): Promise<SportsbookState> {
    const visible = await this.iframe.isVisible();
    const frame = await this.frame();
    if (!frame) return { visible, url: '', title: '', elements: 0 };
    const inner = await frame
      .evaluate(() => ({ title: document.title, elements: document.querySelectorAll('*').length }))
      .catch(() => undefined);
    // LambdaTest real iOS devices return nothing from evaluate() inside cross-origin iframes;
    // fall back to the Frame/Locator APIs there.
    const title = typeof inner?.title === 'string' ? inner.title : await frame.title().catch(() => '');
    const elements =
      typeof inner?.elements === 'number' ? inner.elements : await frame.locator('body *').count().catch(() => 0);
    return { visible, url: frame.url(), title: title ?? '', elements: elements ?? 0 };
  }

  static isHealthy(s: SportsbookState): boolean {
    return s.visible && !SportsbookIframe.ERROR_TITLE.test(s.title) && s.elements >= SportsbookIframe.MIN_ELEMENTS;
  }
}
