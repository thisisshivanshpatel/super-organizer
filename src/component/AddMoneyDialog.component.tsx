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
import { targetStruct } from "../types";
import { formatCurrency } from "../utils";

type AddMoneyDialogProps = {
  target: targetStruct | null;
  onSubmit: (amount: number) => Promise<void>;
  onClose: () => void;
};

type mode = "deposit" | "withdraw";

const QUICK_AMOUNTS = [1000, 5000, 10000];

export const AddMoneyDialog = ({
  target,
  onSubmit,
  onClose,
}: AddMoneyDialogProps) => {
  const [mode, setMode] = useState<mode>("deposit");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (target) {
      setMode("deposit");
      setAmount("");
    }
  }, [target]);

  const value = Number(amount);
  const tooMuch =
    mode === "withdraw" && target !== null && value > target.currentNumber;
  const isValid = value > 0 && !tooMuch;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try {
      await onSubmit(mode === "deposit" ? value : -value);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!target} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>{target?.title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              Saved {formatCurrency(target?.currentNumber ?? 0)} of{" "}
              {formatCurrency(target?.targetNumber ?? 0)}
            </Typography>
            <ToggleButtonGroup
              value={mode}
              exclusive
              fullWidth
              size="small"
              color={mode === "deposit" ? "success" : "warning"}
              onChange={(_, next: mode | null) => next && setMode(next)}
            >
              <ToggleButton value="deposit">Add money</ToggleButton>
              <ToggleButton value="withdraw">Withdraw</ToggleButton>
            </ToggleButtonGroup>
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={tooMuch}
              helperText={tooMuch ? "Cannot withdraw more than saved" : ""}
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
            <Stack direction="row" spacing={1}>
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
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color={mode === "deposit" ? "success" : "warning"}
            disabled={!isValid || submitting}
          >
            {mode === "deposit" ? "Add" : "Withdraw"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
