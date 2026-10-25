"use client";

import { FundedEscrowList } from "./smallerComponents/FundedEscrowList";
import { useTranslation } from "react-i18next";
import { useAppState } from "~~/hooks/appContext";

export const FundedByMe = () => {
  const { t } = useTranslation();

  const { isLoadingEscrows, escrowsFunded, releaseWindowDuration } = useAppState();

  if (isLoadingEscrows) {
    return (
      <div className="flex justify-center items-center py-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full flex flex-col items-center justify-center">
      {!escrowsFunded || escrowsFunded.length === 0 ? (
        <p className="m-0">{t("No escrows found")}</p>
      ) : (
        <FundedEscrowList escrows={escrowsFunded} releaseWindowDuration={releaseWindowDuration} />
      )}
    </div>
  );
};
