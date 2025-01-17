'use client'
import React, { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as WalletProviderDefault } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { Chilanka } from 'next/font/google';
 
// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');
 
export const WalletProvider: FC<{children: ReactNode}> = ({ children }: { children: ReactNode}) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Devnet;
 
    // You can also provide a custom RPC endpoint.
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);
 
    const wallets = useMemo(
        () => [
            /**
             * Wallets that implement either of these standards will be available automatically.
             *
             *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
             *     (https://github.com/solana-mobile/mobile-wallet-adapter)
             *   - Solana Wallet Standard
             *     (https://github.com/anza-xyz/wallet-standard)
             *
             * If you wish to support a wallet that supports neither of those standards,
             * instantiate its legacy wallet adapter here. Common legacy adapters can be found
             * in the npm package `@solana/wallet-adapter-wallets`.
             */
            new UnsafeBurnerWalletAdapter(),
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [network]
    );
 
    return (
      <ConnectionProvider endpoint={endpoint}>
          <WalletProviderDefault wallets={wallets} autoConnect>
              <WalletModalProvider>
                { children }
                  {/* <WalletMultiButton />
                  <WalletDisconnectButton /> */}
                  { /* Your app's components go here, nested within the context providers. */ }
              </WalletModalProvider>       
          </WalletProviderDefault>
      </ConnectionProvider>
 
    );
};