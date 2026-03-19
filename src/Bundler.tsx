import React, { useState } from "react";
import { MenuListComposition, Target } from "./component";
import { targetStruct } from "./types";
import { Button } from "@mui/material";
import { Add } from "@mui/icons-material";

export const Bundler = () => {
  const [targetData, setTargetData] = useState<Array<targetStruct>>([
    {
      id: Date.now().toString(),
      title: "Emergency Fund",
      targetNumber: 600000,
      currentNumber: 6500,
    },
    {
      id: Date.now().toString(),
      title: "Immediate Fund",
      targetNumber: 600000,
      currentNumber: 6500,
    },
  ]);

  return (
    <>
      <Button
        variant="contained"
        endIcon={<Add />}
        onClick={() =>
          setTargetData((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              title: "Add title",
              targetNumber: 100,
              currentNumber: 0,
            },
          ])
        }
      >
        Add
      </Button>

      {targetData &&
        targetData.map((key) => (
          <Target
            key={key.id}
            id={key.id}
            targetNumber={key.targetNumber}
            currentNumber={key.currentNumber}
            title={key.title}
          />
        ))}
      {/* <div className="m-3 grid gap-4 sm:grid-cols-12">
        <div className="col-span-12 min-h-25 rounded bg-orange-500 shadow-2xl sm:col-span-6"></div>
        <div className="min-h-25 rounded bg-orange-500 shadow-2xl sm:col-span-6 sm:block hidden"></div>
        <div className="col-span-6 min-h-25 rounded bg-teal-500 shadow-2xl sm:col-span-3"></div>
        <div className="col-span-6 min-h-25 rounded bg-amber-400 shadow-2xl sm:col-span-3"></div>
      </div> */}
    </>
  );
};
