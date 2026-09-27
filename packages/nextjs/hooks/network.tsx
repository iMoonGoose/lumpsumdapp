import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { useState } from 'react';

const client = createPublicClient({
  chain: hardhat,
  transport: http('http://127.0.0.1:8545'),
});

export function useHardhatTimeTravel() {
  const [loading, setLoading] = useState(false);

  const increaseTime = async (seconds: number) => {
    setLoading(true);
    try {
      await client.request({
        method: 'evm_increaseTime',
        params: [seconds],
      } as any);
      await client.request({
        method: 'evm_mine',
        params: [],
      } as any);
    } finally {
      setLoading(false);
    }
  };

  const setNextBlockTimestamp = async (timestamp: number) => {
    setLoading(true);
    try {
      await client.request({
        method: 'evm_setNextBlockTimestamp',
        params: [timestamp],
      } as any);
      await client.request({
        method: 'evm_mine',
        params: [],
      } as any);
    } finally {
      setLoading(false);
    }
  };

  return { increaseTime, setNextBlockTimestamp, loading };
}