import { wagmiConnectors } from "./wagmiConnectors";
import { Chain } from "viem";
import { hardhat, mainnet, sepolia } from "viem/chains";
import { createConfig, http as wagmiHttp, webSocket } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";

const { targetNetworks } = scaffoldConfig;
const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains: readonly [Chain, ...Chain[]] = (targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : [...targetNetworks, mainnet]) as unknown as readonly [Chain, ...Chain[]];

export const wagmiConfig = createConfig({
  chains: enabledChains,
  transports: {
    [sepolia.id]: webSocket("wss://eth-sepolia.g.alchemy.com/v2/alch_zzLGoWC2qFzZqzAnpvHGT"),
    [mainnet.id]: webSocket("wss://eth-mainnet.g.alchemy.com/v2/alch_zzLGoWC2qFzZqzAnpvHGT"),
    [hardhat.id]: wagmiHttp(`http://${hostname}:8545`),
  },
  connectors: wagmiConnectors(),
  ssr: true,
});
