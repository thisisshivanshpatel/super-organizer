import { app } from "electron";
import * as path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { targetInput, targetStruct } from "../types";

type targetRow = {
  id: number;
  title: string;
  target_number: number;
  current_number: number;
  created_at: string;
  updated_at: string;
};

let db: DatabaseSync | null = null;

const toTarget = (row: targetRow): targetStruct => ({
  id: row.id,
  title: row.title,
  targetNumber: row.target_number,
  currentNumber: row.current_number,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Lazily opens the database in the user's app-data folder and runs migrations
const getDb = (): DatabaseSync => {
  if (db) return db;

  const dbPath = path.join(app.getPath("userData"), "super-organizer.db");
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      target_number REAL NOT NULL CHECK (target_number > 0),
      current_number REAL NOT NULL DEFAULT 0 CHECK (current_number >= 0),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
};

const validate = (input: targetInput) => {
  const title = String(input.title ?? "").trim();
  const targetNumber = Number(input.targetNumber);
  const currentNumber = Number(input.currentNumber ?? 0);

  if (!title) throw new Error("Title is required");
  if (!Number.isFinite(targetNumber) || targetNumber <= 0)
    throw new Error("Target amount must be greater than 0");
  if (!Number.isFinite(currentNumber) || currentNumber < 0)
    throw new Error("Saved amount cannot be negative");

  return { title, targetNumber, currentNumber };
};

const getTarget = (id: number): targetStruct => {
  const row = getDb()
    .prepare("SELECT * FROM targets WHERE id = ?")
    .get(id) as targetRow | undefined;
  if (!row) throw new Error(`Target ${id} not found`);
  return toTarget(row);
};

export const listTargets = (): targetStruct[] => {
  const rows = getDb()
    .prepare("SELECT * FROM targets ORDER BY created_at ASC, id ASC")
    .all() as targetRow[];
  return rows.map(toTarget);
};

export const createTarget = (input: targetInput): targetStruct => {
  const { title, targetNumber, currentNumber } = validate(input);
  const result = getDb()
    .prepare(
      "INSERT INTO targets (title, target_number, current_number) VALUES (?, ?, ?)",
    )
    .run(title, targetNumber, currentNumber);
  return getTarget(Number(result.lastInsertRowid));
};

export const updateTarget = (
  id: number,
  input: targetInput,
): targetStruct => {
  const { title, targetNumber, currentNumber } = validate(input);
  const result = getDb()
    .prepare(
      `UPDATE targets
       SET title = ?, target_number = ?, current_number = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .run(title, targetNumber, currentNumber, id);
  if (result.changes === 0) throw new Error(`Target ${id} not found`);
  return getTarget(id);
};

// Adds (or withdraws, if negative) money atomically; the balance never drops below 0
export const addToTarget = (id: number, amount: number): targetStruct => {
  if (!Number.isFinite(amount) || amount === 0)
    throw new Error("Amount must be a non-zero number");
  const result = getDb()
    .prepare(
      `UPDATE targets
       SET current_number = MAX(0, current_number + ?), updated_at = datetime('now')
       WHERE id = ?`,
    )
    .run(amount, id);
  if (result.changes === 0) throw new Error(`Target ${id} not found`);
  return getTarget(id);
};

export const deleteTarget = (id: number): void => {
  getDb().prepare("DELETE FROM targets WHERE id = ?").run(id);
};

export const closeDb = () => {
  db?.close();
  db = null;
};
