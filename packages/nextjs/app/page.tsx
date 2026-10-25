// nextjs-frontend/src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccount } from "wagmi";
import { CommissionManager } from "~~/components/CommisionManager";
import { FundNewLumpSum } from "~~/components/FundNewLumpSum";
import { FundedByMe } from "~~/components/FundedByMe";
import { LocalhostOptions } from "~~/components/LocalHostOptions";
import { PromisedToMe } from "~~/components/PromisedToMe";
import QA from "~~/components/QA";
import { Collapsible } from "~~/components/smallerComponents/Collapsible";
import { DaisyErrorAlert } from "~~/components/smallerComponents/ErrorDisplay";
import { useAppState } from "~~/hooks/appContext";
import "~~/locales/i18n";

export default function Home() {
  const { t } = useTranslation();

  const { errorFetchingEscrows, errorFetchingReleaseWindow, escrowsFunded, escrowsPromised, owner } = useAppState();
  const { isConnected, address } = useAccount();
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    setIsLocalhost(
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname.startsWith("192.168.0."),
    );
  }, []);

  return (
    <main style={{ padding: "0.2rem" }}>
      {errorFetchingEscrows && <DaisyErrorAlert error={errorFetchingEscrows} />}
      {errorFetchingReleaseWindow && <DaisyErrorAlert error={errorFetchingReleaseWindow} />}
      {!isConnected || errorFetchingReleaseWindow || errorFetchingEscrows ? (
        <></>
      ) : (
        <>
          <Collapsible title={t(`Promise Lump Sum`)} defaultOpen={true}>
            <div>
              <FundNewLumpSum />
            </div>
          </Collapsible>

          <Collapsible title={t(`You funded`, { count: escrowsFunded.length })} disabled={escrowsFunded.length === 0}>
            <div>
              <FundedByMe />
            </div>
          </Collapsible>

          <Collapsible
            title={t(`Promised to you`, { count: escrowsPromised.length })}
            disabled={escrowsPromised.length === 0}
          >
            <div>
              <PromisedToMe />
            </div>
          </Collapsible>
        </>
      )}
      <Collapsible title={t(`QA`)} defaultOpen={!isConnected}>
        <div>
          <QA />
        </div>
      </Collapsible>
      {owner?.toLowerCase() === address?.toLowerCase() && typeof owner === "string" && (
        <Collapsible title={t(`Commission management`)} defaultOpen={false}>
          <div>
            <CommissionManager />
          </div>
        </Collapsible>
      )}
      {isLocalhost && (
        <Collapsible title={t(`Localhost Options`)} defaultOpen={false}>
          <div>
            <LocalhostOptions />
          </div>
        </Collapsible>
      )}
    </main>
  );
}
