"use client";

import { DaisyErrorAlert } from "./ErrorDisplay";
import { Address } from "@scaffold-ui/components";
import { useTranslation } from "react-i18next";
import { useAppState } from "~~/hooks/appContext";
import { useContractInstanceState } from "~~/hooks/contractInstanceContext";
import { useRevokeHook } from "~~/hooks/lumpsumContract/lumpsumCommon";
import { LumpSumEscrow } from "~~/types/contractStructs";
import { prettifyCoinAmount } from "~~/utils/formatting";

type Props = {
  escrows: LumpSumEscrow[];
  releaseWindowDuration: number;
};

export const FundedEscrowList = ({ escrows, releaseWindowDuration }: Props) => {
  const { t } = useTranslation();

  const { revoke, isError, error } = useRevokeHook();
  const { contractType } = useContractInstanceState();
  const { formatTimestamp, hasItPassed } = useAppState();

  /**
   * Renders the "Revoked (Before)" cell content. Extracted so it can be
   * reused by both the desktop table and the mobile card layout.
   */
  const renderRevokedBefore = (escrow: LumpSumEscrow) => {
    if (escrow.isRevokedBeforeMaturing) return <span>{t("Yes")}</span>;
    if (escrow.isReleased) return <span>{t("Released")}</span>;
    if (escrow.isRevokedAfterMaturing) return <span>{t("Revoked (After)")}</span>;
    if (Number(escrow.amount) === 0) return <span>{t("No funds")}</span>;
    if (hasItPassed(escrow.fundedTimestamp, escrow.daysToMature)) {
      return (
        <span>
          {t("Locked")} {formatTimestamp(escrow.fundedTimestamp, escrow.daysToMature)}
        </span>
      );
    }
    return (
      <button
        className="btn btn-primary btn-sm px-2 h-auto min-h-10 whitespace-normal text-xs"
        onClick={async () => await revoke(escrow.index)}
      >
        {t("Revoke until")} {formatTimestamp(escrow.fundedTimestamp, escrow.daysToMature)}
      </button>
    );
  };

  /**
   * Renders the "Revoked (After)" cell content.
   */
  const renderRevokedAfter = (escrow: LumpSumEscrow) => {
    if (escrow.isRevokedAfterMaturing) return <span>{t("Yes")}</span>;
    if (escrow.isReleased) return <span>{t("Released")}</span>;
    if (Number(escrow.amount) === 0) return <span>{t("No funds")}</span>;
    if (!hasItPassed(escrow.fundedTimestamp, escrow.daysToMature + releaseWindowDuration)) {
      return (
        <span>
          {t("Since")} {formatTimestamp(escrow.fundedTimestamp, escrow.daysToMature + releaseWindowDuration)}
        </span>
      );
    }
    return (
      <button className="btn btn-primary btn-sm px-2" onClick={async () => await revoke(escrow.index)}>
        {t("Revoke")}
      </button>
    );
  };

  /**
   * Renders the "Released" cell content.
   */
  const renderReleased = (escrow: LumpSumEscrow) => {
    if (escrow.isReleased) return <span>{t("Yes")}</span>;
    if (escrow.isRevokedAfterMaturing) return <span>{t("Revoked (After)")}</span>;
    if (Number(escrow.amount) === 0) return <span>{t("No funds")}</span>;
    if (!hasItPassed(escrow.fundedTimestamp, escrow.daysToMature)) {
      return (
        <span>
          {t("Unlocks")} {formatTimestamp(escrow.fundedTimestamp, escrow.daysToMature)}
        </span>
      );
    }
    return <span>{t("Waiting")}</span>;
  };

  const content = isError ? (
    <DaisyErrorAlert error={error} />
  ) : (
    <>
      {/* ---------- Desktop: real table ---------- */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="table table-zebra table-sm w-full">
          <thead>
            <tr>
              <th>#</th>
              <th>{t("Giver")}</th>
              <th>{t("Grantee")}</th>
              <th>{t("Amount")}</th>
              <th>{t("Funded At")}</th>
              <th>{t("Mature At")}</th>
              <th>{t("Released")}</th>
              <th>{t("Revoked (Before)")}</th>
              <th>{t("Revoked (After)")}</th>
            </tr>
          </thead>
          <tbody>
            {escrows.map(escrow => (
              <tr key={escrow.index}>
                <th>{escrow.index}</th>
                <td>
                  <span>{t("me")}</span>
                </td>
                <td>
                  <Address
                    address={escrow.grantee}
                    onlyEnsOrAddress
                    size="sm"
                    style={{ color: "var(--color-primary)" }}
                  />
                </td>
                <td>{prettifyCoinAmount(escrow.amount, contractType, true)}</td>
                <td>{formatTimestamp(escrow.fundedTimestamp)}</td>
                <td>{formatTimestamp(escrow.fundedTimestamp, escrow.daysToMature)}</td>
                <td>{renderReleased(escrow)}</td>
                <td>{renderRevokedBefore(escrow)}</td>
                <td>{renderRevokedAfter(escrow)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- Mobile: card list ---------- */}
      <div className="md:hidden flex flex-col gap-3">
        {escrows.map(escrow => (
          <div key={escrow.index} className="card bg-base-200 border border-base-300">
            <div className="card-body p-4 gap-2">
              <div className="flex items-center justify-between border-b border-base-300 pb-2">
                <span className="text-xs opacity-60">#{escrow.index}</span>
                <span className="text-primary font-semibold">
                  {prettifyCoinAmount(escrow.amount, contractType, true)}
                </span>
              </div>

              <Row label={t("Giver")}>
                <span>{t("me")}</span>
              </Row>

              <Row label={t("Grantee")}>
                <Address
                  address={escrow.grantee}
                  onlyEnsOrAddress
                  size="sm"
                  style={{ color: "var(--color-primary)" }}
                />
              </Row>

              <Row label={t("Funded At")}>
                <span>{formatTimestamp(escrow.fundedTimestamp)}</span>
              </Row>

              <Row label={t("Mature At")}>
                <span>{formatTimestamp(escrow.fundedTimestamp, escrow.daysToMature)}</span>
              </Row>

              <Row label={t("Released")}>{renderReleased(escrow)}</Row>

              <Row label={t("Revoked (Before)")}>{renderRevokedBefore(escrow)}</Row>

              <Row label={t("Revoked (After)")}>{renderRevokedAfter(escrow)}</Row>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return <div className="w-full">{content}</div>;
};

/**
 * Small helper for the mobile card layout: a label on the left, value on the right.
 * On narrow screens the value is right-aligned; long values wrap instead of overflowing.
 */
const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-xs font-semibold opacity-70 shrink-0">{label}</span>
    <span className="text-right text-sm wrap-break-word min-w-0">{children}</span>
  </div>
);
