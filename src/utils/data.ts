import fs from 'node:fs';
import path from 'node:path';
import { config } from '../../config';

function readJson(file: string): Record<string, unknown> {
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>) : {};
}

/**
 * Static test data: data/<BRAND>/common/<name>.json, with top-level keys overridden by
 * data/<BRAND>/<ENV>/<name>.json (e.g. data/DAZN_UK/QA/site.json).
 */
export function getData<T>(name: string): T {
  const common = path.resolve('data', config.brand, 'common', `${name}.json`);
  const perEnv = path.resolve('data', config.brand, config.env, `${name}.json`);
  if (!fs.existsSync(common) && !fs.existsSync(perEnv)) {
    throw new Error(`No "${name}" data for ${config.brand}/${config.env} (looked in ${common} and ${perEnv})`);
  }
  return { ...readJson(common), ...readJson(perEnv) } as T;
}

/** Looks a key up in test data, with a clear error when a feature file refers to an unknown key. */
export function dataByKey<T>(table: Record<string, T>, key: string, name: string): T {
  const value = table[key];
  if (value === undefined) {
    throw new Error(`Unknown ${name} "${key}" for ${config.brand}/${config.env}. Known: ${Object.keys(table).join(', ')}`);
  }
  return value;
}
