export function netOutCommission(amount: number, ratePromille: number): number;
export function netOutCommission(amount: bigint, ratePromille: number): bigint;
export function netOutCommission(amount: number | bigint, ratePromille: number): number | bigint {
    if (typeof amount === 'number') {
      return amount * (1000 - ratePromille) / 1000;
    } else {
      return amount * BigInt(1000n - BigInt(ratePromille)) / 1000n;
    }
    throw new Error('Unreachable code');
}

export function grossInCommission(amount: number, ratePromille: number): number;
export function grossInCommission(amount: bigint, ratePromille: number): bigint;
export function grossInCommission(amount: number | bigint, ratePromille: number): number | bigint {
    if (typeof amount === 'number') {
      return amount * 1000 / (1000 - ratePromille);
    } else {
      return amount * 1000n / BigInt(1000n - BigInt(ratePromille));
    }
    throw new Error('Unreachable code');
}