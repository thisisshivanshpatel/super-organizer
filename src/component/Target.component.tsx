import { styled } from "@mui/material/styles";
import LinearProgress, {
  linearProgressClasses,
} from "@mui/material/LinearProgress";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import { Button, Chip } from "@mui/material";
import { useState } from "react";
import { targetStruct } from "../types";

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 20,
  borderRadius: 10,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: theme.palette.grey[200],
    ...theme.applyStyles("dark", {
      backgroundColor: theme.palette.grey[800],
    }),
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 10,
    backgroundColor: "#6FAF4F",
    ...theme.applyStyles("dark", {
      backgroundColor: "#6FAF4F",
    }),
  },
}));

export const Target = ({
  id,
  targetNumber,
  currentNumber,
  title,
}: targetStruct) => {
  const [number, setNumber] = useState<number>(currentNumber);

  // Progress is shown as a percentage of the target value
  const progressValue = targetNumber
    ? Math.min(100, Math.round((number / targetNumber) * 100))
    : 0;

  return (
    <div className="flex flex-col justify-center bg-[#FCBF49] p-4 rounded-3xl m-2">
      <h1 className="font-mono font-bold text-amber-50">{title}</h1>
      <BorderLinearProgress variant="determinate" value={progressValue} />
      <div className="flex justify-between flex-wrap mt-2 mb-2 space-y-2">
        <Chip avatar={<CurrencyRupeeIcon />} label={number} />
        <Chip avatar={<CurrencyRupeeIcon />} label={targetNumber} />
      </div>
      <Button
        variant="contained"
        onClick={() =>
          setNumber((prev) => {
            const next = prev + 10000;
            return next <= targetNumber ? next : prev;
          })
        }
      >
        Add Money
      </Button>
    </div>
  );
};
