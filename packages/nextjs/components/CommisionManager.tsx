"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useCommissionRate, useFundHook, useFutureCommissionRate, useNewCommissionTimespamp, usePlanCommissionHook, useValidatedAddress } from "~~/hooks/lumpsumContract/lumpsumCommon";
import { DaisyErrorAlert } from "./smallerComponents/ErrorDisplay";
import { DAY_IN_SECONDS, formatTimestamp, getTommorow } from "~~/utils/formatting";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { hardhat } from "viem/chains";
import { useHardhatTimeTravel } from "~~/hooks/network";

export const CommissionManager = () => {
  const { planCommission, isError: isPlanningErrored, error: planRateError } = usePlanCommissionHook();
  const { dt, error: readTimestampError, refetch: refetchDt } = useNewCommissionTimespamp();
  const { rate: futureRate, error: readFutureRateError, refetch: refetchFutureRate } = useFutureCommissionRate();
  const { rate, error: readRateError, refetch: refetchCurrent } = useCommissionRate();
  const [ newValue, setNewValue ] = useState(0);
  const [ newDate, setNewDate ] = useState(0);
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const { increaseTime, loading: loadingTime } = useHardhatTimeTravel();

  const {
    loading, 
  } = useFundHook();

  const handleInputChange = (value: string) => {
    if (value && !/\d*/.test(value)) {
        return;
    }
    setNewValue(Number(value));
  }

  const handlePlanning = () => {
    planCommission(newValue);
  };

  const handleDtCheating = async () => {
    await increaseTime(newDate * DAY_IN_SECONDS);
  };

  const handleRefetching = async () => {
    await refetchCurrent();
    await refetchDt();
    await refetchFutureRate();
  };

  const tomorrow = getTommorow();

  const handleDateInputChange = (value: string) => {
    if (value && !/\d*/.test(value)) {
        return;
    }
    setNewDate(Number(value));
  };

  const newRateInput = (
    <>
        {
            isPlanningErrored && <DaisyErrorAlert error={planRateError} />
        }
        <div className="flex items-center gap-4 w-full border-2 p-2 text-sui-input-text font-sans bg-sui-input-background border-sui-input-border ">
          <input
            className="flex focus:outline-none items-center gap-4 w-full border-2 p-2 text-sui-input-text font-sans bg-sui-input-background border-sui-input-border"
            placeholder={"Rate in promille"}
            disabled={loading}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value)}
            value={newValue ? newValue : ""}>
          </input>
          <button className="h-10 btn btn-primary btn-sm px-2 w-1/3" onClick={handlePlanning} disabled={loading}>
              {loading && (
              <span className="loading loading-spinner loading-sm"></span>
              )}
              <span>Plan commission</span>
          </button>
        </div>
    </>
  );

  const cheatDateInput = (
    <div className="flex items-center gap-4 w-full border-2 p-2 text-sui-input-text font-sans bg-sui-input-background border-sui-input-border">
        <input
            className="flex focus:outline-none items-center gap-4 w-full border-2 p-2 text-sui-input-text font-sans bg-sui-input-background border-sui-input-border"
            placeholder={"Skip EVM days"}
            disabled={(loading || loadingTime)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDateInputChange(e.target.value)}
            value={newDate ? newDate : ""}>
        </input>
        <button className="h-10 btn btn-primary btn-sm px-2 w-1/3" onClick={handleDtCheating} disabled={loading}>
            {(loading || loadingTime) && (
            <span className="loading loading-spinner loading-sm"></span>
            )}
            <span>Cheat dt</span>
        </button>
    </div>
  );

  return (
    <div>
      <label htmlFor="planning-section">
        <div className="bg-base-200 p-4 rounded-box">
          <table className="table">
            <tbody>
              <tr>
                <th className="w-40 font-medium text-base-content/70">Current rate</th>
                <td>
                  {readRateError
                    ? <DaisyErrorAlert error={readRateError} />
                    : <span className="font-semibold">{rate} ‰</span>}
                </td>
              </tr>

              <tr>
                <th className="w-40 font-medium text-base-content/70">Rate changes on</th>
                <td>
                  {readTimestampError
                    ? <DaisyErrorAlert error={readTimestampError} />
                    : <span className="font-semibold">{formatTimestamp(dt)}</span>}
                </td>
              </tr>

              <tr>
                <th className="w-40 font-medium text-base-content/70">Future rate</th>
                <td>
                  {readFutureRateError
                    ? <DaisyErrorAlert error={readFutureRateError} />
                    : <span className="font-semibold">{futureRate} ‰</span>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-base-200 p-4 rounded-box space-y-3">
          { newRateInput }
          {
            isLocalNetwork && cheatDateInput
          }
        </div>
        <div className="flex items-center gap-4 w-full p-2 text-sui-input-text font-sans bg-sui-input-background border-sui-input-border ">
          <button className="h-10 btn btn-primary btn-sm px-2 w-full" onClick={handleRefetching} disabled={loading}>
              {loading && (
              <span className="loading loading-spinner loading-sm"></span>
              )}
              <span>Refetch</span>
          </button>
        </div>
      </label>
    </div>
  );
};
