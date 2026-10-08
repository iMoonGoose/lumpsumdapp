import { hardhat, sepolia, mainnet, Chain } from 'viem/chains';
import { lumpsuminethAbi, lumpsuminethAddress } from '~~/contractsData/lumpsumineth';
import { lumpsuminerc20Abi, lumpsuminerc20Address } from '~~/contractsData/lumpsuminerc20';
import { AbiTypes, ContractAddressMapping, ContractInfoDictionary, ContractTypes } from '~~/types/nets';
import { Abi } from 'abitype';
import { erc20Abi } from 'viem';

export const CONTRACT_TYPES_TO_NETWORKS_ADDRESSES: ContractAddressMapping = {
  [hardhat.name]: {
    [ContractTypes.ETH]: {
      address: lumpsuminethAddress,
    },
    [ContractTypes.USDT]: {
      address: lumpsuminerc20Address,
    }
  },
};

// tip is a lang dict key!
export const CHAIN_TIPS: Record<string, string> = {
  [hardhat.name]: "netHardhatTip",
  [sepolia.name]: "netSepoliaTip",
  [mainnet.name]: "netMainnetTip",
};

// tip is a lang dict key!
export const CONTRACT_INFO: ContractInfoDictionary = {
  [ContractTypes.ETH]: {
    tip: 'lumpsuminethTip'
  },
  [ContractTypes.USDT]: {
    tip: 'lumpsuminUsdtTip',
  },
  [ContractTypes.USDC]: {
    tip: 'lumpsuminUsdcTip',
  },
};

export function getAbiForType(contractType: AbiTypes | ContractTypes): Abi {
  switch (contractType) {
    case AbiTypes.ERC20:
      return erc20Abi;
    case AbiTypes.LumpSumETH:
    case ContractTypes.ETH:
      return lumpsuminethAbi;
    case AbiTypes.LumpSumCoin:
    case ContractTypes.USDT:
    case ContractTypes.USDC:
      return lumpsuminerc20Abi;
  }
}

export const decimals: Record<ContractTypes, number> = {
  [ContractTypes.ETH]: 18,
  [ContractTypes.USDT]: 6,
  [ContractTypes.USDC]: 6,
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