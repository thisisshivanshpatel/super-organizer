// savings: money set aside towards a goal
// debt:    money I owe (borrowed from a person or a loan)
// lent:    money someone owes me
export type targetKind = "savings" | "debt" | "lent";

export type targetStruct = {
  id: number;
  kind: targetKind;
  title: string;
  // Savings: the goal amount. Debt/lent: the total principal borrowed/lent
  targetNumber: number;
  // Savings: amount saved. Debt/lent: amount repaid so far
  currentNumber: number;
  // Lender (debt) or borrower (lent); unused for savings
  counterparty: string | null;
  // YYYY-MM-DD; unused for savings
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

// Fields the user can create/edit; timestamps and id are managed by the DB
export type targetInput = {
  kind?: targetKind;
  title: string;
  targetNumber: number;
  currentNumber?: number;
  counterparty?: string | null;
  dueDate?: string | null;
};

// balance:   changes currentNumber (deposit/withdrawal or a repayment)
// principal: changes targetNumber (borrowed more / lent more)
export type transactionType = "balance" | "principal";

export type transactionStruct = {
  id: number;
  targetId: number;
  type: transactionType;
  // Positive increases the affected number, negative decreases it
  amount: number;
  balanceAfter: number;
  // Target/principal after this transaction; null for rows recorded before it was tracked
  totalAfter: number | null;
  note: string | null;
  createdAt: string;
};

export type targetsAPI = {
  list: () => Promise<targetStruct[]>;
  create: (input: targetInput) => Promise<targetStruct>;
  update: (id: number, input: targetInput) => Promise<targetStruct>;
  addAmount: (id: number, amount: number, note?: string) => Promise<targetStruct>;
  addPrincipal: (
    id: number,
    amount: number,
    note?: string,
  ) => Promise<targetStruct>;
  transactions: (id: number) => Promise<transactionStruct[]>;
  remove: (id: number) => Promise<void>;
};
