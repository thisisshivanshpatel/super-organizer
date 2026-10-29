export type targetStruct = {
  id: number;
  title: string;
  targetNumber: number;
  currentNumber: number;
  createdAt: string;
  updatedAt: string;
};

// Fields the user can create/edit; timestamps and id are managed by the DB
export type targetInput = {
  title: string;
  targetNumber: number;
  currentNumber?: number;
};

export type transactionStruct = {
  id: number;
  targetId: number;
  // Positive for deposits, negative for withdrawals
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
};

export type targetsAPI = {
  list: () => Promise<targetStruct[]>;
  create: (input: targetInput) => Promise<targetStruct>;
  update: (id: number, input: targetInput) => Promise<targetStruct>;
  addAmount: (id: number, amount: number, note?: string) => Promise<targetStruct>;
  transactions: (id: number) => Promise<transactionStruct[]>;
  remove: (id: number) => Promise<void>;
};
