import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Snackbar,
  Tab,
  Tabs,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import {
  AddMoneyDialog,
  ConfirmDialog,
  Target,
  TargetFormDialog,
  TransactionHistoryDialog,
} from "./component";
import {
  targetInput,
  targetKind,
  targetStruct,
  transactionType,
} from "./types";
import {
  formatCurrency,
  getErrorMessage,
  KIND_CONFIG,
  KINDS,
  todayISO,
} from "./utils";

type toast = { severity: "success" | "error"; message: string } | null;
type filter = "all" | targetKind;

const api = window.electronAPI.targets;

export const Bundler = () => {
  const [targetData, setTargetData] = useState<Array<targetStruct>>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<toast>(null);
  const [filter, setFilter] = useState<filter>("all");

  // Dialog state: which target (if any) each dialog is acting on
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<targetStruct | null>(null);
  const [funding, setFunding] = useState<targetStruct | null>(null);
  const [deleting, setDeleting] = useState<targetStruct | null>(null);
  const [historyOf, setHistoryOf] = useState<targetStruct | null>(null);

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
        setToast({ severity: "success", message: "Changes saved" });
      } else {
        const created = await api.create(input);
        setTargetData((prev) => [...prev, created]);
        setToast({ severity: "success", message: `"${created.title}" created` });
      }
      setFormOpen(false);
    } catch (error) {
      notifyError(error);
    }
  };

  const handleTransaction = async (
    type: transactionType,
    amount: number,
    note: string,
  ) => {
    if (!funding) return;
    const config = KIND_CONFIG[funding.kind];
    try {
      replaceTarget(
        type === "principal"
          ? await api.addPrincipal(funding.id, amount, note)
          : await api.addAmount(funding.id, amount, note),
      );
      const action =
        type === "principal" || amount < 0
          ? config.secondaryMode
          : config.primaryMode;
      setFunding(null);
      setToast({
        severity: "success",
        message: `${action}: ${formatCurrency(Math.abs(amount))}`,
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
      setToast({ severity: "success", message: `"${deleting.title}" deleted` });
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

  const stats = useMemo(() => {
    const today = todayISO();
    const byKind = (kind: targetKind) =>
      targetData.filter((t) => t.kind === kind);
    const outstanding = (items: targetStruct[]) =>
      items.reduce(
        (sum, t) => sum + Math.max(0, t.targetNumber - t.currentNumber),
        0,
      );
    const overdue = (items: targetStruct[]) =>
      items.filter(
        (t) =>
          t.dueDate && t.dueDate < today && t.currentNumber < t.targetNumber,
      ).length;

    const savings = byKind("savings");
    const debts = byKind("debt");
    const lent = byKind("lent");
    const saved = savings.reduce((sum, t) => sum + t.currentNumber, 0);
    const savingsGoal = savings.reduce((sum, t) => sum + t.targetNumber, 0);

    return {
      counts: { savings: savings.length, debt: debts.length, lent: lent.length },
      tiles: [
        {
          kind: "savings" as const,
          label: "Saved",
          value: saved,
          detail: savingsGoal
            ? `${Math.round((saved / savingsGoal) * 100)}% of ${formatCurrency(savingsGoal)}`
            : "No goals yet",
        },
        {
          kind: "debt" as const,
          label: "You owe",
          value: outstanding(debts),
          detail: overdue(debts)
            ? `${overdue(debts)} overdue`
            : `${debts.filter((t) => t.currentNumber < t.targetNumber).length} active`,
          alert: overdue(debts) > 0,
        },
        {
          kind: "lent" as const,
          label: "Owed to you",
          value: outstanding(lent),
          detail: overdue(lent)
            ? `${overdue(lent)} overdue`
            : `${lent.filter((t) => t.currentNumber < t.targetNumber).length} active`,
          alert: overdue(lent) > 0,
        },
      ],
    };
  }, [targetData]);

  const visible =
    filter === "all" ? targetData : targetData.filter((t) => t.kind === filter);
  const defaultKind = filter === "all" ? "savings" : filter;
  const emptyLabel =
    filter === "all"
      ? "Nothing here yet"
      : filter === "savings"
        ? "No savings goals yet"
        : filter === "debt"
          ? "No debts — nice!"
          : "You haven't lent money to anyone";
  const EmptyIcon = KIND_CONFIG[defaultKind].icon;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-800">
            Super Organizer
          </h1>
          <p className="text-sm text-stone-500">
            Savings, debts and money lent — all in one place
          </p>
        </div>
        <Button
          variant="contained"
          size="large"
          startIcon={<Add />}
          onClick={openCreate}
          sx={{ borderRadius: 3 }}
        >
          New
        </Button>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        {stats.tiles.map((tile) => {
          const config = KIND_CONFIG[tile.kind];
          const Icon = config.icon;
          const selected = filter === tile.kind;
          return (
            <button
              key={tile.kind}
              type="button"
              onClick={() => setFilter(selected ? "all" : tile.kind)}
              className="rounded-3xl bg-white p-5 text-left shadow-lg shadow-amber-900/5 ring-2 transition hover:-translate-y-0.5"
              style={{ ["--tw-ring-color" as string]: selected ? config.accent : "transparent" }}
            >
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{ backgroundColor: config.accentSoft, color: config.accent }}
                >
                  <Icon fontSize="small" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  {tile.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-stone-800">
                {formatCurrency(tile.value)}
              </p>
              <p
                className={`mt-1 text-xs ${
                  "alert" in tile && tile.alert
                    ? "font-semibold text-red-600"
                    : "text-stone-500"
                }`}
              >
                {tile.detail}
              </p>
            </button>
          );
        })}
      </section>

      <Tabs
        value={filter}
        onChange={(_, next: filter) => setFilter(next)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 3, "& .MuiTab-root": { textTransform: "none", fontWeight: 600 } }}
      >
        <Tab value="all" label={`All (${targetData.length})`} />
        {KINDS.map((kind) => (
          <Tab
            key={kind}
            value={kind}
            label={`${KIND_CONFIG[kind].pluralLabel} (${stats.counts[kind]})`}
          />
        ))}
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-20">
          <CircularProgress />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-amber-300 bg-white/50 px-6 py-16 text-center">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: KIND_CONFIG[defaultKind].accent }}
          >
            <EmptyIcon fontSize="large" />
          </div>
          <h2 className="text-lg font-semibold text-stone-800">{emptyLabel}</h2>
          <p className="mb-6 text-sm text-stone-500">
            Track savings goals, money you owe and money owed to you.
          </p>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Add {filter === "all" ? "one" : KIND_CONFIG[defaultKind].label.toLowerCase()}
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((target) => (
            <Target
              key={target.id}
              target={target}
              onAddMoney={setFunding}
              onHistory={setHistoryOf}
              onEdit={openEdit}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <TargetFormDialog
        open={formOpen}
        target={editing}
        defaultKind={defaultKind}
        onSubmit={handleSave}
        onClose={() => setFormOpen(false)}
      />
      <AddMoneyDialog
        target={funding}
        onSubmit={handleTransaction}
        onClose={() => setFunding(null)}
      />
      <TransactionHistoryDialog
        target={historyOf}
        onClose={() => setHistoryOf(null)}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete?"
        message={`"${deleting?.title ?? ""}" and its transaction history will be permanently removed.`}
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
