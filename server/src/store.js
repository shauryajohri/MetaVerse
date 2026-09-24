// Tiny persistent store: the whole dataset lives in data/db.json and is rewritten on every change.
// Stand-in for PostgreSQL — fine for a demo with one server process, not for real traffic.

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { seed } from './seed.js';

const DIR = new URL('../data/', import.meta.url);
const FILE = new URL('db.json', DIR);
const TMP = new URL('db.json.tmp', DIR);

export const db = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : seed();

export function save() {
  mkdirSync(DIR, { recursive: true });
  // write-then-rename so a crash mid-write can't leave a half-written file
  writeFileSync(TMP, JSON.stringify(db, null, 2));
  renameSync(TMP, FILE);
}

if (!existsSync(FILE)) save();
