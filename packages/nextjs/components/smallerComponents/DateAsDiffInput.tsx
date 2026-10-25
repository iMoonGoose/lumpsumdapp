"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { useAppState } from "~~/hooks/appContext";
import { daysFromTodayToDate, getTommorow, relativeFromToday } from "~~/utils/formatting";

type Props = {
  disabled: boolean;
  sourceValue: string;
  setSourceValue: (v: string) => void;
};

export const DateAsDiffInput = ({ disabled, sourceValue, setSourceValue }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { formatTimestamp } = useAppState();

  const tomorrow = getTommorow();
  const selected = daysFromTodayToDate(Number(sourceValue));

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleInputChange = (value: Date | undefined) => {
    if (!value) return;
    const daysFromToday = relativeFromToday(value);
    if (daysFromToday <= 0) return;
    setSourceValue(`${daysFromToday}`);
    setOpen(false);
  };

  return (
    <div
      ref={ref}
      className="relative flex items-center gap-4 w-full border-2 p-2 text-sui-input-text bg-sui-input-background border-sui-input-border"
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        disabled={disabled}
        className="pl-2 text-left w-full font-medium cursor-pointer hover:opacity-80"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {formatTimestamp(selected.getTime() / 1000, undefined, { year: "numeric", month: "numeric", day: "numeric" })}
      </button>

      {open && (
        <div
          className="bg-base-200 rounded-box shadow-lg border border-base-300 p-4 text-sui-input-text z-50"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "4px",
          }}
        >
          <DayPicker
            mode="single"
            required={true}
            disabled={{ before: tomorrow }}
            selected={selected}
            onSelect={handleInputChange}
            startMonth={tomorrow}
          />
        </div>
      )}
    </div>
  );
};
