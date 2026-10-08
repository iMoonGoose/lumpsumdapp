"use client";

import { useState } from "react";
import { AddressInput } from "@scaffold-ui/components";
import { Address as AddressType, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useFundHook, useValidatedAddress } from "~~/hooks/lumpsumContract/lumpsumCommon";
import { DaisyErrorAlert } from "./smallerComponents/ErrorDisplay";
import { EtherInput } from "./smallerComponents/EtherInput";
import { DateAsDiffInput } from "./smallerComponents/DateAsDiffInput";
import { useAdaptableBalance, useApprovedAmount, useApproveHook } from "~~/hooks/accounts";
import { ContractTypes } from "~~/types/nets";
import { useContractInstanceState } from "~~/hooks/contractInstanceContext";
import { TokenInput } from "./smallerComponents/TokenInput";
import { prettifyCoinAmount, prettyTextToUint } from "~~/utils/formatting";
import { useTranslation } from "react-i18next";
import { useAppState } from "~~/hooks/appContext";

export const FundNewLumpSum = () => {
  const { t } = useTranslation();
  
  const { isConnected, address: giverAddress, chain } = useAccount();
  const [sourceValue, setSourceValue] = useState("");
  const [netSourceValue, setNetSourceValue] = useState("");
  const { giversBalance, isLoading, isBalanceError } = useAdaptableBalance();
  const { contractType } = useContractInstanceState();
  const { allowance, isLoading: isLoadingAllowance, isAllowanceError } = useApprovedAmount();
  const { approve, isError: isApproveError, error: approveError } = useApproveHook();
  
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

  const {
    newCommissionAt,
    futureRate,
    rate,
    readCommissionDtError,
    readFutureRateError,
    readRateError,
    formatTimestamp,
  } = useAppState();

  const { isValidAddress, checkSumAddress } = useValidatedAddress(granteeAddress);

  const handleFunding = () => {
    fundLumpSum();
    setDaysToMature("1");
    setGranteeAddress("");
    setSourceValue("");
    setNetSourceValue("");
  };

  const handleApproval = () => {
    const value = prettyTextToUint(sourceValue, contractType);
    approve(value);
    setSourceValue("");
    setNetSourceValue("");
  };

  const buttonText = contractType === ContractTypes.ETH && Number(sendValue) <= 0
    ? t('Input amount')
    : !isValidAddress
      ? t('Enter valid grantee address')
      : checkSumAddress === giverAddress
        ? t('Grantee must be someone else')
        : isLoading || isBalanceError || typeof giversBalance === 'undefined' || giversBalance === null
          ? t('Waiting for balance info')
          : contractType !== ContractTypes.ETH && (isAllowanceError || isLoadingAllowance)
            ? t('Waiting for allowance info')
            : contractType === ContractTypes.ETH
              ? (parseEther(sendValue) > giversBalance ? t('Not enough funds') : t('Send'))
              : (allowance !== null && allowance > 1 ? `${t('Send')} ${prettifyCoinAmount(allowance, contractType)}` : t('Set allowance first'));



  return (
    <div>
      <label htmlFor="funding-section">
        {
            isError && <DaisyErrorAlert error={error} />
        }
        {
            isApproveError && <DaisyErrorAlert error={approveError} />
        }
        <div className="bg-base-200 p-4 rounded-box">
          <label>
              <div className="space-y-3">
                  <div className="flex flex-col space-y-3">
                    <AddressInput
                        placeholder={t("Grantee Address")}
                        value={granteeAddress ?? ""}
                        onChange={value => setGranteeAddress(value as AddressType)}
                    />
                    <DateAsDiffInput
                        disabled={!isConnected}
                        sourceValue={daysToMature}
                        setSourceValue={setDaysToMature}
                    />
                    {
                      contractType === ContractTypes.ETH
                      ? <EtherInput
                        onValueChange={({ valueInEth }) => {setSendValue(valueInEth)}}
                        sourceValue={sourceValue}
                        setSourceValue={setSourceValue}
                        netSourceValue={netSourceValue}
                        setNetSourceValue={setNetSourceValue}
                        disabled={!isConnected}
                      />
                      : <TokenInput 
                        handleApproval={handleApproval}
                        sourceValue={sourceValue}
                        setSourceValue={setSourceValue}
                        netSourceValue={netSourceValue}
                        setNetSourceValue={setNetSourceValue}
                        disabled={!isConnected}
                      />
                    }
                    {
                      rate != futureRate
                      &&
                      <div className="flex items-center gap-4 w-full border-2 p-2 text-sui-input-text font-sans bg-sui-input-background border-sui-input-border ">
                        <span className="pl-2 -mr-2 self-center">{t("Rate change", {timestamp: formatTimestamp(newCommissionAt), rate: rate/10, futureRate: futureRate/10})}</span>
                      </div>
                    }
                  </div>
              </div>
          </label>
        </div>
        <div className="w-full">
            <button className="h-10 btn btn-primary btn-sm px-2 w-full" onClick={handleFunding} disabled={loading || !buttonText.startsWith(t('Send'))}>
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
