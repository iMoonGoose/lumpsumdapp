// nextjs-frontend/src/app/page.tsx
'use client';

import {
  useAccount,
} from 'wagmi';
import { Collapsible } from '~~/components/smallerComponents/Collapsible';
import { CommissionManager } from '~~/components/CommisionManager';
import { DaisyErrorAlert } from '~~/components/smallerComponents/ErrorDisplay';
import { FundedByMe } from '~~/components/FundedByMe';
import { FundNewLumpSum } from '~~/components/FundNewLumpSum';
import { PromisedToMe } from '~~/components/PromisedToMe';
import QA from '~~/components/QA';
import { useAppState } from '~~/hooks/appContext';

export default function Home() {
  const {
    errorFetchingEscrows,
    errorFetchingReleaseWindow,
    escrowsFunded,
    escrowsPromised,
    owner,
  } = useAppState();
  const { isConnected, address } = useAccount();
  
  return (
    <main style={{ padding: '0.2rem', fontFamily: 'sans-serif' }}>
      {
        errorFetchingEscrows && <DaisyErrorAlert error={errorFetchingEscrows} />
      }
      {
        errorFetchingReleaseWindow && <DaisyErrorAlert error={errorFetchingReleaseWindow} />
      }
      {
        !isConnected || errorFetchingReleaseWindow || errorFetchingEscrows
        ? <></>
        : (
          <>
            <Collapsible
              title={`Promise Lump Sum`}
              defaultOpen={true}
            >
              <div>
                <FundNewLumpSum />
              </div>
            </Collapsible>

            <Collapsible
              title={`You funded ${escrowsFunded.length}`}
              disabled={escrowsFunded.length === 0}
            >
              <div>
                <FundedByMe />
              </div>
            </Collapsible>

            <Collapsible
              title={`Promised to you ${escrowsPromised.length}`}
              disabled={escrowsPromised.length === 0}
            >
              <div>
                <PromisedToMe />
              </div>
            </Collapsible>
          </>
        )
      }
      <Collapsible
        title={`QA`}
        defaultOpen={!isConnected}
      >
        <div>
          <QA />
        </div>
      </Collapsible>
      {
        (owner?.toLowerCase() === address?.toLowerCase() && typeof owner === 'string')
        && <Collapsible
          title={`Commission management`}
          defaultOpen={false}
        >
          <div>
            <CommissionManager />
          </div>
        </Collapsible>
      }
    </main>
  );
}