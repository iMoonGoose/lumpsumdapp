"use client";

import { Address } from "@scaffold-ui/components";
import { prettifyCoinAmount } from "~~/utils/formatting";
import { useReleaseHook } from "~~/hooks/lumpsumContract/lumpsumCommon";
import {LumpSumEscrow} from '~~/types/contractStructs'
import { DaisyErrorAlert } from "./ErrorDisplay";
import { useContractInstanceState } from "~~/hooks/contractInstanceContext";
import { useTranslation } from "react-i18next";
import { useAppState } from "~~/hooks/appContext";


type Props = {
    escrows: LumpSumEscrow[],
    releaseWindowDuration: number,
}

export const PromisedEscrowList = ({ escrows, releaseWindowDuration }: Props) => {
  const { t } = useTranslation();
  
  const { release, isError, error } = useReleaseHook();
  const { contractType } = useContractInstanceState();
  const { formatTimestamp, hasItPassed } = useAppState();

  const tdClass = "max-md:flex max-md:justify-between max-md:border-0 max-md:before:content-[attr(data-label)] max-md:before:font-semibold";

  const theTable = (
      <table className="table table-zebra table-sm w-full">
        <thead className="max-md:hidden">
          <tr>
            <th>#</th>
            <th>{t('Giver')}</th>
            <th>{t('Grantee')}</th>
            <th>{t('Amount')}</th>
            <th>{t('Funded At')}</th>
            <th>{t('Mature At')}</th>
            <th>{t('Released')}</th>
            <th>{t('Revoked (Before)')}</th>
            <th>{t('Revoked (After)')}</th>
          </tr>
        </thead>
        <tbody>
          {escrows.map((escrow) => (
            <tr key={`${escrow.index}`} className="max-md:block max-md:mb-3 max-md:border max-md:rounded-box max-md:p-3">
              <th
                data-label="#"
                className={tdClass}
              >
                {escrow.index}
              </th>

              <td
                data-label={t('Giver')}
                className={tdClass}
              >
                <Address address={escrow.giver} onlyEnsOrAddress size="sm" />
              </td>

              <td
                data-label={t('Grantee')}
                className={tdClass}
              >
                <span>{t('me')}</span>
              </td>

              <td
                data-label={t('Amount')}
                className={tdClass}
              >
                {prettifyCoinAmount(escrow.amount, contractType, true)}
              </td>

              <td
                data-label={t('Funded At')}
                className={tdClass}
              >
                {formatTimestamp(escrow.fundedTimestamp)}</td>

              <td
                data-label={t('Mature At')}
                className={tdClass}
              >
                {formatTimestamp(escrow.fundedTimestamp, escrow.daysToMature)}</td>

              <td
                data-label={t('Released')}
                className={tdClass}
              >
                {
                  escrow.isReleased
                    ? <span>{t('Yes')}</span>
                    : escrow.isRevokedAfterMaturing
                      ? <span>{t("Revoked (After)")}</span>
                      : Number(escrow.amount) === 0
                        ? <span>{t('No funds')}</span>
                        : !hasItPassed(escrow.fundedTimestamp, escrow.daysToMature)
                          ? <span>{t('Unlocks')} {formatTimestamp(escrow.fundedTimestamp, escrow.daysToMature)}</span>
                          : <button className="h-10 btn btn-primary btn-sm px-2" onClick={async () => await release(escrow.index)}>{t('Claim until')} {formatTimestamp(escrow.fundedTimestamp, escrow.daysToMature + releaseWindowDuration)}</button>
                }
              </td>

              <td
                data-label="Revoked (Before)"
                className={tdClass}
              >
                {
                  escrow.isRevokedBeforeMaturing
                    ? <span>{t('Yes')}</span>
                    : escrow.isReleased
                      ? <span>{t('Released')}</span>
                      : escrow.isRevokedAfterMaturing
                        ? <span>{t("Revoked (After)")}</span>
                        : Number(escrow.amount) === 0
                        ? <span>{t('No funds')}</span>
                          : hasItPassed(escrow.fundedTimestamp, escrow.daysToMature)
                            ? <span>{t('Locked')} {formatTimestamp(escrow.fundedTimestamp, escrow.daysToMature)}</span>
                            : <span>{t('Revokable')}</span>
                }
              </td>

              <td
                data-label="Revoked (After)"
                className={tdClass}
              >
                {
                  escrow.isRevokedAfterMaturing
                  ? <span>{t('Yes')}</span>
                  : escrow.isReleased
                    ? <span>{t('Released')}</span>
                    : escrow.isRevokedBeforeMaturing
                      ? <span>{t('Revoked (Before)')}</span>
                      : Number(escrow.amount) === 0
                        ? <span>{t('No funds')}</span>
                        : !hasItPassed(escrow.fundedTimestamp, escrow.daysToMature + releaseWindowDuration)
                          ? <span>{t('Since')} {formatTimestamp(escrow.fundedTimestamp, escrow.daysToMature + releaseWindowDuration)}</span>
                          : <span>{t('Revokable')}</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );

  return (
    <div className="overflow-x-auto w-full">
      {
        isError
        ? <DaisyErrorAlert error={error}/>
        : theTable
      }
    </div>
  );
};
