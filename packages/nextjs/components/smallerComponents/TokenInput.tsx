"use client";
import { SIGNED_NUMBER_REGEX } from "@scaffold-ui/hooks";
import { useCommissionRate } from "~~/hooks/lumpsumContract/lumpsumCommon";
import { DaisyErrorAlert } from "./ErrorDisplay";
import { grossInCommission, netOutCommission } from "~~/utils/lumpsumContract/lumpsumCommon";
import { prettyTextToUint, roundUpTo } from "~~/utils/formatting";
import { useAdaptableBalance } from "~~/hooks/accounts";
import { useContractInstanceState } from "~~/hooks/contractInstanceContext";
import { useTranslation } from "react-i18next";
import { Tip } from "./Tip";

type Props = {
    disabled: boolean;
    handleApproval: () => any;
    sourceValue: string,
    setSourceValue: (v: string) => void;
    netSourceValue: string,
    setNetSourceValue: (v: string) => void;
}

export const TokenInput = ({ disabled, sourceValue, handleApproval, setSourceValue, netSourceValue, setNetSourceValue }: Props) => {
  const { t } = useTranslation();  
  
  const { rate, error: commisionRateError } = useCommissionRate();
    const { giversBalance } = useAdaptableBalance();
    const { contractType } = useContractInstanceState();

    const decimalsMax = 2;

    const activeValueFull = roundUpTo(sourceValue, decimalsMax);
    const activeValueAfterCommission = roundUpTo(netSourceValue, decimalsMax);

    const handleInputChange = (value: string, isNet: boolean) => {
        if (value && !SIGNED_NUMBER_REGEX.test(value)) {
            return;
        }
        const decimals = value.split(".")[1];
        if (decimals && decimals.length > decimalsMax) {
            return;
        }
        if (value === '.') { value = "0."; }

        if (isNet) {
          setNetSourceValue(value);
          setSourceValue(
            String(grossInCommission(Number(value), rate))
          );
        } else {
          setSourceValue(value);
          setNetSourceValue(String(netOutCommission(Number(value), rate)));
        }
    };
    const isApproveDisabled = !(BigInt(Math.round(Number(sourceValue))) > 0) || !giversBalance || prettyTextToUint(sourceValue, contractType) > giversBalance;
    return (
        <>
            { commisionRateError && <DaisyErrorAlert error={commisionRateError} /> }
            <div className="flex items-center gap-4 w-full border-2 p-2 text-sui-input-text font-sans bg-sui-input-background border-sui-input-border ">
                <span className="pl-2 -mr-2 self-center" style={{width: "30px"}}>$</span>
                <input className="w-full focus:outline-none placeholder:text-sui-accent/70 font-medium" placeholder={t("You send")} disabled={disabled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value, false)} value={activeValueFull}></input>
                <span className="pl-2 -mr-2 self-center">-{rate/10}%</span>
                <Tip text={t('Rate tip')} className="tooltip-bottom" />
                <input className="w-full focus:outline-none placeholder:text-sui-accent/70 font-medium" placeholder={t("Grantee gets")} disabled={disabled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value, true)} value={activeValueAfterCommission}></input>
                <button
                    disabled={isApproveDisabled}
                    onClick={handleApproval}
                    className="h-8 btn btn-primary btn-sm w-1/4"
                >
                {t('Approve')}
                </button>
                <Tip text={t('Approve allowance tip')} className="tooltip-left" />
            </div>
        </>
    );    
};
