import { styled } from "@mui/material/styles";
import LinearProgress, {
  linearProgressClasses,
} from "@mui/material/LinearProgress";
import { Button, Chip } from "@mui/material";
import { CheckCircle, Savings } from "@mui/icons-material";
import { targetStruct } from "../types";
import { formatCurrency } from "../utils";
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
  onEdit: (target: targetStruct) => void;
  onDelete: (target: targetStruct) => void;
};

export const Target = ({ target, onAddMoney, onEdit, onDelete }: TargetProps) => {
  const { title, targetNumber, currentNumber } = target;

  // Progress is shown as a percentage of the target value
  const progressValue = targetNumber
    ? Math.min(100, Math.round((currentNumber / targetNumber) * 100))
    : 0;
  const remaining = Math.max(0, targetNumber - currentNumber);
  const completed = currentNumber >= targetNumber;

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-lg shadow-amber-900/5 ring-1 ring-amber-900/5 transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FCBF49] text-white">
            <Savings />
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-stone-800" title={title}>
              {title}
            </h2>
            <p className="text-xs text-stone-500">
              Target {formatCurrency(targetNumber)}
            </p>
          </div>
        </div>
        <MenuListComposition
          onEdit={() => onEdit(target)}
          onDelete={() => onDelete(target)}
        />
      </div>

      <div>
        <div className="mb-2 flex items-end justify-between">
          <span className="text-2xl font-bold text-stone-800">
            {formatCurrency(currentNumber)}
          </span>
          <span className="text-sm font-semibold text-[#4f8a33]">
            {progressValue}%
          </span>
        </div>
        <BorderLinearProgress variant="determinate" value={progressValue} />
        <div className="mt-2 text-xs text-stone-500">
          {completed ? (
            <Chip
              icon={<CheckCircle />}
              label="Goal reached"
              color="success"
              size="small"
            />
          ) : (
            <>{formatCurrency(remaining)} to go</>
          )}
        </div>
      </div>

      <Button
        variant="contained"
        disableElevation
        onClick={() => onAddMoney(target)}
        sx={{ borderRadius: 3, py: 1 }}
      >
        Add / Withdraw
      </Button>
    </div>
  );
};
