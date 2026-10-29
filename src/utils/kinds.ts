import { CreditCard, Handshake, Savings } from "@mui/icons-material";
import type { SvgIconComponent } from "@mui/icons-material";
import { targetKind } from "../types";

type kindConfig = {
  label: string;
  pluralLabel: string;
  icon: SvgIconComponent;
  accent: string;
  accentSoft: string;
  titlePlaceholder: string;
  counterpartyLabel: string;
  totalLabel: string;
  progressLabel: string;
  // Past tense used in "₹X repaid of ₹Y"
  progressVerb: string;
  actionLabel: string;
  // Add/withdraw dialog: primary changes the balance, secondary withdraws (savings)
  // or increases the principal (debt/lent)
  primaryMode: string;
  secondaryMode: string;
  primaryNoteHint: string;
  secondaryNoteHint: string;
  doneLabel: string;
};

export const KIND_CONFIG: Record<targetKind, kindConfig> = {
  savings: {
    label: "Savings",
    pluralLabel: "Savings",
    icon: Savings,
    accent: "#F4A21E",
    accentSoft: "#FDF1DA",
    titlePlaceholder: "e.g. Emergency Fund",
    counterpartyLabel: "",
    totalLabel: "Target amount",
    progressLabel: "Already saved",
    progressVerb: "saved",
    actionLabel: "Add / Withdraw",
    primaryMode: "Add money",
    secondaryMode: "Withdraw",
    primaryNoteHint: "e.g. October salary",
    secondaryNoteHint: "e.g. Car repair",
    doneLabel: "Goal reached",
  },
  debt: {
    label: "Debt",
    pluralLabel: "Debts",
    icon: CreditCard,
    accent: "#D9534F",
    accentSoft: "#FBE7E6",
    titlePlaceholder: "e.g. Car loan",
    counterpartyLabel: "Borrowed from",
    totalLabel: "Amount borrowed",
    progressLabel: "Already repaid",
    progressVerb: "repaid",
    actionLabel: "Record payment",
    primaryMode: "Pay back",
    secondaryMode: "Borrow more",
    primaryNoteHint: "e.g. November EMI",
    secondaryNoteHint: "e.g. Top-up loan",
    doneLabel: "Paid off",
  },
  lent: {
    label: "Lent",
    pluralLabel: "Lent",
    icon: Handshake,
    accent: "#2A9D8F",
    accentSoft: "#E0F2EF",
    titlePlaceholder: "e.g. Loan to Rahul",
    counterpartyLabel: "Lent to",
    totalLabel: "Amount lent",
    progressLabel: "Already received back",
    progressVerb: "received",
    actionLabel: "Record repayment",
    primaryMode: "Received",
    secondaryMode: "Lend more",
    primaryNoteHint: "e.g. Paid via UPI",
    secondaryNoteHint: "e.g. Extra for rent",
    doneLabel: "Fully repaid",
  },
};

export const KINDS = Object.keys(KIND_CONFIG) as targetKind[];
