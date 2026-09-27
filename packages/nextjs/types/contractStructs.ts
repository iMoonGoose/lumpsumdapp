import { Address as AddressType } from "viem";

export type LumpSumEscrow = {
    index: bigint;
    grantee: AddressType;
    fundedTimestamp: number;
    daysToMature: number;
    isReleased: boolean;
    isRevokedBeforeMaturing: boolean;
    isRevokedAfterMaturing: boolean;
    giver: AddressType;
    amount: bigint;
}