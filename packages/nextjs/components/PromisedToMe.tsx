"use client";

import { PromisedEscrowList } from "./smallerComponents/PromisedEscrowList";
import { useAppState } from "~~/hooks/appContext";

export const PromisedToMe = () => {
  const { isLoading, escrowsPromised, releaseWindowDuration } = useAppState();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full flex flex-col items-center justify-center">
      {
        !escrowsPromised || escrowsPromised.length === 0
        ? <p className="m-0">No escrows found.</p>
        : <PromisedEscrowList escrows={escrowsPromised} releaseWindowDuration={releaseWindowDuration} />
      }
    </div>
  );
};
