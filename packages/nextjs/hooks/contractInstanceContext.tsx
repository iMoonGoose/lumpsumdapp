"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAccount, useCall, useSwitchChain } from 'wagmi';
import { Abi, Address, Chain } from 'viem';
import { useTargetNetwork } from './scaffold-eth';
import { ContractTypes } from '~~/types/nets';
import { availableContractTypes, chainIdFromName, CONTRACT_TYPES_TO_NETWORKS_ADDRESSES, getAbiForType } from '~~/utils/nets';

interface ContractInstanceContext {
  contractType: ContractTypes;
  availableContractTypes: Array<ContractTypes>;
  changeContractType: (t: ContractTypes) => void;
  availableNetworks: Array<Chain['name']>;
  changeOperationalNetwork: (c: Chain['name']) => void;
  contractAddress: Address | null | undefined;
  contractAbi: Abi | null | undefined;
  globalRefresh: number;
  triggerGlobalRefresh: () => void;
}
const ContractInstanceStateContext = createContext<ContractInstanceContext | undefined>(undefined);

export function ContractInstanceProvider({ children } : {children: ReactNode}) {
  const [globalRefresh, setGlobalRefresh] = useState(0);
  const { isConnected, address } = useAccount();
  const [ contractType, setContractType ] = useState(ContractTypes.ETH);
  const [ availableNetworks, setAvailableNetworks ] = useState<Array<Chain['name']>>([]);

  const triggerGlobalRefresh = useCallback(() => {
    setGlobalRefresh(Date.now());
  }, [setGlobalRefresh]);

  useEffect(
    () => {
      const res: Array<Chain['name']> = [];
      for (const [name, contracts] of Object.entries(CONTRACT_TYPES_TO_NETWORKS_ADDRESSES)) {
        if (Object.getOwnPropertyNames(contracts).includes(contractType)) {
          res.push(name);
        }
      }
      setAvailableNetworks(res);
  }, [isConnected, contractType, globalRefresh]);
  const { targetNetwork } = useTargetNetwork();
  const [ contractAddress, setContractAddress ] = useState(CONTRACT_TYPES_TO_NETWORKS_ADDRESSES[targetNetwork.name][ContractTypes.ETH]?.address);
  const [ contractAbi, setContractAbi ] = useState(getAbiForType(ContractTypes.ETH));
  
  const changeContractType = useCallback((c: ContractTypes) => {
    setContractType(c);
    const contractInfo = CONTRACT_TYPES_TO_NETWORKS_ADDRESSES[targetNetwork.name][c];
    if (typeof contractInfo === 'undefined') {
      throw new Error(`Can't find contract ${contractType} for the chain named "${c}"`);
    }
    setContractAddress(contractInfo.address);
    setContractAbi(getAbiForType(contractType));
  }, [targetNetwork, globalRefresh]);

  const { switchChain, isPending } = useSwitchChain()
  const changeOperationalNetwork = useCallback((chainname: Chain['name']) => {
    const id = chainIdFromName(chainname);
    if (typeof id === 'undefined') {
      throw new Error(`Can't find chain named "${chainname}"`);
    }
    switchChain({ chainId: id });
    const contractInfo = CONTRACT_TYPES_TO_NETWORKS_ADDRESSES[chainname][contractType];
    if (typeof contractInfo === 'undefined') {
      throw new Error(`Can't find contract ${contractType} for the chain named "${chainname}"`);
    }
    setContractAddress(contractInfo.address);
    setContractAbi(getAbiForType(contractType));
      throw new Error(`Can't find contract ${contractType} for the chain named "${chainname}"`);
  }, [contractType, globalRefresh]);  
  
  return (
    <ContractInstanceStateContext value={{
      contractType,
      availableContractTypes,
      changeContractType,
      availableNetworks,
      changeOperationalNetwork,
      contractAddress,
      contractAbi,
      globalRefresh,
      triggerGlobalRefresh,
    }}>
      {children}
    </ContractInstanceStateContext>
  );
}

export function useContractInstanceState() {
  const context = useContext(ContractInstanceStateContext);
  if (!context) {
    throw new Error('useContractInstanceState must be used within a ContractInstanceStateContext');
  }
  return context;
}