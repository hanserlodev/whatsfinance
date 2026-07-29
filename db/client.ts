import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { seedDefaults } from './seed';

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '..', 'data', 'whatsfinance.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initSchema();
  return db;
}

function initSchema(): void {
  const sqlPath = path.resolve(__dirname, 'schema.sql');
  const schema = fs.readFileSync(sqlPath, 'utf-8');
  const d = getDb();
  d.exec(schema);

  const count = d.prepare('select count(*) as c from categories').get() as { c: number };
  if (count.c === 0) {
    seedDefaults(d);
  }
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}