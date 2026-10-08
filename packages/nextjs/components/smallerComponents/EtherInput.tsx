"use client";
import { useEffect, useRef, useState } from "react";
import { useEtherInput, SIGNED_NUMBER_REGEX } from "@scaffold-ui/hooks";
import { ArrowsRightLeftIcon  } from '@heroicons/react/24/outline';
import { useCommissionRate } from "~~/hooks/lumpsumContract/lumpsumCommon";
import { DaisyErrorAlert } from "./ErrorDisplay";
import { grossInCommission, netOutCommission } from "~~/utils/lumpsumContract/lumpsumCommon";
import { roundUpTo } from "~~/utils/formatting";
import { useTranslation } from "react-i18next";
import { Tip } from "./Tip";
type Props = {
    disabled: boolean;
    onValueChange: ({ valueInEth, valueInUsd, displayUsdMode }: { valueInEth: string, valueInUsd: string, displayUsdMode: boolean }) => void;
    sourceValue: string,
    setSourceValue: (v: string) => void;
    netSourceValue: string,
    setNetSourceValue: (v: string) => void;
}

export const EtherInput = ({ disabled, onValueChange, sourceValue, setSourceValue, netSourceValue, setNetSourceValue }: Props) => {
  const { t } = useTranslation();
  
  const [sourceUsdMode, setSourceUsdMode] = useState(false);
    const [displayUsdMode, setDisplayUsdMode] = useState(false);
    const onValueChangeRef = useRef(onValueChange);
    const { rate, error: commisionRateError } = useCommissionRate();

    onValueChangeRef.current = onValueChange;
    const { valueInEth, valueInUsd, isNativeCurrencyPriceLoading, isNativeCurrencyPriceError } = useEtherInput({
        value: sourceValue,
        usdMode: sourceUsdMode,
    });
    const { valueInEth: netValueInEth, valueInUsd: netValueInUsd } = useEtherInput({
        value: netSourceValue,
        usdMode: sourceUsdMode,
    });

    const decimalsMax = displayUsdMode ? 2 : 4;

    const activeValueFull = roundUpTo(displayUsdMode ? valueInUsd : valueInEth, decimalsMax);
    const activeValueAfterCommission = roundUpTo(displayUsdMode ? netValueInUsd : netValueInEth, decimalsMax);

    useEffect(() => {
        if (onValueChangeRef.current) {
            onValueChangeRef.current({ valueInEth, valueInUsd, displayUsdMode });
        }
    }, [valueInEth, valueInUsd, displayUsdMode]);
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
        if (sourceUsdMode !== displayUsdMode) {
            setSourceUsdMode(displayUsdMode);
        }
    };
    const handleToggleMode = () => {
        setDisplayUsdMode((prev) => !prev);
    };
    const isToggleDisabled = isNativeCurrencyPriceLoading || isNativeCurrencyPriceError || disabled;
    return (
        <>
            { commisionRateError && <DaisyErrorAlert error={commisionRateError} /> }
            <div className="flex items-center gap-4 w-full border-2 p-2 text-sui-input-text font-sans bg-sui-input-background border-sui-input-border ">
                <span className="pl-2 -mr-2 self-center" style={{width: "30px"}}>{displayUsdMode ? "$" : "Ξ"}</span>
                <input className="w-full focus:outline-none placeholder:text-sui-accent/70 font-medium" placeholder={t("You send")} disabled={disabled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value, false)} value={activeValueFull}></input>
                <span className="pl-2 -mr-2 self-center">-{rate/10}%</span>
                <Tip text={t('Rate tip')} className="tooltip-bottom" />
                <input className="w-full focus:outline-none placeholder:text-sui-accent/70 font-medium" placeholder={t("Grantee gets")} disabled={disabled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value, true)} value={activeValueAfterCommission}></input>
                <button
                    disabled={isToggleDisabled}
                    onClick={handleToggleMode}
                    title={isNativeCurrencyPriceLoading
                        ? t("Fetching price")
                        : isNativeCurrencyPriceError
                                ? t("Unable to fetch price")
                                : t("Toggle USD/ETH")}
                                >
                    <ArrowsRightLeftIcon className="mr-2 h-4 w-4"/>
                </button>
            </div>
        </>
    );    
};
