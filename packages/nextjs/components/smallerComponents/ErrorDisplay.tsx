"use client";

import { getParsedError } from "~~/utils/scaffold-eth";

type DaisyErrorAlertProps = {
  error: unknown;
  onRetry?: () => void;
  onDismiss?: () => void;
};

export function DaisyErrorAlert({ error, onRetry, onDismiss }: DaisyErrorAlertProps) {
  const message = typeof error === "string" ? error : getParsedError(error);

  return (
    <div role="alert" className="alert alert-error alert-soft my-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 shrink-0 stroke-current"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div className="flex-1">
        <h3 className="font-bold">Error</h3>
        <div className="text-xs">{message}</div>
      </div>
      <div className="flex-none gap-2">
        {onRetry && (
          <button className="btn btn-sm btn-ghost" onClick={onRetry}>
            Retry
          </button>
        )}
        {onDismiss && (
          <button className="btn btn-sm btn-ghost" onClick={onDismiss}>
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
