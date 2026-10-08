import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Address,
  Log,
  createPublicClient,
  getAddress,
  http,
  isAddress,
  parseEther,
  parseEventLogs,
} from 'viem';
import { useAccount, useWatchContractEvent, useWriteContract } from 'wagmi';
import { AddressType } from '~~/types/abitype/abi';
import { LumpSumEscrow } from '~~/types/contractStructs';
import { lumpsuminethAbi } from '~~/contractsData/lumpsumineth';
import { lumpsuminerc20Abi } from '~~/contractsData/lumpsuminerc20';
import { useContractInstanceState } from '../contractInstanceContext';
import { ContractTypes } from '~~/types/nets';

export function useContractEvent(
  callbackGiver: (i: bigint) => Promise<void>,
  callbackGrantee: (i: bigint) => Promise<void>,
) {
  const { address } = useAccount();
  const {
    contractType,
    contractAddress: lumpsumAddress,
    contractAbi: lumpsumAbi,
  } = useContractInstanceState();

  if (
    typeof lumpsumAddress === 'undefined' || lumpsumAddress === null
    || typeof lumpsumAbi === 'undefined' || lumpsumAbi === null
  ) {
    return;
  }

  const handleLogs = useCallback(
    async (logs: readonly Log[]) => {
      const decoded = parseEventLogs({
        abi: lumpsumAbi,
        logs: [...logs], 
      });
      
      for (const log of decoded) {
        const { args } = log;
        const { giver, grantee, i } = (args ?? {}) as {
          giver?: Address;
          grantee?: Address;
          i?: bigint;
        };
        if (giver === address && typeof i !== 'undefined') {
          await callbackGiver(i);
        }
        if (grantee === address && typeof i !== 'undefined') {
          await callbackGrantee(i);
        }
      }
    },
    [address, callbackGiver, callbackGrantee, lumpsumAddress, contractType],
  );

  useWatchContractEvent({
    address: lumpsumAddress as Address,
    abi: lumpsumAbi,
    eventName: 'LumpSumDeposited',
    onLogs: handleLogs,
  });

  useWatchContractEvent({
    address: lumpsumAddress as Address,
    abi: lumpsumAbi,
    eventName: 'LumpSumRevoked',
    onLogs: handleLogs,
  });

  useWatchContractEvent({
    address: lumpsumAddress as Address,
    abi: lumpsumAbi,
    eventName: 'LumpSumReleased',
    onLogs: handleLogs,
  });
}

export function useEscrows() {
  const { isConnected, chain } = useAccount();
  const [error, setError] = useState<Error | null>(null);
  const {
    contractAddress: lumpsumAddress,
    contractAbi: lumpsumAbi,
  } = useContractInstanceState();

  const loadEscrows = async (): Promise<Array<LumpSumEscrow>> => {
    const escrows: Array<LumpSumEscrow> = [];
    setError(null);

    if (!isConnected || !chain
      || typeof lumpsumAddress === 'undefined' || lumpsumAddress === null
      || typeof lumpsumAbi === 'undefined' || lumpsumAbi === null) {
      return [];
    }
    
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    let escrowCount = 0;

    try {
      escrowCount = Number(
        await publicClient.readContract({
          abi: lumpsumAbi,
          address: lumpsumAddress,
          functionName: 'getEscrowCount',
        }),
      );
    } catch (e) {
      setError(new Error(`Unable to fetch escrow count due to: ${(e as Error).message}`));
      return [];
    }

    if (!escrowCount) {
      return [];
    }

    try {
      for (let i = 0; i < escrowCount; i++) {
        const escrowData = await publicClient.readContract({
          abi: lumpsumAbi as typeof lumpsuminethAbi,
          address: lumpsumAddress,
          functionName: 'escrows',
          args: [BigInt(i)],
        });

        if (!escrowData) {
          continue;
        }

        escrows.push({
          index: BigInt(i),
          grantee: escrowData[0],
          fundedTimestamp: escrowData[1],
          daysToMature: escrowData[2],
          isReleased: escrowData[3],
          isRevokedBeforeMaturing: escrowData[4],
          isRevokedAfterMaturing: escrowData[5],
          giver: escrowData[6],
          amount: escrowData[7],
        });
      }
    } catch (e) {
      setError(new Error(`Unable to fetch escrow data due to: ${(e as Error).message}`));
      return [];
    }

    return escrows;
  };

  return { loadEscrows, error };
}

export function useFundHook() {
  const { writeContractAsync, isError, error } = useWriteContract();
  const { isConnected, address: giverAddress } = useAccount();

  const {
    contractAddress: lumpsumAddress,
    contractAbi: lumpsumAbi,
    contractType
  } = useContractInstanceState();

  const [loading, setLoading] = useState(false);
  const [granteeAddress, setGranteeAddress] = useState<AddressType>();
  const [daysToMature, setDaysToMature] = useState('1');
  const [sendValue, setSendValue] = useState('');

  const { isValidAddress, checkSumAddress } = useValidatedAddress(granteeAddress);

  const fundLumpSum = async (): Promise<void> => {
    if (
      !isConnected ||
      !giverAddress ||
      !checkSumAddress || // use the checksummed value for the write
      !daysToMature ||
      !isValidAddress
      || typeof lumpsumAddress === 'undefined' || lumpsumAddress === null
      || typeof lumpsumAbi === 'undefined' || lumpsumAbi === null
    ) {
      return;
    }

    try {
      setLoading(true);
      await writeContractAsync({
        address: lumpsumAddress,
        value: contractType === ContractTypes.ETH ? parseEther(sendValue as `${number}`) : 0n,
        abi: lumpsumAbi,
        functionName: 'fundLumpSumGrant',
        args: [checkSumAddress, Math.floor(Number(daysToMature))],
      });
      setLoading(false);
      setGranteeAddress(undefined);
      setDaysToMature('');
      setSendValue('');
    } catch (error) {
      setLoading(false);
    }
  };

  return {
    fundLumpSum,
    isError,
    error,
    loading,
    granteeAddress,
    setGranteeAddress,
    isValidAddress,
    checkSumAddress,
    daysToMature,
    setDaysToMature,
    sendValue,
    setSendValue,
  };
}

export function useRevokeHook() {
  const { writeContractAsync, isError, error } = useWriteContract();
  const { isConnected } = useAccount();

  const {
    contractAddress: lumpsumAddress,
    contractAbi: lumpsumAbi,
  } = useContractInstanceState();

  const revoke = async (index: bigint): Promise<void> => {
    if (!isConnected
      || typeof lumpsumAddress === 'undefined' || lumpsumAddress === null
      || typeof lumpsumAbi === 'undefined' || lumpsumAbi === null) {
      return;
    }
    try {
      await writeContractAsync({
        address: lumpsumAddress,
        abi: lumpsumAbi,
        functionName: 'revoke',
        args: [index],
      });
    } catch (e) {}
  };

  return { revoke, isError, error };
}

export function useReleaseHook() {
  const { writeContractAsync, isError, error } = useWriteContract();
  const { isConnected } = useAccount();

  const {
    contractAddress: lumpsumAddress,
    contractAbi: lumpsumAbi,
  } = useContractInstanceState();

  const release = async (index: bigint): Promise<void> => {
    if (!isConnected
      || typeof lumpsumAddress === 'undefined' || lumpsumAddress === null
      || typeof lumpsumAbi === 'undefined' || lumpsumAbi === null) {
      return;
    }
    try {
      await writeContractAsync({
        address: lumpsumAddress,
        abi: lumpsumAbi,
        functionName: 'release',
        args: [index],
      });
    } catch (e) {}
  };

  return { release, isError, error };
}

export function useReleaseWindow() {
  const { isConnected, chain } = useAccount();
  
  const {
    contractAddress: lumpsumAddress,
    contractAbi: lumpsumAbi,
    contractType,
  } = useContractInstanceState();
  
  const [claimPeriod, setClaimPeriod] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const readClaimPeriod = async (): Promise<number> => {
    setError(null);

    if (!isConnected || !chain
      || typeof lumpsumAddress === 'undefined' || lumpsumAddress === null
      || typeof lumpsumAbi === 'undefined' || lumpsumAbi === null) {
      return 0;
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    return Number(
      await publicClient.readContract({
        abi: lumpsumAbi,
        address: lumpsumAddress,
        functionName: 'CLAIM_PERIOD_IN_DAYS',
      }),
    );
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const value = await readClaimPeriod();
        if (!cancelled) setClaimPeriod(value);
      } catch (e) {
        if (!cancelled) setError(e as Error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isConnected, chain, lumpsumAddress, contractType]);

  return { claimPeriod, error };
}

export function useOwner() {
  const { isConnected, chain } = useAccount();
  const {
    contractAddress: lumpsumAddress,
    contractAbi: lumpsumAbi,
    contractType,
  } = useContractInstanceState();
  const [owner, setOwner] = useState<Address | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const readOwner = async (): Promise<Address | null> => {
    setError(null);

    if (!isConnected || !chain
      || typeof lumpsumAddress === 'undefined' || lumpsumAddress === null
      || typeof lumpsumAbi === 'undefined' || lumpsumAbi === null) {
      return null;
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });
    
    const adressNumber = await publicClient.readContract({
      abi: lumpsumAbi as typeof lumpsuminethAbi,
      address: lumpsumAddress,
      functionName: 'owner',
    })
    return getAddress(adressNumber);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const value = await readOwner();
        if (!cancelled) setOwner(value);
      } catch (e) {
        if (!cancelled) setError(e as Error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isConnected, chain?.id, lumpsumAddress, contractType]);

  return { owner, error };
}

export function useERC20Address() {
  const { isConnected, chain } = useAccount();
  const {
    contractAddress: lumpsumAddress,
    contractAbi: lumpsumAbi,
    contractType,
  } = useContractInstanceState();
  const [addressERC20, setAddressERC20] = useState<Address | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const readAddress = async (): Promise<Address | null> => {
    setError(null);

    if ( ![ContractTypes.USDT, ContractTypes.USDC].includes(contractType)
      || !isConnected || !chain
      || typeof lumpsumAddress === 'undefined' || lumpsumAddress === null
      || typeof lumpsumAbi === 'undefined' || lumpsumAbi === null) {
      return null;
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });
    
    const adressNumber = await publicClient.readContract({
      abi: lumpsumAbi as typeof lumpsuminerc20Abi,
      address: lumpsumAddress,
      functionName: 'token',
    })
    return getAddress(adressNumber);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const value = await readAddress();
        if (!cancelled) setAddressERC20(value);
      } catch (e) {
        if (!cancelled) setError(e as Error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isConnected, chain?.id, contractType]);

  return { addressERC20, error };
}

export function useCommissionRate() {
  const { isConnected, chain } = useAccount();
  const { globalRefresh } = useContractInstanceState();

  const {
    contractAddress: lumpsumAddress,
    contractAbi: lumpsumAbi,
    contractType,
  } = useContractInstanceState();

  const [rate, setRate] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const chainId = chain?.id;

  const readCommisionRate = useCallback(async (): Promise<number> => {
    if (!isConnected || !chain
      || typeof lumpsumAddress === 'undefined' || lumpsumAddress === null
      || typeof lumpsumAbi === 'undefined' || lumpsumAbi === null) {
      return 0;
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    return Number(
      await publicClient.readContract({
        abi: lumpsumAbi,
        address: lumpsumAddress,
        functionName: 'commissionRatePromille',
      }),
    );
  }, [isConnected, chainId, lumpsumAddress, contractType]);

  const refetch = useCallback(async () => {
    setError(null);
    try {
      const value = await readCommisionRate();
      setRate(value);
      return value;
    } catch (e) {
      setError(e as Error);
      throw e;
    }
  }, [readCommisionRate]);

  useEffect(() => {
    let cancelled = false;

    setError(null);
    readCommisionRate()
      .then((value) => {
        if (!cancelled) setRate(value);
      })
      .catch((e) => {
        if (!cancelled) setError(e as Error);
      });

    return () => {
      cancelled = true;
    };
  }, [readCommisionRate, chainId, lumpsumAddress, contractType, globalRefresh]);

  return { rate, error, refetch };
}

export function useFutureCommissionRate() {
  const { globalRefresh } = useContractInstanceState();
  const { isConnected, chain } = useAccount();
  const [rate, setRate] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const chainId = chain?.id;
  const {
    contractAddress: lumpsumAddress,
    contractAbi: lumpsumAbi,
    contractType,
  } = useContractInstanceState();

  const readCommisionRate = useCallback(async (): Promise<number> => {
    if (!isConnected || !chain
      || typeof lumpsumAddress === 'undefined' || lumpsumAddress === null
      || typeof lumpsumAbi === 'undefined' || lumpsumAbi === null
    ) {
      return 0;
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    return Number(
      await publicClient.readContract({
        abi: lumpsumAbi,
        address: lumpsumAddress,
        functionName: 'newCommissionRatePromille',
      }),
    );
  }, [isConnected, chain, lumpsumAddress, contractType]);

  const refetch = useCallback(async () => {
    setError(null);
    try {
      const value = await readCommisionRate();
      setRate(value);
      return value;
    } catch (e) {
      setError(e as Error);
      throw e;
    }
  }, [readCommisionRate]);

  useEffect(() => {
    let cancelled = false;

    setError(null);
    readCommisionRate()
      .then((value) => {
        if (!cancelled) setRate(value);
      })
      .catch((e) => {
        if (!cancelled) setError(e as Error);
      });

    return () => {
      cancelled = true;
    };
  }, [readCommisionRate, chainId, lumpsumAddress, contractType, globalRefresh]);

  return { rate, error, refetch };
}

export function useNewCommissionTimespamp() {
  const { globalRefresh } = useContractInstanceState();
  const { isConnected, chain } = useAccount();

  const {
    contractAddress: lumpsumAddress,
    contractAbi: lumpsumAbi,
    contractType,
  } = useContractInstanceState();

  const [dt, setDt] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const chainId = chain?.id;

  const readCommisionTimespamp = useCallback(async (): Promise<number> => {
    if (!isConnected || !chain
      || typeof lumpsumAddress === 'undefined' || lumpsumAddress === null
      || typeof lumpsumAbi === 'undefined' || lumpsumAbi === null
    ) {
      return 0;
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    return Number(
      await publicClient.readContract({
        abi: lumpsumAbi,
        address: lumpsumAddress,
        functionName: 'newCommissionTimestamp',
      }),
    );
  }, [isConnected, chain, lumpsumAddress, contractType]);

  const refetch = useCallback(async () => {
    setError(null);
    try {
      const value = await readCommisionTimespamp();
      setDt(value);
      return value;
    } catch (e) {
      setError(e as Error);
      throw e;
    }
  }, [readCommisionTimespamp]);

  useEffect(() => {
    let cancelled = false;

    setError(null);
    readCommisionTimespamp()
      .then((value) => {
        if (!cancelled) setDt(value);
      })
      .catch((e) => {
        if (!cancelled) setError(e as Error);
      });

    return () => {
      cancelled = true;
    };
  }, [readCommisionTimespamp, chainId, lumpsumAddress, contractType, globalRefresh]);

  return { dt, error, refetch };
}

export function usePlanCommissionHook() {
  const { writeContractAsync, isError, error } = useWriteContract();
  const { isConnected } = useAccount();

  const {
    contractAddress: lumpsumAddress,
    contractAbi: lumpsumAbi,
  } = useContractInstanceState();

  const planCommission = async (rate: number): Promise<void> => {
    if (!isConnected
      || typeof lumpsumAddress === 'undefined' || lumpsumAddress === null
      || typeof lumpsumAbi === 'undefined' || lumpsumAbi === null) {
      return;
    }
    try {
      await writeContractAsync({
        address: lumpsumAddress,
        abi: lumpsumAbi,
        functionName: 'planNewCommissionRate',
        args: [rate],
      });
    } catch (e) {}
  };

  return { planCommission, isError, error };
}

export function useValidatedAddress(address: string | undefined) {
  return useMemo(() => {
    if (!address) {
      return { isValidAddress: false, checkSumAddress: undefined };
    }

    if (!isAddress(address)) {
      return { isValidAddress: false, checkSumAddress: undefined };
    }

    try {
      return {
        isValidAddress: true,
        checkSumAddress: getAddress(address),
      };
    } catch {
      return { isValidAddress: false, checkSumAddress: undefined };
    }
  }, [address]);
}
