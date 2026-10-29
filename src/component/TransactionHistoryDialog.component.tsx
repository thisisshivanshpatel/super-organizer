import { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import {
  Add,
  ArrowDownward,
  ArrowUpward,
  ReceiptLong,
} from "@mui/icons-material";
import { targetKind, targetStruct, transactionStruct } from "../types";
import { formatCurrency, formatDateTime, getErrorMessage } from "../utils";

type TransactionHistoryDialogProps = {
  target: targetStruct | null;
  onClose: () => void;
};

// Fallback labels for transactions recorded without a note
const DEFAULT_LABELS: Record<targetKind, { in: string; out: string; principal: string }> = {
  savings: { in: "Deposit", out: "Withdrawal", principal: "Target changed" },
  debt: { in: "Payment", out: "Payment reversed", principal: "Borrowed" },
  lent: { in: "Received", out: "Repayment reversed", principal: "Lent" },
};

export const TransactionHistoryDialog = ({
  target,
  onClose,
}: TransactionHistoryDialogProps) => {
  const [transactions, setTransactions] = useState<transactionStruct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    window.electronAPI.targets
      .transactions(target.id)
      .then((rows) => !cancelled && setTransactions(rows))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [target]);

  const kind = target?.kind ?? "savings";
  const isLoan = kind !== "savings";
  const labels = DEFAULT_LABELS[kind];

  const balanceIn = transactions
    .filter((t) => t.type === "balance" && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const balanceOut = transactions
    .filter((t) => t.type === "balance" && t.amount < 0)
    .reduce((sum, t) => sum - t.amount, 0);

  const tiles = !target
    ? []
    : isLoan
      ? [
          {
            label: kind === "debt" ? "Total repaid" : "Received back",
            value: target.currentNumber,
            className: "bg-green-50 text-[#4f8a33]",
          },
          {
            label: kind === "debt" ? "Still owed" : "Still to receive",
            value: Math.max(0, target.targetNumber - target.currentNumber),
            className: "bg-red-50 text-[#b42318]",
          },
        ]
      : [
          {
            label: "Total added",
            value: balanceIn,
            className: "bg-green-50 text-[#4f8a33]",
          },
          {
            label: "Total withdrawn",
            value: balanceOut,
            className: "bg-orange-50 text-[#c2410c]",
          },
        ];

  return (
    <Dialog open={!!target} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {target?.title}
        <span className="block text-sm font-normal text-stone-500">
          Transaction history
          {target?.counterparty && ` · ${target.counterparty}`}
        </span>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <div className="flex justify-center py-10">
            <CircularProgress size={28} />
          </div>
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-stone-500">
            <ReceiptLong fontSize="large" className="mb-2 opacity-60" />
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3">
              {tiles.map((tile) => (
                <div key={tile.label} className={`rounded-2xl p-3 ${tile.className}`}>
                  <p className="text-xs text-stone-500">{tile.label}</p>
                  <p className="font-semibold">{formatCurrency(tile.value)}</p>
                </div>
              ))}
            </div>
            <ul className="divide-y divide-stone-100">
              {transactions.map((t) => {
                const isPrincipal = t.type === "principal";
                const isIn = !isPrincipal && t.amount > 0;
                const label =
                  t.note ||
                  (isPrincipal ? labels.principal : isIn ? labels.in : labels.out);
                const tone = isIn
                  ? "bg-green-100 text-[#4f8a33]"
                  : isPrincipal
                    ? "bg-sky-100 text-[#0369a1]"
                    : "bg-orange-100 text-[#c2410c]";
                const amountTone = isIn
                  ? "text-[#4f8a33]"
                  : isPrincipal
                    ? "text-[#0369a1]"
                    : "text-[#c2410c]";
                // Loans show what is still outstanding; savings show the balance
                const after =
                  isLoan && t.totalAfter !== null
                    ? `Left ${formatCurrency(Math.max(0, t.totalAfter - t.balanceAfter))}`
                    : `Bal. ${formatCurrency(t.balanceAfter)}`;
                return (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`}
                    >
                      {isPrincipal ? (
                        <Add fontSize="small" />
                      ) : isIn ? (
                        <ArrowDownward fontSize="small" />
                      ) : (
                        <ArrowUpward fontSize="small" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-800">
                        {label}
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatDateTime(t.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${amountTone}`}>
                        {t.amount >= 0 ? "+" : "−"}
                        {formatCurrency(Math.abs(t.amount))}
                      </p>
                      <p className="text-xs text-stone-400">{after}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
