import { app } from "electron";
import * as path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { targetInput, targetStruct, transactionStruct } from "../types";

type targetRow = {
  id: number;
  title: string;
  target_number: number;
  current_number: number;
  created_at: string;
  updated_at: string;
};

type transactionRow = {
  id: number;
  target_id: number;
  amount: number;
  balance_after: number;
  note: string | null;
  created_at: string;
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

const toTransaction = (row: transactionRow): transactionStruct => ({
  id: row.id,
  targetId: row.target_id,
  amount: row.amount,
  balanceAfter: row.balance_after,
  note: row.note,
  createdAt: row.created_at,
});

// Lazily opens the database in the user's app-data folder and runs migrations
const getDb = (): DatabaseSync => {
  if (db) return db;

  const dbPath = path.join(app.getPath("userData"), "super-organizer.db");
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      target_number REAL NOT NULL CHECK (target_number > 0),
      current_number REAL NOT NULL DEFAULT 0 CHECK (current_number >= 0),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Every change to a target's saved amount; deleted together with the target
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_id INTEGER NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      balance_after REAL NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_target
      ON transactions (target_id, created_at);
  `);
  return db;
};

// Runs fn inside a SQL transaction so related writes succeed or fail together
const inTransaction = <T>(fn: () => T): T => {
  const conn = getDb();
  conn.exec("BEGIN");
  try {
    const result = fn();
    conn.exec("COMMIT");
    return result;
  } catch (error) {
    conn.exec("ROLLBACK");
    throw error;
  }
};

const recordTransaction = (
  targetId: number,
  amount: number,
  balanceAfter: number,
  note: string | null,
) => {
  getDb()
    .prepare(
      "INSERT INTO transactions (target_id, amount, balance_after, note) VALUES (?, ?, ?, ?)",
    )
    .run(targetId, amount, balanceAfter, note);
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
  return inTransaction(() => {
    const result = getDb()
      .prepare(
        "INSERT INTO targets (title, target_number, current_number) VALUES (?, ?, ?)",
      )
      .run(title, targetNumber, currentNumber);
    const id = Number(result.lastInsertRowid);
    if (currentNumber > 0) {
      recordTransaction(id, currentNumber, currentNumber, "Initial balance");
    }
    return getTarget(id);
  });
};

export const updateTarget = (
  id: number,
  input: targetInput,
): targetStruct => {
  const { title, targetNumber, currentNumber } = validate(input);
  return inTransaction(() => {
    const before = getTarget(id);
    getDb()
      .prepare(
        `UPDATE targets
         SET title = ?, target_number = ?, current_number = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .run(title, targetNumber, currentNumber, id);
    const delta = currentNumber - before.currentNumber;
    if (delta !== 0) {
      recordTransaction(id, delta, currentNumber, "Manual adjustment");
    }
    return getTarget(id);
  });
};

// Adds (or withdraws, if negative) money and records it in the transaction history
export const addToTarget = (
  id: number,
  amount: number,
  note?: string,
): targetStruct => {
  if (!Number.isFinite(amount) || amount === 0)
    throw new Error("Amount must be a non-zero number");

  return inTransaction(() => {
    const before = getTarget(id);
    if (before.currentNumber + amount < 0)
      throw new Error("Cannot withdraw more than the saved amount");

    getDb()
      .prepare(
        `UPDATE targets
         SET current_number = current_number + ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .run(amount, id);
    const after = getTarget(id);
    recordTransaction(id, amount, after.currentNumber, note?.trim() || null);
    return after;
  });
};

export const listTransactions = (targetId: number): transactionStruct[] => {
  const rows = getDb()
    .prepare(
      "SELECT * FROM transactions WHERE target_id = ? ORDER BY created_at DESC, id DESC",
    )
    .all(targetId) as transactionRow[];
  return rows.map(toTransaction);
};

export const deleteTarget = (id: number): void => {
  getDb().prepare("DELETE FROM targets WHERE id = ?").run(id);
};

export const closeDb = () => {
  db?.close();
  db = null;
};
