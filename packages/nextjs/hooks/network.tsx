import { useState } from "react";
import { createPublicClient, http } from "viem";
import { useAccount } from "wagmi";

export function useHardhatTimeTravel() {
  const { isConnected, chain } = useAccount();

  const [loading, setLoading] = useState(false);

  const increaseTime = async (seconds: number) => {
    if (!isConnected) {
      return;
    }

    const client = createPublicClient({
      chain,
      transport: http(),
    });

    setLoading(true);
    try {
      await client.request({
        method: "evm_increaseTime",
        params: [seconds],
      } as any);
      await client.request({
        method: "evm_mine",
        params: [],
      } as any);
    } finally {
      setLoading(false);
    }
  };

  const setNextBlockTimestamp = async (timestamp: number) => {
    if (!isConnected) {
      return;
    }

    const client = createPublicClient({
      chain,
      transport: http(),
    });

    setLoading(true);
    try {
      await client.request({
        method: "evm_setNextBlockTimestamp",
        params: [timestamp],
      } as any);
      await client.request({
        method: "evm_mine",
        params: [],
      } as any);
    } finally {
      setLoading(false);
    }
  };

  return { increaseTime, setNextBlockTimestamp, loading };
}
