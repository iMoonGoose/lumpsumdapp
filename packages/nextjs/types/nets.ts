import { Address, Chain } from "viem";

export enum ContractTypes {
  ETH = "eth",
  USDT = "usdt",
  USDC = "usdc",
}

export enum AbiTypes {
  LumpSumETH = "eth",
  LumpSumCoin = "coin",
  ERC20 = "erc20",
}

export type ContractInfo = {
  tip: string;
};

export type ContractInfoDictionary = Record<ContractTypes, ContractInfo>;

export type ContractAddressMapping = Record<
  Chain["name"],
  Partial<
    Record<
      ContractTypes,
      {
        address: Address;
      }
    >
  >
>;
