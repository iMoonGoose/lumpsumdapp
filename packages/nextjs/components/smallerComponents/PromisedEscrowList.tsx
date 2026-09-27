"use client";

import { Address } from "@scaffold-ui/components";
import { formatAmount, formatTimestamp, hasItPassed } from "~~/utils/formatting";
import { useReleaseHook } from "~~/hooks/lumpsumContract/lumpsumCommon";
import {LumpSumEscrow} from '~~/types/contractStructs'
import { DaisyErrorAlert } from "./ErrorDisplay";


type Props = {
    escrows: LumpSumEscrow[],
    releaseWindowDuration: number,
}

export const PromisedEscrowList = ({ escrows, releaseWindowDuration }: Props) => {
  const { release, isError, error } = useReleaseHook();

  const tdClass = "max-md:flex max-md:justify-between max-md:border-0 max-md:before:content-[attr(data-label)] max-md:before:font-semibold";

  const theTable = (
      <table className="table table-zebra table-sm w-full">
        <thead className="max-md:hidden">
          <tr>
            <th>#</th>
            <th>Giver</th>
            <th>Grantee</th>
            <th>Amount</th>
            <th>Funded At</th>
            <th>Mature At</th>
            <th>Released</th>
            <th>Revoked (Before)</th>
            <th>Revoked (After)</th>
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
                data-label="Giver"
                className={tdClass}
              >
                <Address address={escrow.giver} onlyEnsOrAddress size="sm" />
              </td>

              <td
                data-label="Grantee"
                className={tdClass}
              >
                <span>me</span>
              </td>

              <td
                data-label="Amount"
                className={tdClass}
              >
                {formatAmount(escrow.amount)}
              </td>

              <td
                data-label="Funded At"
                className={tdClass}
              >
                {formatTimestamp(escrow.fundedTimestamp)}</td>

              <td
                data-label="Mature At"
                className={tdClass}
              >
                {formatTimestamp(escrow.fundedTimestamp, escrow.daysToMature)}</td>

              <td
                data-label="Released"
                className={tdClass}
              >
                {
                  escrow.isReleased
                    ? <span>Yes</span>
                    : escrow.isRevokedAfterMaturing
                      ? <span>Revoked after</span>
                      : Number(escrow.amount) === 0
                        ? <span>No funds</span>
                        : !hasItPassed(escrow.fundedTimestamp, escrow.daysToMature)
                          ? <span>Unlocks {formatTimestamp(escrow.fundedTimestamp, escrow.daysToMature)}</span>
                          : <button className="h-10 btn btn-primary btn-sm px-2" onClick={async () => await release(escrow.index)}>Claim until {formatTimestamp(escrow.fundedTimestamp, escrow.daysToMature + releaseWindowDuration)}</button>
                }
              </td>

              <td
                data-label="Revoked (Before)"
                className={tdClass}
              >
                {
                  escrow.isRevokedBeforeMaturing
                    ? <span>Yes</span>
                    : escrow.isReleased
                      ? <span>Released</span>
                      : escrow.isRevokedAfterMaturing
                        ? <span>Revoked after</span>
                        : Number(escrow.amount) === 0
                        ? <span>No funds</span>
                          : hasItPassed(escrow.fundedTimestamp, escrow.daysToMature)
                            ? <span>Locked {formatTimestamp(escrow.fundedTimestamp, escrow.daysToMature)}</span>
                            : <span>Revokable</span>
                }
              </td>

              <td
                data-label="Revoked (After)"
                className={tdClass}
              >
                {
                  escrow.isRevokedAfterMaturing
                  ? <span>Yes</span>
                  : escrow.isReleased
                    ? <span>Released</span>
                    : escrow.isRevokedBeforeMaturing
                      ? <span>Revoked before</span>
                      : Number(escrow.amount) === 0
                        ? <span>No funds</span>
                        : !hasItPassed(escrow.fundedTimestamp, escrow.daysToMature + releaseWindowDuration)
                          ? <span>Since {formatTimestamp(escrow.fundedTimestamp, escrow.daysToMature + releaseWindowDuration)}</span>
                          : <span>Revokable</span>
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
