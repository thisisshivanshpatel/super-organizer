import { styled } from "@mui/material/styles";
import LinearProgress, {
  linearProgressClasses,
} from "@mui/material/LinearProgress";
import { Button, Chip } from "@mui/material";
import {
  CheckCircle,
  Event as EventIcon,
  EventBusy,
  History,
} from "@mui/icons-material";
import { targetStruct } from "../types";
import { formatCurrency, formatDate, KIND_CONFIG, todayISO } from "../utils";
import { MenuListComposition } from "./generics/MenuList.component";

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 14,
  borderRadius: 7,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: "#f3e3c3",
    ...theme.applyStyles("dark", {
      backgroundColor: theme.palette.grey[800],
    }),
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 7,
    backgroundColor: "#6FAF4F",
  },
}));

type TargetProps = {
  target: targetStruct;
  onAddMoney: (target: targetStruct) => void;
  onHistory: (target: targetStruct) => void;
  onEdit: (target: targetStruct) => void;
  onDelete: (target: targetStruct) => void;
};

export const Target = ({
  target,
  onAddMoney,
  onHistory,
  onEdit,
  onDelete,
}: TargetProps) => {
  const { kind, title, targetNumber, currentNumber, counterparty, dueDate } =
    target;
  const config = KIND_CONFIG[kind];
  const Icon = config.icon;
  const isLoan = kind !== "savings";

  // Progress is shown as a percentage of the target value
  const progressValue = targetNumber
    ? Math.min(100, Math.round((currentNumber / targetNumber) * 100))
    : 0;
  const remaining = Math.max(0, targetNumber - currentNumber);
  const completed = currentNumber >= targetNumber;
  const overdue = isLoan && !completed && !!dueDate && dueDate < todayISO();

  const subtitle = isLoan
    ? `${config.counterpartyLabel} ${counterparty || "—"}`
    : `Target ${formatCurrency(targetNumber)}`;

  return (
    <div
      className="flex flex-col gap-4 rounded-3xl border-t-4 bg-white p-5 shadow-lg shadow-amber-900/5 ring-1 ring-amber-900/5 transition hover:-translate-y-0.5 hover:shadow-xl"
      style={{ borderTopColor: config.accent }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: config.accent }}
          >
            <Icon />
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-stone-800" title={title}>
              {title}
            </h2>
            <p className="truncate text-xs text-stone-500">{subtitle}</p>
          </div>
        </div>
        <MenuListComposition
          onHistory={() => onHistory(target)}
          onEdit={() => onEdit(target)}
          onDelete={() => onDelete(target)}
        />
      </div>

      <div>
        <div className="mb-2 flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold text-stone-800">
              {formatCurrency(isLoan ? remaining : currentNumber)}
            </span>
            {isLoan && (
              <span className="ml-1 text-xs text-stone-500">
                {kind === "debt" ? "left to pay" : "to receive"}
              </span>
            )}
          </div>
          <span className="text-sm font-semibold text-[#4f8a33]">
            {progressValue}%
          </span>
        </div>
        <BorderLinearProgress variant="determinate" value={progressValue} />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
          {completed ? (
            <Chip
              icon={<CheckCircle />}
              label={config.doneLabel}
              color="success"
              size="small"
            />
          ) : isLoan ? (
            <span>
              {formatCurrency(currentNumber)} {config.progressVerb} of{" "}
              {formatCurrency(targetNumber)}
            </span>
          ) : (
            <span>{formatCurrency(remaining)} to go</span>
          )}
          {isLoan && dueDate && !completed && (
            <Chip
              icon={overdue ? <EventBusy /> : <EventIcon />}
              label={`${overdue ? "Overdue" : "Due"} ${formatDate(dueDate)}`}
              color={overdue ? "error" : "default"}
              variant={overdue ? "filled" : "outlined"}
              size="small"
            />
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="contained"
          disableElevation
          fullWidth
          onClick={() => onAddMoney(target)}
          sx={{ borderRadius: 3, py: 1 }}
        >
          {config.actionLabel}
        </Button>
        <Button
          variant="outlined"
          aria-label="Transaction history"
          title="Transaction history"
          onClick={() => onHistory(target)}
          sx={{ borderRadius: 3, minWidth: 48 }}
        >
          <History />
        </Button>
      </div>
    </div>
  );
};
