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

export type targetsAPI = {
  list: () => Promise<targetStruct[]>;
  create: (input: targetInput) => Promise<targetStruct>;
  update: (id: number, input: targetInput) => Promise<targetStruct>;
  addAmount: (id: number, amount: number) => Promise<targetStruct>;
  remove: (id: number) => Promise<void>;
};
