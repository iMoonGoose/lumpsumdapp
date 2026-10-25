"use client";
import { DaisyErrorAlert } from "./ErrorDisplay";
import { Tip } from "./Tip";
import { SIGNED_NUMBER_REGEX } from "@scaffold-ui/hooks";
import { useTranslation } from "react-i18next";
import { useAdaptableBalance } from "~~/hooks/accounts";
import { useContractInstanceState } from "~~/hooks/contractInstanceContext";
import { useCommissionRate } from "~~/hooks/lumpsumContract/lumpsumCommon";
import { prettyTextToUint, roundUpTo } from "~~/utils/formatting";
import { grossInCommission, netOutCommission } from "~~/utils/lumpsumContract/lumpsumCommon";

type Props = {
  disabled: boolean;
  handleApproval: () => any;
  sourceValue: string;
  setSourceValue: (v: string) => void;
  netSourceValue: string;
  setNetSourceValue: (v: string) => void;
};

export const TokenInput = ({
  disabled,
  sourceValue,
  handleApproval,
  setSourceValue,
  netSourceValue,
  setNetSourceValue,
}: Props) => {
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
    if (value === ".") {
      value = "0.";
    }

    if (isNet) {
      setNetSourceValue(value);
      setSourceValue(String(grossInCommission(Number(value), rate)));
    } else {
      setSourceValue(value);
      setNetSourceValue(String(netOutCommission(Number(value), rate)));
    }
  };
  const isApproveDisabled =
    !(BigInt(Math.round(Number(sourceValue))) > 0) ||
    !giversBalance ||
    prettyTextToUint(sourceValue, contractType) > giversBalance;
  return (
    <>
      {commisionRateError && <DaisyErrorAlert error={commisionRateError} />}
      <div className="flex flex-col md:flex-row items-center gap-4 w-full border-2 p-2 text-sui-input-text font-sans bg-sui-input-background border-sui-input-border">
        {/* Input row: $ + send input  */}
        <div className="flex items-center gap-2 w-full">
          <span className="pl-2 -mr-2 self-center" style={{ width: "30px" }}>
            $
          </span>
          <input
            className="w-full focus:outline-none font-medium"
            placeholder={t("You send")}
            disabled={disabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value, false)}
            value={activeValueFull}
          />
        </div>
        {/* rate row */}
        <div className="flex items-center justify-center gap-4 md:gap-2 w-full">
          <span className="pl-2 -mr-2 self-center">-{rate / 10}%</span>
          <Tip text={t("Rate tip")} className="tooltip-bottom" />
        </div>
        {/* Output row: grantee input */}
        <div className="flex items-center gap-2 w-full">
          <span className="pl-2 -mr-2 self-center md:hidden" style={{ width: "30px" }}>
            $
          </span>
          <input
            className="w-full focus:outline-none font-medium"
            placeholder={t("Grantee gets")}
            disabled={disabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value, true)}
            value={activeValueAfterCommission}
          />
        </div>

        {/* Approve row */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            disabled={isApproveDisabled}
            onClick={handleApproval}
            className="h-8 btn btn-secondary w-full md:w-auto md:min-w-32"
          >
            {t("Approve")}
          </button>
          <Tip text={t("Approve allowance tip")} className="tooltip-left" />
        </div>
      </div>
    </>
  );
};
