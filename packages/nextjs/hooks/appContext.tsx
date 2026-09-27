"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useContractEvent, useEscrows, useOwner, useReleaseWindow } from './lumpsumContract/lumpsumCommon';
import { LumpSumEscrow } from '~~/types/contractStructs';
import { Address } from 'viem';
import { availableContractTypes } from '~~/utils/nets';
import { useContractInstanceState } from './contractInstanceContext';

interface AppContext {
  isLoading: boolean;
  setLoading: (v: boolean) => void;
  escrows: Array<LumpSumEscrow>;
  setEscrows: (v: Array<LumpSumEscrow>) => void;
  loadEscrows: () => Promise<LumpSumEscrow[]>;
  updateEscrow: (i?: bigint) => Promise<void>;
  escrowsFunded: Array<LumpSumEscrow>;
  escrowsPromised: Array<LumpSumEscrow>;
  errorFetchingEscrows: Error | null;
  releaseWindowDuration: number;
  errorFetchingReleaseWindow: Error | null;
  owner: Address | null;
  getOwnerError: Error | null;
}
const AppStateContext = createContext<AppContext | undefined>(undefined);

export function AppStateProvider({ children } : {children: ReactNode}) {
  const { isConnected, address } = useAccount();
  const [ isLoading, setLoading ] = useState(false);
  const [ escrows, setEscrows ] = useState([] as Array<LumpSumEscrow>);
  const { loadEscrows, error: errorFetchingEscrows } = useEscrows();
  const { owner, error: getOwnerError } = useOwner();
  const { claimPeriod: releaseWindowDuration, error: errorFetchingReleaseWindow } = useReleaseWindow();
  
  const { contractType, contractAddress } = useContractInstanceState();

  const escrowsFunded = useMemo(() => {
    return escrows
      .filter((escrow) => escrow.giver === address)
      .sort((a, b) => b.fundedTimestamp - a.fundedTimestamp);
  }, [escrows])

  const escrowsPromised = useMemo(() => {
    return escrows
      .filter((escrow) => escrow.grantee === address)
      .sort((a, b) => b.fundedTimestamp - a.fundedTimestamp);
  }, [escrows])

  const updateEscrow = useCallback(
    async (i?: bigint) => {
      setEscrows(await loadEscrows())
  }, [isConnected, address, contractType]);

  useContractEvent(updateEscrow, updateEscrow);

  useEffect(() => {
    (async () => {
      const e = await loadEscrows()
      setEscrows(e);
    })();
  }, [isConnected, address, contractType, contractAddress]);
  
  return (
    <AppStateContext value={{
      isLoading,
      setLoading,
      escrows,
      setEscrows,
      loadEscrows,
      escrowsFunded,
      escrowsPromised,
      errorFetchingEscrows,
      releaseWindowDuration,
      errorFetchingReleaseWindow,
      updateEscrow,
      owner,
      getOwnerError,
    }}>
      {children}
    </AppStateContext>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within a AppStateContext');
  }
  return context;
}