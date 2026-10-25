"use client";

import { useState } from "react";
import { DaisyErrorAlert } from "./smallerComponents/ErrorDisplay";
import { useTranslation } from "react-i18next";
import { useAppState } from "~~/hooks/appContext";
import {
  useCommissionRate,
  useFundHook,
  useFutureCommissionRate,
  useNewCommissionTimespamp,
  usePlanCommissionHook,
  useValidatedAddress,
} from "~~/hooks/lumpsumContract/lumpsumCommon";

export const CommissionManager = () => {
  const { t } = useTranslation();

  const { planCommission, isError: isPlanningErrored, error: planRateError } = usePlanCommissionHook();
  const { dt, error: readTimestampError } = useNewCommissionTimespamp();
  const { rate: futureRate, error: readFutureRateError } = useFutureCommissionRate();
  const { rate, error: readRateError } = useCommissionRate();
  const [newValue, setNewValue] = useState(0);

  const { formatTimestamp } = useAppState();

  const { loading } = useFundHook();

  const handleInputChange = (value: string) => {
    if (value && !/\d*/.test(value)) {
      return;
    }
    setNewValue(Number(value));
  };

  const handlePlanning = () => {
    planCommission(newValue);
  };

  const newRateInput = (
    <>
      {isPlanningErrored && <DaisyErrorAlert error={planRateError} />}
      <div className="flex items-center gap-4 w-full border-2 p-2 text-sui-input-text font-sans bg-sui-input-background border-sui-input-border ">
        <input
          className="flex focus:outline-none items-center gap-4 w-full border-2 p-2 text-sui-input-text font-sans bg-sui-input-background border-sui-input-border"
          placeholder={t("Rate in promille")}
          disabled={loading}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value)}
          value={newValue ? newValue : ""}
        ></input>
        <button className="h-10 btn btn-secondary px-2 w-1/3" onClick={handlePlanning} disabled={loading}>
          {loading && <span className="loading loading-spinner loading-sm"></span>}
          <span>{t("Plan commission")}</span>
        </button>
      </div>
    </>
  );

  return (
    <div>
      <label htmlFor="planning-section">
        <div className="bg-base-200 p-4 rounded-box">
          <table className="table">
            <tbody>
              <tr>
                <th className="w-40 font-medium text-base-content/70">{t("Current rate")}</th>
                <td>
                  {readRateError ? (
                    <DaisyErrorAlert error={readRateError} />
                  ) : (
                    <span className="font-semibold">{rate} ‰</span>
                  )}
                </td>
              </tr>

              <tr>
                <th className="w-40 font-medium text-base-content/70">{t("Rate changes on")}</th>
                <td>
                  {readTimestampError ? (
                    <DaisyErrorAlert error={readTimestampError} />
                  ) : (
                    <span className="font-semibold">{formatTimestamp(dt)}</span>
                  )}
                </td>
              </tr>

              <tr>
                <th className="w-40 font-medium text-base-content/70">{t("Future rate")}</th>
                <td>
                  {readFutureRateError ? (
                    <DaisyErrorAlert error={readFutureRateError} />
                  ) : (
                    <span className="font-semibold">{futureRate} ‰</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-base-200 p-4 rounded-box space-y-3">{newRateInput}</div>
      </label>
    </div>
  );
};
