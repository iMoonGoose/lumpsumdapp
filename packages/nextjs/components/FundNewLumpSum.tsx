"use client";

import { useState } from "react";
import { AddressInput } from "@scaffold-ui/components";
import { Address as AddressType, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useFundHook, useValidatedAddress } from "~~/hooks/lumpsumContract/lumpsumCommon";
import { DaisyErrorAlert } from "./smallerComponents/ErrorDisplay";
import { EtherInput } from "./smallerComponents/EtherInput";
import { DateAsDiffInput } from "./smallerComponents/DateAsDiffInput";
import { useBalance } from "wagmi";

export const FundNewLumpSum = () => {
  const { isConnected, address: giverAddress, chain } = useAccount();
  const [sourceValue, setSourceValue] = useState("");
  const { data: giversBalance, isLoading, isError: balanceError } = useBalance({
    address: giverAddress,
    chainId: chain?.id,
    query: {
      enabled: Boolean(isConnected && giverAddress && chain),
      staleTime: 10_000
    },
  });

  const {
    fundLumpSum,
    isError,
    error,
    loading, 
    granteeAddress,
    setGranteeAddress,
    daysToMature,
    setDaysToMature,
    sendValue,
    setSendValue,
  } = useFundHook();

  const { isValidAddress, checkSumAddress } = useValidatedAddress(granteeAddress);

  const handleFunding = () => {
    fundLumpSum();
    setDaysToMature("1");
    setGranteeAddress("");
    setSourceValue("");
  };

  const buttonText = Number(sendValue) <= 0
    ? 'Input amount to put on escrow'
    : !isValidAddress
      ? 'Enter valid grantee address'
      : checkSumAddress === giverAddress
        ? 'Grantee must be someone else'
        : isLoading || balanceError || typeof giversBalance === 'undefined'
          ? 'Waiting for balance info'
          : parseEther(sendValue) > giversBalance.value
            ? 'Not enough funds'
            : 'Send';

  return (
    <div>
      <label htmlFor="funding-section">
        {
            isError && <DaisyErrorAlert error={error} />
        }
        <div className="bg-base-200 p-4 rounded-box">
          <label>
              <div className="space-y-3">
                  <div className="flex flex-col space-y-3">
                    <AddressInput
                        placeholder="Grantee Address"
                        value={granteeAddress ?? ""}
                        onChange={value => setGranteeAddress(value as AddressType)}
                    />
                    <DateAsDiffInput
                        disabled={!isConnected}
                        sourceValue={daysToMature}
                        setSourceValue={setDaysToMature}
                    />
                    <EtherInput
                        onValueChange={({ valueInEth }) => {setSendValue(valueInEth)}}
                        sourceValue={sourceValue}
                        setSourceValue={setSourceValue}
                        disabled={!isConnected}
                    />
                  </div>
              </div>
          </label>
        </div>
        <div className="w-full">
            <button className="h-10 btn btn-primary btn-sm px-2 w-full" onClick={handleFunding} disabled={loading || buttonText !== 'Send'}>
                {loading && (
                <span className="loading loading-spinner loading-sm"></span>
                )}
                <span>{buttonText}</span>
            </button>
        </div>
      </label>
    </div>
  );
};
