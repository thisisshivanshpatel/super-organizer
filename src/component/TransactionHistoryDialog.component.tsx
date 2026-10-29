import { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { ArrowDownward, ArrowUpward, ReceiptLong } from "@mui/icons-material";
import { targetStruct, transactionStruct } from "../types";
import { formatCurrency, formatDateTime, getErrorMessage } from "../utils";

type TransactionHistoryDialogProps = {
  target: targetStruct | null;
  onClose: () => void;
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

  const deposited = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const withdrawn = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum - t.amount, 0);

  return (
    <Dialog open={!!target} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {target?.title}
        <span className="block text-sm font-normal text-stone-500">
          Transaction history
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
              <div className="rounded-2xl bg-green-50 p-3">
                <p className="text-xs text-stone-500">Total added</p>
                <p className="font-semibold text-[#4f8a33]">
                  {formatCurrency(deposited)}
                </p>
              </div>
              <div className="rounded-2xl bg-orange-50 p-3">
                <p className="text-xs text-stone-500">Total withdrawn</p>
                <p className="font-semibold text-[#c2410c]">
                  {formatCurrency(withdrawn)}
                </p>
              </div>
            </div>
            <ul className="divide-y divide-stone-100">
              {transactions.map((t) => {
                const isDeposit = t.amount > 0;
                return (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        isDeposit
                          ? "bg-green-100 text-[#4f8a33]"
                          : "bg-orange-100 text-[#c2410c]"
                      }`}
                    >
                      {isDeposit ? (
                        <ArrowDownward fontSize="small" />
                      ) : (
                        <ArrowUpward fontSize="small" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-800">
                        {t.note || (isDeposit ? "Deposit" : "Withdrawal")}
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatDateTime(t.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          isDeposit ? "text-[#4f8a33]" : "text-[#c2410c]"
                        }`}
                      >
                        {isDeposit ? "+" : "−"}
                        {formatCurrency(Math.abs(t.amount))}
                      </p>
                      <p className="text-xs text-stone-400">
                        Bal. {formatCurrency(t.balanceAfter)}
                      </p>
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
