import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Snackbar,
  LinearProgress,
} from "@mui/material";
import { Add, Savings } from "@mui/icons-material";
import {
  AddMoneyDialog,
  ConfirmDialog,
  Target,
  TargetFormDialog,
} from "./component";
import { targetInput, targetStruct } from "./types";
import { formatCurrency, getErrorMessage } from "./utils";

type toast = { severity: "success" | "error"; message: string } | null;

const api = window.electronAPI.targets;

export const Bundler = () => {
  const [targetData, setTargetData] = useState<Array<targetStruct>>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<toast>(null);

  // Dialog state: which target (if any) each dialog is acting on
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<targetStruct | null>(null);
  const [funding, setFunding] = useState<targetStruct | null>(null);
  const [deleting, setDeleting] = useState<targetStruct | null>(null);

  const notifyError = (error: unknown) =>
    setToast({ severity: "error", message: getErrorMessage(error) });

  const loadTargets = useCallback(async () => {
    try {
      setTargetData(await api.list());
    } catch (error) {
      notifyError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  const replaceTarget = (updated: targetStruct) =>
    setTargetData((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t)),
    );

  const handleSave = async (input: targetInput) => {
    try {
      if (editing) {
        replaceTarget(await api.update(editing.id, input));
        setToast({ severity: "success", message: "Goal updated" });
      } else {
        const created = await api.create(input);
        setTargetData((prev) => [...prev, created]);
        setToast({ severity: "success", message: "Goal created" });
      }
      setFormOpen(false);
    } catch (error) {
      notifyError(error);
    }
  };

  const handleAddAmount = async (amount: number) => {
    if (!funding) return;
    try {
      replaceTarget(await api.addAmount(funding.id, amount));
      setFunding(null);
      setToast({
        severity: "success",
        message: `${amount > 0 ? "Added" : "Withdrew"} ${formatCurrency(Math.abs(amount))}`,
      });
    } catch (error) {
      notifyError(error);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.remove(deleting.id);
      setTargetData((prev) => prev.filter((t) => t.id !== deleting.id));
      setToast({ severity: "success", message: "Goal deleted" });
    } catch (error) {
      notifyError(error);
    } finally {
      setDeleting(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (target: targetStruct) => {
    setEditing(target);
    setFormOpen(true);
  };

  const totals = useMemo(() => {
    const saved = targetData.reduce((sum, t) => sum + t.currentNumber, 0);
    const goal = targetData.reduce((sum, t) => sum + t.targetNumber, 0);
    const completed = targetData.filter(
      (t) => t.currentNumber >= t.targetNumber,
    ).length;
    return {
      saved,
      goal,
      completed,
      progress: goal ? Math.min(100, Math.round((saved / goal) * 100)) : 0,
    };
  }, [targetData]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-800">
            Super Organizer
          </h1>
          <p className="text-sm text-stone-500">
            Track your savings goals in one place
          </p>
        </div>
        <Button
          variant="contained"
          size="large"
          startIcon={<Add />}
          onClick={openCreate}
          sx={{ borderRadius: 3 }}
        >
          New goal
        </Button>
      </header>

      {targetData.length > 0 && (
        <section className="mb-8 grid gap-4 rounded-3xl bg-gradient-to-br from-[#F77F00] to-[#FCBF49] p-6 text-white shadow-lg sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">
              Total saved
            </p>
            <p className="text-2xl font-bold">{formatCurrency(totals.saved)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">
              Total target
            </p>
            <p className="text-2xl font-bold">{formatCurrency(totals.goal)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">
              Goals reached
            </p>
            <p className="text-2xl font-bold">
              {totals.completed} / {targetData.length}
            </p>
          </div>
          <div className="sm:col-span-3">
            <LinearProgress
              variant="determinate"
              value={totals.progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: "rgba(255,255,255,0.35)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                  backgroundColor: "#fff",
                },
              }}
            />
            <p className="mt-1 text-xs opacity-90">
              {totals.progress}% of all goals funded
            </p>
          </div>
        </section>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <CircularProgress />
        </div>
      ) : targetData.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-amber-300 bg-white/50 px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FCBF49] text-white">
            <Savings fontSize="large" />
          </div>
          <h2 className="text-lg font-semibold text-stone-800">
            No savings goals yet
          </h2>
          <p className="mb-6 text-sm text-stone-500">
            Create your first goal to start tracking your progress.
          </p>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Create a goal
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {targetData.map((target) => (
            <Target
              key={target.id}
              target={target}
              onAddMoney={setFunding}
              onEdit={openEdit}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <TargetFormDialog
        open={formOpen}
        target={editing}
        onSubmit={handleSave}
        onClose={() => setFormOpen(false)}
      />
      <AddMoneyDialog
        target={funding}
        onSubmit={handleAddAmount}
        onClose={() => setFunding(null)}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete goal?"
        message={`"${deleting?.title ?? ""}" and its progress will be permanently removed.`}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={() => setToast(null)}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </div>
  );
};
