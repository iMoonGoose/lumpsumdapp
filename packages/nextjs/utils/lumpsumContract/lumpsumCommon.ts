export function netOutCommission(amount: number, ratePromille: number) {
    return amount * (1000 - ratePromille) / 1000;
}

export function grossInCommission(amount: number, ratePromille: number) {
    return amount /  ((1000 - ratePromille) / 1000 );
}