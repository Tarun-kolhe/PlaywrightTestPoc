import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// Local: .env in the repo root (git-ignored).
// Jenkins: a "Secret file" credential exposed as USERS_ENV_FILE.
// Variables already set in the process (e.g. Jenkins withCredentials) always win.
const files = [path.resolve(process.cwd(), '.env'), process.env.USERS_ENV_FILE].filter(
  (f): f is string => !!f && fs.existsSync(f),
);
for (const file of files) dotenv.config({ path: file, quiet: true });
