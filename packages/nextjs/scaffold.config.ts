import * as chains from "viem/chains";

const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";

export type BaseConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  rpcOverrides?: Record<number, string>;
  walletConnectProjectId: string;
  burnerWalletMode: "localNetworksOnly" | "allNetworks" | "disabled";
};

export type ScaffoldConfig = BaseConfig;

export const DEFAULT_ALCHEMY_API_KEY = "IZYEU2cWBgnFmgiTAgpWD";

const scaffoldConfig = {
  targetNetworks: [chains.sepolia, chains.hardhat],
  pollingInterval: 10_000,
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || DEFAULT_ALCHEMY_API_KEY,
  rpcOverrides: {
    [chains.sepolia.id]: "https://eth-sepolia.g.alchemy.com/v2/alch_zzLGoWC2qFzZqzAnpvHGT",
    [chains.hardhat.id]: `http://${hostname}:8545`,
  },
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",
  burnerWalletMode: "localNetworksOnly",
} satisfies ScaffoldConfig;

export default scaffoldConfig;
