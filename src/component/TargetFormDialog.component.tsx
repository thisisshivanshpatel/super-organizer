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
} from "@mui/material";
import { targetInput, targetStruct } from "../types";

type TargetFormDialogProps = {
  open: boolean;
  // When provided the dialog edits this target, otherwise it creates a new one
  target?: targetStruct | null;
  onSubmit: (input: targetInput) => Promise<void>;
  onClose: () => void;
};

export const TargetFormDialog = ({
  open,
  target,
  onSubmit,
  onClose,
}: TargetFormDialogProps) => {
  const [title, setTitle] = useState("");
  const [targetNumber, setTargetNumber] = useState("");
  const [currentNumber, setCurrentNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(target?.title ?? "");
    setTargetNumber(target ? String(target.targetNumber) : "");
    setCurrentNumber(target ? String(target.currentNumber) : "0");
    setTouched(false);
  }, [open, target]);

  const titleError = touched && !title.trim() ? "Title is required" : "";
  const targetError =
    touched && !(Number(targetNumber) > 0)
      ? "Target must be greater than 0"
      : "";
  const currentError =
    touched && (currentNumber === "" || Number(currentNumber) < 0)
      ? "Saved amount cannot be negative"
      : "";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (
      !title.trim() ||
      !(Number(targetNumber) > 0) ||
      currentNumber === "" ||
      Number(currentNumber) < 0
    ) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        targetNumber: Number(targetNumber),
        currentNumber: Number(currentNumber),
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
        <DialogTitle>{target ? "Edit goal" : "New savings goal"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Title"
              placeholder="e.g. Emergency Fund"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={!!titleError}
              helperText={titleError}
              autoFocus
              fullWidth
            />
            <TextField
              label="Target amount"
              type="number"
              value={targetNumber}
              onChange={(e) => setTargetNumber(e.target.value)}
              error={!!targetError}
              helperText={targetError}
              slotProps={rupee}
              fullWidth
            />
            <TextField
              label="Already saved"
              type="number"
              value={currentNumber}
              onChange={(e) => setCurrentNumber(e.target.value)}
              error={!!currentError}
              helperText={currentError}
              slotProps={rupee}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {target ? "Save changes" : "Create goal"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
