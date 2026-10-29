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
  Typography,
} from "@mui/material";
import { targetStruct, transactionType } from "../types";
import { formatCurrency, KIND_CONFIG } from "../utils";

type AddMoneyDialogProps = {
  target: targetStruct | null;
  // amount is signed for balance changes; principal changes are always positive
  onSubmit: (type: transactionType, amount: number, note: string) => Promise<void>;
  onClose: () => void;
};

type mode = "primary" | "secondary";

const QUICK_AMOUNTS = [1000, 5000, 10000];

export const AddMoneyDialog = ({
  target,
  onSubmit,
  onClose,
}: AddMoneyDialogProps) => {
  const [mode, setMode] = useState<mode>("primary");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (target) {
      setMode("primary");
      setAmount("");
      setNote("");
    }
  }, [target]);

  const kind = target?.kind ?? "savings";
  const config = KIND_CONFIG[kind];
  const isLoan = kind !== "savings";
  const outstanding = target ? target.targetNumber - target.currentNumber : 0;

  const value = Number(amount);
  let limitError = "";
  if (target && kind === "savings" && mode === "secondary" && value > target.currentNumber)
    limitError = "Cannot withdraw more than saved";
  if (target && isLoan && mode === "primary" && value > outstanding)
    limitError = `Only ${formatCurrency(outstanding)} is outstanding`;
  const isValid = value > 0 && !limitError;

  // Positive outcome (saving / getting closer to settled) uses the success color
  const positive = mode === "primary";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try {
      if (mode === "primary") await onSubmit("balance", value, note);
      else if (isLoan) await onSubmit("principal", value, note);
      else await onSubmit("balance", -value, note);
    } finally {
      setSubmitting(false);
    }
  };

  const summary = target
    ? isLoan
      ? `${formatCurrency(outstanding)} outstanding of ${formatCurrency(target.targetNumber)}`
      : `Saved ${formatCurrency(target.currentNumber)} of ${formatCurrency(target.targetNumber)}`
    : "";

  return (
    <Dialog open={!!target} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>{target?.title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              {summary}
              {target?.counterparty && ` · ${config.counterpartyLabel} ${target.counterparty}`}
            </Typography>
            <ToggleButtonGroup
              value={mode}
              exclusive
              fullWidth
              size="small"
              color={positive ? "success" : "warning"}
              onChange={(_, next: mode | null) => next && setMode(next)}
            >
              <ToggleButton value="primary">{config.primaryMode}</ToggleButton>
              <ToggleButton value="secondary">{config.secondaryMode}</ToggleButton>
            </ToggleButtonGroup>
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={!!limitError}
              helperText={limitError}
              autoFocus
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                },
                htmlInput: { min: 0, step: "any" },
              }}
            />
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {QUICK_AMOUNTS.map((quick) => (
                <Button
                  key={quick}
                  size="small"
                  variant="outlined"
                  onClick={() => setAmount(String(quick))}
                >
                  {formatCurrency(quick)}
                </Button>
              ))}
              {isLoan && mode === "primary" && outstanding > 0 && (
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={() => setAmount(String(outstanding))}
                >
                  Full {formatCurrency(outstanding)}
                </Button>
              )}
            </Stack>
            <TextField
              label="Note (optional)"
              placeholder={
                mode === "primary" ? config.primaryNoteHint : config.secondaryNoteHint
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 200 } }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color={positive ? "success" : "warning"}
            disabled={!isValid || submitting}
          >
            {mode === "primary" ? config.primaryMode : config.secondaryMode}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
