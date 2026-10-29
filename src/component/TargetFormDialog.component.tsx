import { FormEvent, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { targetInput, targetKind, targetStruct } from "../types";
import { KIND_CONFIG, KINDS } from "../utils";

type TargetFormDialogProps = {
  open: boolean;
  // When provided the dialog edits this target, otherwise it creates a new one
  target?: targetStruct | null;
  // Type preselected when creating (e.g. the tab the user is on)
  defaultKind?: targetKind;
  onSubmit: (input: targetInput) => Promise<void>;
  onClose: () => void;
};

const DIALOG_TITLES: Record<targetKind, string> = {
  savings: "savings goal",
  debt: "debt",
  lent: "money lent",
};

export const TargetFormDialog = ({
  open,
  target,
  defaultKind = "savings",
  onSubmit,
  onClose,
}: TargetFormDialogProps) => {
  const [kind, setKind] = useState<targetKind>(defaultKind);
  const [title, setTitle] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [targetNumber, setTargetNumber] = useState("");
  const [currentNumber, setCurrentNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setKind(target?.kind ?? defaultKind);
    setTitle(target?.title ?? "");
    setCounterparty(target?.counterparty ?? "");
    setTargetNumber(target ? String(target.targetNumber) : "");
    setCurrentNumber(target ? String(target.currentNumber) : "0");
    setDueDate(target?.dueDate ?? "");
    setTouched(false);
  }, [open, target, defaultKind]);

  const config = KIND_CONFIG[kind];
  const isLoan = kind !== "savings";
  const total = Number(targetNumber);
  const current = Number(currentNumber);

  const titleError = !title.trim() ? "Title is required" : "";
  const targetError = !(total > 0) ? "Amount must be greater than 0" : "";
  const currentError =
    currentNumber === "" || current < 0
      ? "Amount cannot be negative"
      : isLoan && total > 0 && current > total
        ? `Cannot exceed the ${config.totalLabel.toLowerCase()}`
        : "";
  const hasErrors = !!(titleError || targetError || currentError);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (hasErrors) return;

    setSubmitting(true);
    try {
      await onSubmit({
        kind,
        title: title.trim(),
        targetNumber: total,
        currentNumber: current,
        counterparty: isLoan ? counterparty.trim() || null : null,
        dueDate: isLoan ? dueDate || null : null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const rupee = {
    input: {
      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
    },
    htmlInput: { min: 0, step: "any" },
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>
          {target ? "Edit" : "New"} {DIALOG_TITLES[kind]}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <ToggleButtonGroup
              value={kind}
              exclusive
              fullWidth
              size="small"
              onChange={(_, next: targetKind | null) => next && setKind(next)}
            >
              {KINDS.map((k) => {
                const Icon = KIND_CONFIG[k].icon;
                return (
                  <ToggleButton
                    key={k}
                    value={k}
                    sx={{
                      gap: 0.75,
                      "&.Mui-selected": {
                        color: KIND_CONFIG[k].accent,
                        backgroundColor: KIND_CONFIG[k].accentSoft,
                      },
                    }}
                  >
                    <Icon fontSize="small" />
                    {KIND_CONFIG[k].label}
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
            <TextField
              label="Title"
              placeholder={config.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={touched && !!titleError}
              helperText={touched && titleError}
              autoFocus
              fullWidth
            />
            {isLoan && (
              <TextField
                label={config.counterpartyLabel}
                placeholder={kind === "debt" ? "Person or bank" : "Person"}
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                fullWidth
              />
            )}
            <TextField
              label={config.totalLabel}
              type="number"
              value={targetNumber}
              onChange={(e) => setTargetNumber(e.target.value)}
              error={touched && !!targetError}
              helperText={touched && targetError}
              slotProps={rupee}
              fullWidth
            />
            <TextField
              label={config.progressLabel}
              type="number"
              value={currentNumber}
              onChange={(e) => setCurrentNumber(e.target.value)}
              error={touched && !!currentError}
              helperText={touched && currentError}
              slotProps={rupee}
              fullWidth
            />
            {isLoan && (
              <TextField
                label="Due date (optional)"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {target ? "Save changes" : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
