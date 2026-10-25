"use client";

import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

type TipOptions = { text: string; className?: string };

export function Tip({ text, className }: TipOptions) {
  return (
    <span className={"tooltip tooltip-secondary" + (className ? ` ${className}` : "")} data-tip={text}>
      <QuestionMarkCircleIcon className="h-5 w-5" />
    </span>
  );
}
