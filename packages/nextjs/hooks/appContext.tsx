"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAccount, useCall } from 'wagmi';
import { useCommissionRate, useContractEvent, useEscrows, useFutureCommissionRate, useNewCommissionTimespamp, useOwner, useReleaseWindow } from './lumpsumContract/lumpsumCommon';
import { LumpSumEscrow } from '~~/types/contractStructs';
import { Address } from 'viem';
import { useContractInstanceState } from './contractInstanceContext';
import { DAY_IN_SECONDS, DEFAULT_TIME_LOCALE } from '~~/utils/formatting';

interface AppContext {
  isLoadingEscrows: boolean;
  setLoadingEscrows: (v: boolean) => void;
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
  newCommissionAt: number;
  futureRate: number;
  rate: number;
  readCommissionDtError: Error | null;
  readFutureRateError: Error | null;
  readRateError: Error | null;
  setSecondsToSkip: (n: number) => void;
  setTimeLocale: (s: string) => void;
  formatTimestamp: (timestamp: number, dateShift?: number) => string;
  hasItPassed: (funded: number, days_to_add: number) => boolean;
  timeFormattingSkipSeconds: number;
}
const AppStateContext = createContext<AppContext | undefined>(undefined);

export function AppStateProvider({ children } : {children: ReactNode}) {
  const { isConnected, address } = useAccount();
  const [ isLoadingEscrows, setLoadingEscrows ] = useState(false);
  const [ escrows, setEscrows ] = useState([] as Array<LumpSumEscrow>);
  const { loadEscrows, error: errorFetchingEscrows } = useEscrows();
  const { owner, error: getOwnerError } = useOwner();
  const { claimPeriod: releaseWindowDuration, error: errorFetchingReleaseWindow } = useReleaseWindow();
  
  const { dt: newCommissionAt, error: readCommissionDtError, refetch: refetchDt } = useNewCommissionTimespamp();
  const { rate: futureRate, error: readFutureRateError, refetch: refetchFutureRate } = useFutureCommissionRate();
  const { rate, error: readRateError, refetch: refetchCurrentRate } = useCommissionRate();

  const { contractType, contractAddress, globalRefresh } = useContractInstanceState();

  const [timeFormattingSkipSeconds, setSecondsToSkip] = useState(0);
  const [timeFormattingLocale, setTimeLocale] = useState(DEFAULT_TIME_LOCALE);

  const formatTimestamp = useCallback((timestamp: number, dateShift?: number) => {
    if (timestamp === 0) return "—";
    return new Date((Number(timestamp) + (dateShift ?? 0) * DAY_IN_SECONDS)* 1000).toLocaleString(timeFormattingLocale);
  }, [timeFormattingLocale]);

  const hasItPassed = useCallback((funded: number, days_to_add: number): boolean => {
    return Date.now() / 1000 + timeFormattingSkipSeconds > funded + days_to_add * DAY_IN_SECONDS;
  }, [timeFormattingSkipSeconds]);

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
  }, [isConnected, address, contractType, globalRefresh]);

  useContractEvent(updateEscrow, updateEscrow);

  useEffect(() => {
    (async () => {
      await refetchDt();
      await refetchFutureRate();
      await refetchCurrentRate();
      setLoadingEscrows(true);
      const e = await loadEscrows()
      setEscrows(e);
      setLoadingEscrows(false);
    })();
  }, [isConnected, address, contractType, contractAddress, globalRefresh]);
  
  return (
    <AppStateContext value={{
      isLoadingEscrows,
      setLoadingEscrows,
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
      newCommissionAt,
      futureRate,
      rate,
      readCommissionDtError,
      readFutureRateError,
      readRateError,
      setSecondsToSkip,
      setTimeLocale,
      formatTimestamp,
      hasItPassed,
      timeFormattingSkipSeconds,
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