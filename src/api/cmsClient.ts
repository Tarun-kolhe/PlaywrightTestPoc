import type { APIRequestContext, PlaywrightWorkerArgs } from '@playwright/test';
import type { AppConfig } from '../../config';

export type CmsEntry = Record<string, unknown> & { id: string };

/**
 * Reads live CMS content for the current brand + environment, so assertions compare
 * the UI with the CMS instead of hardcoded copy.
 *
 * The request shape below follows a Contentful-style delivery API
 * (/spaces/{space}/environments/{env}/entries/{id}). Adjust getEntry() once the
 * team confirms which CMS is used.
 */
export class CmsClient {
  private constructor(private readonly api: APIRequestContext | undefined, private readonly cfg: AppConfig) {}

  static async create(playwright: PlaywrightWorkerArgs['playwright'], cfg: AppConfig): Promise<CmsClient> {
    if (!cfg.cms) return new CmsClient(undefined, cfg);
    const token = process.env[cfg.cms.tokenKey];
    if (!token) throw new Error(`Missing CMS token "${cfg.cms.tokenKey}" for ${cfg.brand}/${cfg.env}`);
    const api = await playwright.request.newContext({
      baseURL: cfg.cms.baseUrl,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    });
    return new CmsClient(api, cfg);
  }

  get enabled(): boolean {
    return !!this.api;
  }

  async getEntry(id: string): Promise<CmsEntry> {
    if (!this.api || !this.cfg.cms) {
      throw new Error(`CMS is not configured for ${this.cfg.brand}/${this.cfg.env}. Add "cms" to the brand config.`);
    }
    const { spaceId, environment } = this.cfg.cms;
    const res = await this.api.get(`spaces/${spaceId}/environments/${environment}/entries/${id}`, {
      params: { locale: this.cfg.locale },
    });
    if (!res.ok()) throw new Error(`CMS entry "${id}" failed: ${res.status()} ${await res.text()}`);
    const body = (await res.json()) as { sys: { id: string }; fields: Record<string, unknown> };
    return { id: body.sys.id, ...body.fields };
  }

  async dispose(): Promise<void> {
    await this.api?.dispose();
  }
}
