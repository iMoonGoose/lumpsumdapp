'use client';

import '~~/locales/i18n';
import "@rainbow-me/rainbowkit/styles.css";
import "@scaffold-ui/components/styles.css";
import { ScaffoldEthAppLayout, ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { AppStateProvider } from "~~/hooks/appContext";
import { ContractInstanceProvider } from "~~/hooks/contractInstanceContext";
import "~~/styles/globals.css";
// import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

// export const metadata = getMetadata({
//   title: "Lump Sum App",
//   description: "Put money on the table",
// });

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning className={``} data-theme="light">
      <body>
          <ScaffoldEthAppWithProviders>
            <ContractInstanceProvider>
              <AppStateProvider>
                <ScaffoldEthAppLayout>
                  {children}
                </ScaffoldEthAppLayout>
              </AppStateProvider>
            </ContractInstanceProvider>
          </ScaffoldEthAppWithProviders>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
