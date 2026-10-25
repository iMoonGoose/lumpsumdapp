"use client";

import { useEffect, useState } from "react";
import { Dropdown } from "./smallerComponents/Dropdown";
import { DaisyErrorAlert } from "./smallerComponents/ErrorDisplay";
import { AddressInput } from "@scaffold-ui/components";
import { useTranslation } from "react-i18next";
import { Address as AddressType } from "viem";
import { hardhat } from "viem/chains";
import { useAccount, useDeployContract, useWaitForTransactionReceipt } from "wagmi";
import { useAppState } from "~~/hooks/appContext";
import { useHardhatTimeTravel } from "~~/hooks/network";
import { AbiTypes } from "~~/types/nets";
import { DAY_IN_SECONDS } from "~~/utils/formatting";
import { getAbiForType } from "~~/utils/nets";

export const LocalhostOptions = () => {
  const { t } = useTranslation();

  const { isConnected, chain } = useAccount();
  const [sourceCode, setSourceCode] = useState<`0x${string}`>("0x");
  const [erc20Address, setErc20Address] = useState<AddressType>("");
  const [abiType, setAbiType] = useState<AbiTypes>(AbiTypes.ERC20);
  const { deployContractAsync } = useDeployContract();
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [newAddress, setNewAddress] = useState<AddressType>("");
  const [tx, setTx] = useState<`0x${string}` | undefined>();
  const { data: receipt } = useWaitForTransactionReceipt({
    hash: tx,
  });
  const [daysToAdd, setDaysToAdd] = useState(0);
  const { increaseTime, loading: loadingTime, setNextBlockTimestamp } = useHardhatTimeTravel();
  const { setSecondsToSkip, timeFormattingSkipSeconds, formatTimestamp } = useAppState();

  useEffect(() => {
    if (!receipt) {
      return;
    }
    if (sourceCode.length < 4) {
      return;
    }
    if (receipt?.status === "reverted") {
      setError(Error(`Transaction was reverted: ${receipt.logs}`));
      return;
    }
    if (typeof receipt?.contractAddress !== "string") {
      setError(Error("No created contract address"));
      return;
    }
    setNewAddress(receipt.contractAddress);
    setLoading(false);
  }, [receipt]);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    setNewAddress("");

    const create = deployContractAsync({
      abi: getAbiForType(abiType),
      bytecode: sourceCode,
      args: abiType === AbiTypes.LumpSumCoin ? [erc20Address] : [],
    });

    try {
      const hash = await create;
      setTx(hash);
    } catch (e) {
      setError(e as Error);
      setLoading(false);
    }
  };

  const handleDtCheating = async () => {
    setSecondsToSkip(daysToAdd * DAY_IN_SECONDS + timeFormattingSkipSeconds);
    await setNextBlockTimestamp(Math.round(Date.now() / 1000) + timeFormattingSkipSeconds);
  };

  const handleDateInputChange = (value: string) => {
    if (value && !/\d*/.test(value)) {
      return;
    }
    setDaysToAdd(Number(value));
  };

  const cheatDateInput = (
    <div className="flex items-center gap-4 w-full border-2 p-2 text-sui-input-text bg-sui-input-background border-sui-input-border">
      <span className="w-6/10">{formatTimestamp(Date.now() / 1000, timeFormattingSkipSeconds / DAY_IN_SECONDS)}</span>
      <input
        className="flex focus:outline-none items-center gap-4 w-full border-2 p-2 text-sui-input-text bg-sui-input-background border-sui-input-border"
        placeholder={t("Skip EVM days")}
        disabled={loading || loadingTime}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDateInputChange(e.target.value)}
        value={daysToAdd ? daysToAdd : ""}
      ></input>
      <button className="h-10 btn btn-secondary px-2 w-1/3" onClick={handleDtCheating} disabled={loading}>
        {(loading || loadingTime) && <span className="loading loading-spinner loading-sm"></span>}
        <span>{t("Cheat dt")}</span>
      </button>
    </div>
  );

  return (
    <div>
      <label htmlFor="deploying-section">
        {error && <DaisyErrorAlert error={error} />}
        <div className="bg-base-200 p-4 rounded-box">
          <label>
            <div className="space-y-3">
              <div className="flex flex-col space-y-3">
                <div className="flex flex-row items-center gap-1">
                  <span className="w-1/20">ABI:</span>
                  <Dropdown
                    className="w-2/10"
                    title={abiType}
                    options={Object.values(AbiTypes).map(t => {
                      return { option: t, setter: () => setAbiType(t) };
                    })}
                  />
                  <span className="w-15/20">
                    <AddressInput
                      placeholder="ERC20 Token"
                      value={erc20Address}
                      onChange={value => setErc20Address(value as AddressType)}
                    />
                  </span>
                </div>
                <textarea
                  onInput={e => setSourceCode((e.target as unknown as HTMLTextAreaElement).value as `0x${string}`)}
                  className="textarea textarea-bordered w-full focus:outline-none font-medium text-sui-input-text bg-sui-input-background border-sui-input-border"
                  placeholder={t("Constructor source code")}
                ></textarea>
                <div className="w-full flex flex-row gap-3 items-center">
                  <button
                    className="h-10 btn btn-primary px-2 w-2/10"
                    onClick={onSubmit}
                    disabled={loading || !isConnected || sourceCode.length < 4}
                  >
                    {loading && <span className="loading loading-spinner loading-sm"></span>}
                    <span>{t("Deploy")}</span>
                  </button>
                  <div>
                    {t("Created")}: {newAddress}
                  </div>
                </div>
              </div>
            </div>
          </label>
        </div>
        <div className="bg-base-200 p-4 rounded-box space-y-3">{chain?.id === hardhat.id && cheatDateInput}</div>
      </label>
    </div>
  );
};
