"use client";

import { useRef } from "react";
import { hardhat } from "viem/chains";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { useAppState } from "~~/hooks/appContext";
import { useCommissionRate } from "~~/hooks/lumpsumContract/lumpsumCommon";
import { InlineDropdown } from "./smallerComponents/InlineDropdows";
import { useContractInstanceState } from "~~/hooks/contractInstanceContext";

export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const {
    isLoading,
    setLoading,
    loadEscrows,
  } = useAppState();
  const {
    contractType,
    availableContractTypes,
    availableNetworks,
    changeContractType,
    changeOperationalNetwork,
  } = useContractInstanceState();
  
  const { refetch: refetchCommission } = useCommissionRate();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });
  
  const refresh = async () => {
    try {
      setLoading(true);

      await loadEscrows();
      await refetchCommission();

      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const refreshButton = (
    <button className="btn btn-secondary btn-sm pl-1 pr-1" onClick={refresh} disabled={isLoading}>
      {!isLoading ? (
        <ArrowPathIcon className="h-5 w-5" />
      ) : (
        <span className="loading loading-spinner loading-sm"></span>
      )}
    </button>
  );

  const contractTypeDropDown = (
    <InlineDropdown
      label={contractType}
      options={
        availableContractTypes.map((t) => {
          return {
            value: t,
            label: t,
            onSelect: () => {changeContractType(t);}
          };
        })
      }
    />
  );

  const networkDropDown = (
    <InlineDropdown
      label={targetNetwork.name.toLowerCase()}
      options={
        availableNetworks.map((n) => {
          return {
            value: n,
            label: n.toLowerCase(),
            onSelect: () => {changeOperationalNetwork(n);}
          };
        })
      }
    />
  );

  return (
    <div className="flex-wrap sticky lg:static top-0 navbar bg-base-100 min-h-16 shrink-0 justify-between z-20 border-b-2 border-base-300 p-0 sm:px-2">
      <div className="navbar-start w-auto self-stretch">
        <div className='flex flex-row gap-2 items-center p-2'>
          { refreshButton }
          <span>dapp:\lumpsum\{contractTypeDropDown}\{networkDropDown}</span>
        </div>
      </div>
      <div className="navbar-end grow mr-4">
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};
