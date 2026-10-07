import fs from 'node:fs';
import path from 'node:path';
import { config } from '../../config';

type UserEntry = {
  username: string;
  /** Name of the env var that holds the password. */
  secretKey: string;
  /** false = never log in during setup (e.g. a locked-out account). */
  session?: boolean;
};
type UsersFile = Partial<Record<string, Record<string, UserEntry | UserEntry[]>>>;

export type User = {
  role: string;
  username: string;
  password: string;
  /** Pool slot, so parallel workers use different accounts. */
  slot: number;
  /** storageState file for this account, written by setup/auth.setup.ts. */
  authFile: string;
};

const AUTH_DIR = path.resolve('.auth');

function loadCatalog(): Record<string, UserEntry[]> {
  const file = path.resolve('data', 'users', `${config.brand}.json`);
  if (!fs.existsSync(file)) throw new Error(`No user catalog for ${config.brand}: ${file}`);
  const all = JSON.parse(fs.readFileSync(file, 'utf8')) as UsersFile;
  const forEnv = all[config.env];
  if (!forEnv) throw new Error(`No users for ${config.brand}/${config.env} in ${file}`);
  return Object.fromEntries(
    Object.entries(forEnv).map(([role, entry]) => [role, Array.isArray(entry) ? entry : [entry]]),
  );
}

function toUser(role: string, entry: UserEntry, slot: number): User {
  const password = process.env[entry.secretKey];
  if (!password) {
    throw new Error(
      `Missing secret "${entry.secretKey}" for ${config.brand}/${config.env}/${role}. ` +
        'Add it to .env locally or to Jenkins Credentials in CI.',
    );
  }
  return {
    role,
    username: entry.username,
    password,
    slot,
    authFile: path.join(AUTH_DIR, `${config.brand}-${config.env}-${role}-${slot}.json`),
  };
}

/** The account for a role. Pass testInfo.parallelIndex so workers never share an account. */
export function getUser(role: string, parallelIndex = 0): User {
  const catalog = loadCatalog();
  const pool = catalog[role];
  if (!pool?.length) {
    throw new Error(
      `Unknown role "${role}" for ${config.brand}/${config.env}. Known roles: ${Object.keys(catalog).join(', ')}`,
    );
  }
  const slot = parallelIndex % pool.length;
  return toUser(role, pool[slot], slot);
}

/** Every account that setup should log in once and save a session for. */
export function sessionUsers(): User[] {
  return Object.entries(loadCatalog()).flatMap(([role, pool]) =>
    pool.flatMap((entry, slot) => (entry.session === false ? [] : [toUser(role, entry, slot)])),
  );
}
