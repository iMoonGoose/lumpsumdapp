"use client";

import { useId, useState } from "react";

type DropdownOption = { option: string; setter: () => any };

export function Dropdown({
  title,
  options,
  className,
}: {
  title: string;
  options: Array<DropdownOption>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const anchorName = `--anchor-${useId().replace(/:/g, "")}`;
  return (
    <details
      className={"dropdown" + (className ? ` ${className}` : "")}
      open={open}
      onToggle={e => setOpen(e.currentTarget.open)}
    >
      <summary style={{ anchorName } as React.CSSProperties} className="btn w-full">
        {title}
        <span aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </summary>
      <ul
        role="listbox"
        className="menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-sm"
        style={
          {
            position: "absolute",
            positionAnchor: anchorName,
            top: "anchor(bottom)",
            left: "anchor(left)",
          } as React.CSSProperties
        }
      >
        {options.map(({ option, setter }, i) => {
          return (
            <li key={`dropdown-${i}-${option}`}>
              <a
                onClick={() => {
                  setOpen(false);
                  setter();
                }}
              >
                {option}
              </a>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
