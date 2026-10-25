"use client";

import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import { Abi, Address, Chain, PublicClient } from "viem";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { ContractTypes } from "~~/types/nets";
import {
  CONTRACT_TYPES_TO_NETWORKS_ADDRESSES,
  availableContractTypes,
  chainIdFromName,
  getAbiForType,
} from "~~/utils/nets";

interface ContractInstanceContext {
  contractType: ContractTypes;
  availableContractTypes: Array<ContractTypes>;
  changeContractType: (t: ContractTypes) => void;
  availableNetworks: Array<Chain["name"]>;
  changeOperationalNetwork: (c: Chain["name"]) => void;
  contractAddress: Address | null | undefined;
  contractAbi: Abi;
  globalRefresh: number;
  triggerGlobalRefresh: () => void;
  publicClient: PublicClient | undefined;
}
const ContractInstanceStateContext = createContext<ContractInstanceContext | undefined>(undefined);

export function ContractInstanceProvider({ children }: { children: ReactNode }) {
  const [globalRefresh, setGlobalRefresh] = useState(0);
  const { isConnected, chain } = useAccount();
  const [contractType, setContractType] = useState(ContractTypes.ETH);
  const [availableNetworks, setAvailableNetworks] = useState<Array<Chain["name"]>>([]);

  const triggerGlobalRefresh = useCallback(() => {
    setGlobalRefresh(Date.now());
  }, [setGlobalRefresh]);

  useEffect(() => {
    const res: Array<Chain["name"]> = [];
    for (const [name, contracts] of Object.entries(CONTRACT_TYPES_TO_NETWORKS_ADDRESSES)) {
      if (Object.getOwnPropertyNames(contracts).includes(contractType)) {
        res.push(name);
      }
    }
    setAvailableNetworks(res);
  }, [isConnected, contractType, globalRefresh]);
  const [contractAddress, setContractAddress] = useState(
    chain && chain.name in CONTRACT_TYPES_TO_NETWORKS_ADDRESSES
      ? CONTRACT_TYPES_TO_NETWORKS_ADDRESSES[chain.name][ContractTypes.ETH]!.address
      : undefined,
  );
  const [contractAbi, setContractAbi] = useState(getAbiForType(ContractTypes.ETH));

  const changeContractType = useCallback(
    (c: ContractTypes) => {
      setContractType(c);
      const contractInfo =
        chain && chain.name in CONTRACT_TYPES_TO_NETWORKS_ADDRESSES
          ? CONTRACT_TYPES_TO_NETWORKS_ADDRESSES[chain.name][c]
          : undefined;
      setContractAddress(contractInfo?.address);
      setContractAbi(getAbiForType(c));
    },
    [chain?.id, globalRefresh],
  );

  useEffect(() => {
    changeContractType(contractType);
  }, [chain?.id, globalRefresh]);

  const { switchChain, isPending } = useSwitchChain();
  const changeOperationalNetwork = useCallback(
    (chainname: Chain["name"]) => {
      const id = chainIdFromName(chainname);
      if (typeof id === "undefined") {
        throw new Error(`Can't find chain named "${chainname}"`);
      }
      switchChain({ chainId: id });
      const contractInfo = CONTRACT_TYPES_TO_NETWORKS_ADDRESSES[chainname][contractType];
      setContractAddress(contractInfo?.address);
      setContractAbi(getAbiForType(contractType));
    },
    [contractType, globalRefresh],
  );

  const publicClient = usePublicClient({
    chainId: chain?.id,
  });

  return (
    <ContractInstanceStateContext
      value={{
        contractType,
        availableContractTypes,
        changeContractType,
        availableNetworks,
        changeOperationalNetwork,
        contractAddress,
        contractAbi,
        globalRefresh,
        triggerGlobalRefresh,
        publicClient,
      }}
    >
      {children}
    </ContractInstanceStateContext>
  );
}

export function useContractInstanceState() {
  const context = useContext(ContractInstanceStateContext);
  if (!context) {
    throw new Error("useContractInstanceState must be used within a ContractInstanceStateContext");
  }
  return context;
}
