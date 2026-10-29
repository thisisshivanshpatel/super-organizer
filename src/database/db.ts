import { app } from "electron";
import * as path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  targetInput,
  targetKind,
  targetStruct,
  transactionStruct,
  transactionType,
} from "../types";

type targetRow = {
  id: number;
  kind: targetKind;
  title: string;
  target_number: number;
  current_number: number;
  counterparty: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

type transactionRow = {
  id: number;
  target_id: number;
  type: transactionType;
  amount: number;
  balance_after: number;
  total_after: number | null;
  note: string | null;
  created_at: string;
};

const KINDS: targetKind[] = ["savings", "debt", "lent"];

let db: DatabaseSync | null = null;

const toTarget = (row: targetRow): targetStruct => ({
  id: row.id,
  kind: row.kind,
  title: row.title,
  targetNumber: row.target_number,
  currentNumber: row.current_number,
  counterparty: row.counterparty,
  dueDate: row.due_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toTransaction = (row: transactionRow): transactionStruct => ({
  id: row.id,
  targetId: row.target_id,
  type: row.type,
  amount: row.amount,
  balanceAfter: row.balance_after,
  totalAfter: row.total_after,
  note: row.note,
  createdAt: row.created_at,
});

// Adds a column to a table created by an older version of the app
const ensureColumn = (
  conn: DatabaseSync,
  table: string,
  column: string,
  definition: string,
) => {
  const columns = conn.prepare(`PRAGMA table_info(${table})`).all() as {
    name: string;
  }[];
  if (!columns.some((c) => c.name === column)) {
    conn.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

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

    -- Every change to a target's amounts; deleted together with the target
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

  // v2: debts and money lent alongside savings goals
  ensureColumn(
    db,
    "targets",
    "kind",
    "TEXT NOT NULL DEFAULT 'savings' CHECK (kind IN ('savings', 'debt', 'lent'))",
  );
  ensureColumn(db, "targets", "counterparty", "TEXT");
  ensureColumn(db, "targets", "due_date", "TEXT");
  ensureColumn(
    db,
    "transactions",
    "type",
    "TEXT NOT NULL DEFAULT 'balance' CHECK (type IN ('balance', 'principal'))",
  );
  ensureColumn(db, "transactions", "total_after", "REAL");
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
  target: targetStruct,
  type: transactionType,
  amount: number,
  note: string | null,
) => {
  getDb()
    .prepare(
      `INSERT INTO transactions (target_id, type, amount, balance_after, total_after, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      target.id,
      type,
      amount,
      target.currentNumber,
      target.targetNumber,
      note,
    );
};

const validate = (input: targetInput) => {
  const kind = input.kind ?? "savings";
  const title = String(input.title ?? "").trim();
  const targetNumber = Number(input.targetNumber);
  const currentNumber = Number(input.currentNumber ?? 0);
  const isLoan = kind !== "savings";
  const counterparty = isLoan
    ? String(input.counterparty ?? "").trim() || null
    : null;
  const dueDate = isLoan ? input.dueDate || null : null;

  if (!KINDS.includes(kind)) throw new Error(`Unknown type "${kind}"`);
  if (!title) throw new Error("Title is required");
  if (!Number.isFinite(targetNumber) || targetNumber <= 0)
    throw new Error("Amount must be greater than 0");
  if (!Number.isFinite(currentNumber) || currentNumber < 0)
    throw new Error("Paid/saved amount cannot be negative");
  if (isLoan && currentNumber > targetNumber)
    throw new Error("Amount repaid cannot exceed the total amount");
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate))
    throw new Error("Due date must be in YYYY-MM-DD format");

  return { kind, title, targetNumber, currentNumber, counterparty, dueDate };
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
  const { kind, title, targetNumber, currentNumber, counterparty, dueDate } =
    validate(input);
  return inTransaction(() => {
    const result = getDb()
      .prepare(
        `INSERT INTO targets (kind, title, target_number, current_number, counterparty, due_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(kind, title, targetNumber, currentNumber, counterparty, dueDate);
    const created = getTarget(Number(result.lastInsertRowid));

    // Seed the history so it always explains the current amounts
    if (kind !== "savings") {
      recordTransaction(
        { ...created, currentNumber: 0 },
        "principal",
        targetNumber,
        kind === "debt" ? "Borrowed" : "Lent",
      );
    }
    if (currentNumber > 0) {
      recordTransaction(
        created,
        "balance",
        currentNumber,
        kind === "savings" ? "Initial balance" : "Already repaid",
      );
    }
    return created;
  });
};

export const updateTarget = (
  id: number,
  input: targetInput,
): targetStruct => {
  const { kind, title, targetNumber, currentNumber, counterparty, dueDate } =
    validate(input);
  return inTransaction(() => {
    const before = getTarget(id);
    getDb()
      .prepare(
        `UPDATE targets
         SET kind = ?, title = ?, target_number = ?, current_number = ?,
             counterparty = ?, due_date = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .run(
        kind,
        title,
        targetNumber,
        currentNumber,
        counterparty,
        dueDate,
        id,
      );
    const after = getTarget(id);

    const totalDelta = targetNumber - before.targetNumber;
    if (kind !== "savings" && totalDelta !== 0) {
      recordTransaction(
        { ...after, currentNumber: before.currentNumber },
        "principal",
        totalDelta,
        "Total adjusted",
      );
    }
    const balanceDelta = currentNumber - before.currentNumber;
    if (balanceDelta !== 0) {
      recordTransaction(after, "balance", balanceDelta, "Manual adjustment");
    }
    return after;
  });
};

// Adds money to a target (savings deposit or a repayment); negative amounts withdraw
export const addToTarget = (
  id: number,
  amount: number,
  note?: string,
): targetStruct => {
  if (!Number.isFinite(amount) || amount === 0)
    throw new Error("Amount must be a non-zero number");

  return inTransaction(() => {
    const before = getTarget(id);
    const next = before.currentNumber + amount;
    if (next < 0) throw new Error("Cannot withdraw more than the saved amount");
    if (before.kind !== "savings" && next > before.targetNumber)
      throw new Error("Repayment cannot exceed the outstanding amount");

    getDb()
      .prepare(
        `UPDATE targets
         SET current_number = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .run(next, id);
    const after = getTarget(id);
    recordTransaction(after, "balance", amount, note?.trim() || null);
    return after;
  });
};

// Increases the principal of a debt (borrowed more) or of money lent (lent more)
export const addPrincipal = (
  id: number,
  amount: number,
  note?: string,
): targetStruct => {
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error("Amount must be greater than 0");

  return inTransaction(() => {
    const before = getTarget(id);
    if (before.kind === "savings")
      throw new Error("Only debts and money lent have a principal");

    getDb()
      .prepare(
        `UPDATE targets
         SET target_number = target_number + ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .run(amount, id);
    const after = getTarget(id);
    recordTransaction(after, "principal", amount, note?.trim() || null);
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
