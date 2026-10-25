import { decimals } from "./nets";
import { formatEther } from "viem";
import { ContractTypes } from "~~/types/nets";

export const DAY_IN_MILLISECONDS = 1000 * 24 * 60 * 60;
export const DAY_IN_SECONDS = 24 * 60 * 60;
export const DEFAULT_TIME_LOCALE = "en-GB";

export const formatAmount = (amount: bigint) => {
  const eth = Number(formatEther(amount));
  return `${eth.toLocaleString(undefined, { maximumFractionDigits: 4 })} ETH`;
};

export function relativeFromToday(target: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.round((target.getTime() - today.getTime()) / DAY_IN_MILLISECONDS);
}

export function daysFromTodayToDate(daysDiff: number): Date {
  const t = new Date(Date.now() + DAY_IN_MILLISECONDS * daysDiff);
  t.setHours(0, 0, 0, 0);
  return t;
}

export function getTommorow() {
  return daysFromTodayToDate(1);
}

export function roundUpTo(n: string, p: number): string {
  const decimals = n.split(".")[1];
  if (decimals && decimals.length > p) {
    return String(Math.round((Number(n) + Number.EPSILON) * Math.pow(10, p)) / Math.pow(10, p));
  }
  return n;
}

export function prettifyCoinAmount(amount: bigint, t: ContractTypes, doShowTag: boolean = false): string {
  return (
    (doShowTag ? (t === ContractTypes.ETH ? "ETH " : "$ ") : "") +
    roundUpTo(`${Number(amount) / Math.pow(10, decimals[t])}`, t === ContractTypes.ETH ? 4 : 2)
  );
}

export function prettyTextToUint(amount: string, t: ContractTypes): bigint {
  return BigInt(Math.round(Number(amount) * Math.pow(10, decimals[t])));
}
