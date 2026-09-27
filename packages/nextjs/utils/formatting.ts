import { formatEther } from "viem";

export const DAY_IN_MILLISECONDS = 1000 * 24 * 60 * 60;
export const DAY_IN_SECONDS = 24 * 60 * 60;

export const formatTimestamp = (timestamp: number, dateShift?: number) => {
  if (timestamp === 0) return "—";
  return new Date((Number(timestamp) + (dateShift ?? 0) * DAY_IN_SECONDS)* 1000).toLocaleString();
};

export const formatAmount = (amount: bigint) => {
  const eth = Number(formatEther(amount));
  return `${eth.toLocaleString(undefined, { maximumFractionDigits: 4 })} ETH`;
};

export const hasItPassed = (funded: number, days_to_add: number): boolean => {
  return Date.now() / 1000  + 32 * DAY_IN_SECONDS > funded + days_to_add * DAY_IN_SECONDS;
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
    return String(Math.round((Number(n) + Number.EPSILON) * 10 * p) / (10 * p));
  }
  return n;
}