"use client";

import { useRef } from "react";
import { hardhat } from "viem/chains";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { useAppState } from "~~/hooks/appContext";
import { InlineDropdown } from "./smallerComponents/InlineDropdows";
import { useContractInstanceState } from "~~/hooks/contractInstanceContext";
import { LanguageDropdown } from "./smallerComponents/LanguageDropdown";
import { CHAIN_TIPS, CONTRACT_INFO } from "~~/utils/nets";
import { useTranslation } from "react-i18next";

export const Header = () => {
  const { t } = useTranslation(); 
  
  const { targetNetwork } = useTargetNetwork();
  const {
    isLoadingEscrows,
  } = useAppState();
  const {
    contractType,
    availableContractTypes,
    availableNetworks,
    changeContractType,
    changeOperationalNetwork,
    triggerGlobalRefresh,
  } = useContractInstanceState();
  
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });
  
  const refresh = async () => {
    triggerGlobalRefresh();
  };

  const refreshButton = (
    <button className="btn btn-secondary btn-sm pl-1 pr-1" onClick={refresh} disabled={isLoadingEscrows}>
      {!isLoadingEscrows ? (
        <ArrowPathIcon className="h-4 w-4" />
      ) : (
        <span className="loading loading-spinner loading-sm"></span>
      )}
    </button>
  );

  const contractTypeDropDown = (
    <InlineDropdown
      label={contractType}
      options={
        availableContractTypes.map((ct) => {
          return {
            value: ct,
            label: ct,
            onSelect: () => {changeContractType(ct);},
            tipText: t(CONTRACT_INFO[ct].tip),
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
            onSelect: () => {changeOperationalNetwork(n);},
            tipText: t(CHAIN_TIPS[n])
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
        <LanguageDropdown />
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};
