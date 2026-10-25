"use client";

import { JetBrains_Mono } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import "@scaffold-ui/components/styles.css";
import { ScaffoldEthAppLayout, ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { AppStateProvider } from "~~/hooks/appContext";
import { ContractInstanceProvider } from "~~/hooks/contractInstanceContext";
import "~~/locales/i18n";
import "~~/styles/globals.css";

const inter = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning className={inter.variable} data-theme="light">
      <body>
        <ScaffoldEthAppWithProviders>
          <ContractInstanceProvider>
            <AppStateProvider>
              <ScaffoldEthAppLayout>{children}</ScaffoldEthAppLayout>
            </AppStateProvider>
          </ContractInstanceProvider>
        </ScaffoldEthAppWithProviders>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
