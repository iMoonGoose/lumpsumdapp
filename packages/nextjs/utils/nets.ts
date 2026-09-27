import { hardhat, sepolia, mainnet, Chain } from 'viem/chains';
import { lumpsuminethAbi, lumpsuminethAddress } from '~~/contractsData/lumpsumineth';
import { lumpsuminerc20Abi, lumpsuminerc20Address } from '~~/contractsData/lumpsuminerc20';
import { ContractAddressMapping, ContractTypes } from '~~/types/nets';

export const CONTRACT_TYPES_TO_NETWORKS_ADDRESSES: ContractAddressMapping = {
  [hardhat.name]: {
    [ContractTypes.ETH]: {
      address: lumpsuminethAddress,
      abi: lumpsuminethAbi,
    },
    [ContractTypes.USDT]: {
      address: lumpsuminerc20Address,
      abi: lumpsuminerc20Abi,
    }
  },
};

export const availableContractTypes: Array<ContractTypes> = [];
for (const contracts of Object.values(CONTRACT_TYPES_TO_NETWORKS_ADDRESSES)) {
  for (const t of Object.keys(contracts)) {
    if ( !availableContractTypes.includes(t as ContractTypes) ) {
      availableContractTypes.push(t as ContractTypes);
    }
  }
}

export const supportedChains = [mainnet, sepolia, hardhat] as const

const byName = new Map<string, Chain>(
  supportedChains.map((c) => [c.name.toLowerCase(), c]),
)

export function chainIdFromName(name: string): number | undefined {
  return byName.get(name.toLowerCase())?.id
}