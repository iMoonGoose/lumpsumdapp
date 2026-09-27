import { Abi, Address, Chain } from "viem";

export enum ContractTypes {
  ETH = 'eth',
  USDT = 'usdt',
  USDC = 'usdc',
}

export type ContractAddressMapping = Record<
  Chain['name'],
  Partial<Record<
    ContractTypes,
    {
      address: Address | null;
      abi: Abi;
    }
  >>
>