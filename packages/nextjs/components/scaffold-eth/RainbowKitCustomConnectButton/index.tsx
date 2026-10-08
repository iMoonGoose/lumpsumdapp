"use client";

// @refresh reset
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { RevealBurnerPKModal } from "./RevealBurnerPKModal";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Balance } from "@scaffold-ui/components";
import { getBlockExplorerAddressLink } from "@scaffold-ui/hooks";
import { useTranslation } from "react-i18next";
import { Address } from "viem";
import { useAdaptableBalance } from "~~/hooks/accounts";
import { useContractInstanceState } from "~~/hooks/contractInstanceContext";
import { useNetworkColor } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { ContractTypes } from "~~/types/nets";
import { prettifyCoinAmount } from "~~/utils/formatting";

/**
 * Custom Wagmi Connect Button (watch balance + custom design)
 */
export const RainbowKitCustomConnectButton = () => {
  const { t } = useTranslation();
  
  const networkColor = useNetworkColor();
  const { targetNetwork } = useTargetNetwork();
  const { contractType } = useContractInstanceState();
  const { giversBalance, isBalanceError } = useAdaptableBalance();

  const balanceRead = (account: any) => (
      contractType === ContractTypes.ETH
      ? <Balance
        address={account.address as Address}
        style={{
          minHeight: "0",
          height: "auto",
          fontSize: "0.8em",
        }}
      />
      : <div>{
        isBalanceError || typeof giversBalance !== 'bigint' 
        ? t('error')
        : prettifyCoinAmount(giversBalance, contractType)
        } <b>{contractType.toUpperCase()}</b></div>
  );

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;
        const blockExplorerAddressLink = account
          ? getBlockExplorerAddressLink(targetNetwork, account.address)
          : undefined;

        return (
          <>
            {(() => {
              if (!connected) {
                return (
                  <button className="btn btn-primary btn-sm" onClick={openConnectModal} type="button">
                    {t('Connect Wallet')}
                  </button>
                );
              }

              if (chain.unsupported || chain.id !== targetNetwork.id) {
                return <WrongNetworkDropdown />;
              }

              return (
                <>
                  <div className="flex flex-col items-center mr-2">
                    {balanceRead(account)}
                    <span className="text-xs" style={{ color: networkColor }}>
                      {chain.name}
                    </span>
                  </div>
                  <AddressInfoDropdown
                    address={account.address as Address}
                    displayName={account.displayName}
                    ensAvatar={account.ensAvatar}
                    blockExplorerAddressLink={blockExplorerAddressLink}
                  />
                  <AddressQRCodeModal address={account.address as Address} modalId="qrcode-modal" />
                  <RevealBurnerPKModal />
                </>
              );
            })()}
          </>
        );
      }}
    </ConnectButton.Custom>
  );
};
