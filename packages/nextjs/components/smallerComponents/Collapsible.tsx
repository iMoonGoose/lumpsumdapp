"use client";

import { useState, ReactNode } from 'react';

interface CollapsibleProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  disabled = false,
  className = '',
}: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`bg-base-200 rounded-box border border-base-300 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        disabled={disabled}
        className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-base-300 rounded-box transition-colors"
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="p-4 border-t border-base-300">
          {children}
        </div>
      )}
    </div>
  );
}