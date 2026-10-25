export const lumpsuminethAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3" as const;
export const lumpsuminethAbi = [
  {
    inputs: [],
    name: "AlreadyReleased",
    type: "error",
  },
  {
    inputs: [],
    name: "AlreadyRevoked",
    type: "error",
  },
  {
    inputs: [],
    name: "DepositingIsDisabled",
    type: "error",
  },
  {
    inputs: [],
    name: "FailedCall",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
    ],
    name: "InsufficientBalance",
    type: "error",
  },
  {
    inputs: [],
    name: "NoFunds",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "NoSuchEscrow",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "stage",
        type: "uint8",
      },
    ],
    name: "NoSuchStage",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "you",
        type: "address",
      },
      {
        internalType: "address",
        name: "funder",
        type: "address",
      },
    ],
    name: "NotTheFunder",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "you",
        type: "address",
      },
      {
        internalType: "address",
        name: "grantee",
        type: "address",
      },
    ],
    name: "NotTheGrantee",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [],
    name: "Unrevokable",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint48",
        name: "atLeastTill",
        type: "uint48",
      },
    ],
    name: "WaitMore",
    type: "error",
  },
  {
    inputs: [],
    name: "ZeroAddress",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "giver",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "grantee",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "i",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "depositedAmount",
        type: "uint256",
      },
    ],
    name: "LumpSumDeposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "giver",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "grantee",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "i",
        type: "uint256",
      },
    ],
    name: "LumpSumReleased",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "giver",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "grantee",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "i",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "oldAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "revokedAmount",
        type: "uint256",
      },
    ],
    name: "LumpSumRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "CLAIM_PERIOD_IN_DAYS",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "calcCommission",
    outputs: [
      {
        internalType: "uint256",
        name: "comission",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint48",
        name: "fundedTimestamp_",
        type: "uint48",
      },
      {
        internalType: "uint16",
        name: "daysToMature_",
        type: "uint16",
      },
      {
        internalType: "enum MaturityStages",
        name: "stage",
        type: "uint8",
      },
    ],
    name: "calcMaturityStageUpperBorder",
    outputs: [
      {
        internalType: "uint48",
        name: "stageBorderTimestamp",
        type: "uint48",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "commissionRatePromille",
    outputs: [
      {
        internalType: "uint8",
        name: "rate",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "escrows",
    outputs: [
      {
        internalType: "address",
        name: "grantee",
        type: "address",
      },
      {
        internalType: "uint48",
        name: "fundedTimestamp",
        type: "uint48",
      },
      {
        internalType: "uint16",
        name: "daysToMature",
        type: "uint16",
      },
      {
        internalType: "bool",
        name: "isReleased",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "isRevokedBeforeMaturing",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "isRevokedAfterMaturing",
        type: "bool",
      },
      {
        internalType: "address",
        name: "giver",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "grantee_",
        type: "address",
      },
      {
        internalType: "uint16",
        name: "daysToMature_",
        type: "uint16",
      },
    ],
    name: "fundLumpSumGrant",
    outputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getEscrowCount",
    outputs: [
      {
        internalType: "uint256",
        name: "length",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isDisabled",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint48",
        name: "fundedTimestamp_",
        type: "uint48",
      },
      {
        internalType: "uint16",
        name: "daysToMature_",
        type: "uint16",
      },
    ],
    name: "lookupMaturityStage",
    outputs: [
      {
        internalType: "enum MaturityStages",
        name: "currentStage",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "newCommissionRatePromille",
    outputs: [
      {
        internalType: "uint8",
        name: "rate",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "newCommissionTimestamp",
    outputs: [
      {
        internalType: "uint48",
        name: "dt",
        type: "uint48",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "value",
        type: "uint8",
      },
    ],
    name: "planNewCommissionRate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "i",
        type: "uint256",
      },
    ],
    name: "release",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "i",
        type: "uint256",
      },
    ],
    name: "revoke",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "status",
        type: "bool",
      },
    ],
    name: "setDisabledStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
