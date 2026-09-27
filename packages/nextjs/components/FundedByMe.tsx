"use client";

import { FundedEscrowList } from "./smallerComponents/FundedEscrowList";
import { useAppState } from "~~/hooks/appContext";

export const FundedByMe = () => {
  const { isLoading, escrowsFunded, releaseWindowDuration } = useAppState();
  
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
          !escrowsFunded || escrowsFunded.length === 0
          ? <p className="m-0">No escrows found.</p>
          : <FundedEscrowList escrows={escrowsFunded} releaseWindowDuration={releaseWindowDuration}/>
        }
      </div>
  );
};
