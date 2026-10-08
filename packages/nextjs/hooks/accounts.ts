
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Address,
  createPublicClient,
  erc20Abi,
  http,
  Log,
  parseEventLogs,
} from 'viem';
import { useAccount, useBalance, useWatchContractEvent, useWriteContract } from 'wagmi';
import { useContractInstanceState } from './contractInstanceContext';
import { ContractTypes } from '~~/types/nets';
import { useERC20Address } from './lumpsumContract/lumpsumCommon';

export function useAdaptableBalance() {
  const { isConnected, chain, address } = useAccount();
  const [isERC20Error, setIsERC20Error] = useState<boolean>(false);
  const [valueERC20, setValueERC20] = useState<bigint | null>(0n);
  const [isLoadingERC20, setIsLoadingERC20] = useState<boolean>(false);
  const [fetchDataTrigger, setFetchDataTrigger] = useState(0);
  const fetchDataIntervalId = useRef<number | undefined>(undefined);
  
  const {
    contractType
  } = useContractInstanceState();

  const {
    addressERC20,
    error: addressERC20Error,
  } = useERC20Address();

  const delay = 10_000;

  const { data: giversBalance, isLoading, isError: isBalanceError } = useBalance({
    address: address,
    chainId: chain?.id,
    query: {
      enabled: Boolean(isConnected && address && chain),
      staleTime: delay
    },
  });

  const readERC20 = async (): Promise<bigint | null> => {
    if (addressERC20Error) {
      setIsERC20Error(true);
      return null;
    }

    setIsERC20Error(false);

    if (!isConnected || !chain
      || addressERC20 === null
      || typeof address === 'undefined') {
      return null;
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });
    
    return await publicClient.readContract({
      abi: erc20Abi,
      address: addressERC20,
      functionName: 'balanceOf',
      args: [address]
    })
  };

  const setFetchDataInterval = (interval: number) => {
    // Clear old interval
    if (fetchDataIntervalId.current) {
      clearInterval(fetchDataIntervalId.current);
      fetchDataIntervalId.current = undefined;
    }

    // Set new interval
    if (interval > 0) {
      fetchDataIntervalId.current = setInterval(() => {
        setFetchDataTrigger(Date.now());
      }, interval) as unknown as number;
      setFetchDataTrigger(Date.now());
    }
  };

  useEffect(() => {
    if (contractType !== ContractTypes.ETH) {
      setFetchDataInterval(delay);
    }

    return () => {
      clearInterval(fetchDataIntervalId.current);
    };
  }, [isConnected, chain?.id, address, contractType, addressERC20]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setIsLoadingERC20(true);
        const value = await readERC20();
        if (!cancelled) setValueERC20(value);
        setIsLoadingERC20(false);
      } catch (e) {
        if (!cancelled) setIsERC20Error(true);
        setIsLoadingERC20(false);
      }
    })();

    return () => {
      cancelled = true;
      setIsLoadingERC20(false);
    };
  }, [fetchDataTrigger]);

  if (contractType === ContractTypes.ETH) {
    return {
      giversBalance: giversBalance?.value,
      isLoading,
      isBalanceError,
    }
  }

  return {
    giversBalance: valueERC20,
    isLoading: isLoadingERC20,
    isBalanceError: isERC20Error,
  }
}

export function useERC20Event(
  callbackAllowanceChanged: (value: bigint) => any,
) {
  const { address, chainId } = useAccount();
  const { addressERC20, error } = useERC20Address();
  const {
    contractType,
    contractAddress: lumpsumAddress,
  } = useContractInstanceState();

  if (
    typeof lumpsumAddress === 'undefined' || lumpsumAddress === null
  ) {
    return;
  }

  const handleLogs = useCallback(
    async (logs: readonly Log[]) => {
      const decoded = parseEventLogs({
        abi: erc20Abi,
        logs: [...logs], 
      });
      
      for (const log of decoded) {
        const { args } = log;
        const { owner, spender, value } = (args ?? {}) as {
          owner?: Address;
          spender?: Address;
          value?: bigint;
        };
        if (owner === address && spender === lumpsumAddress && typeof value !== 'undefined') {
          await callbackAllowanceChanged(value);
        }
      }
    },
    [address, callbackAllowanceChanged, lumpsumAddress, contractType, chainId],
  );

  useWatchContractEvent({
    address: addressERC20 as Address,
    abi: erc20Abi,
    eventName: 'Approval',
    onLogs: handleLogs,
  });
}

export function useApprovedAmount() {
  const { isConnected, chain, address } = useAccount();
  const [isERC20Error, setIsERC20Error] = useState<boolean>(false);
  const [valueERC20, setValueERC20] = useState<bigint | null>(0n);
  const [isLoadingERC20, setIsLoadingERC20] = useState<boolean>(false);
  const [fetchDataTrigger, setFetchDataTrigger] = useState(0);
  const fetchDataIntervalId = useRef<number | undefined>(undefined);
  
  useERC20Event(setValueERC20);

  const {
    contractType,
    contractAddress,
  } = useContractInstanceState();

  const {
    addressERC20,
    error: addressERC20Error,
  } = useERC20Address();

  const delay = 10_000;

  const readERC20 = async (): Promise<bigint | null> => {
    if (addressERC20Error) {
      setIsERC20Error(true);
      return null;
    }

    setIsERC20Error(false);

    if ( !isConnected
      || !chain
      || addressERC20 === null
      || typeof address === 'undefined'
      || typeof contractAddress !== 'string'
    ) {
      return null;
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });
    
    return await publicClient.readContract({
      abi: erc20Abi,
      address: addressERC20,
      functionName: 'allowance',
      args: [address, contractAddress]
    })
  };

  const setFetchDataInterval = (interval: number) => {
    // Clear old interval
    if (fetchDataIntervalId.current) {
      clearInterval(fetchDataIntervalId.current);
      fetchDataIntervalId.current = undefined;
    }
    // Set new interval
    if (interval > 0) {
      fetchDataIntervalId.current = setInterval(() => {
        setFetchDataTrigger(Date.now());
      }, interval) as unknown as number;
      setFetchDataTrigger(Date.now());
    }
  };

  useEffect(() => {
    if (contractType !== ContractTypes.ETH) {
      setFetchDataInterval(delay);
    }

    return () => {
      if (contractType !== ContractTypes.ETH) {
        clearInterval(fetchDataIntervalId.current);
      }
    };
  }, [isConnected, chain?.id, address, contractType, addressERC20, contractAddress]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setIsLoadingERC20(true);
        const value = await readERC20();

        if (!cancelled) setValueERC20(value);
        setIsLoadingERC20(false);
      } catch (e) {
        if (!cancelled) setIsERC20Error(true);
        setIsLoadingERC20(false);
      }
    })();

    return () => {
      cancelled = true;
      setIsLoadingERC20(false);
    };
  }, [fetchDataTrigger]);

  if (contractType === ContractTypes.ETH) {
    return {
      allowance: null,
      isLoading: false,
      isAllowanceError: true,
    }
  }

  return {
    allowance: valueERC20,
    isLoading: isLoadingERC20,
    isAllowanceError: isERC20Error,
  }
}

export function useApproveHook() {
  const { writeContractAsync, isError, error } = useWriteContract();
  const { isConnected } = useAccount();

  const {
    contractAddress: lumpsumAddress,
  } = useContractInstanceState();

  const {
    addressERC20,
    error: addressERC20Error,
  } = useERC20Address();

  const approve = async (value: bigint): Promise<void> => {
    if (!isConnected
      || typeof lumpsumAddress === 'undefined' || lumpsumAddress === null
      || typeof addressERC20 === 'undefined' || addressERC20 === null) {
      return;
    }
    try {
      await writeContractAsync({
        address: addressERC20,
        abi: erc20Abi,
        functionName: 'approve',
        args: [lumpsumAddress, value],
      });
    } catch (e) {
    }
  };

  return { approve, isError, error };
}