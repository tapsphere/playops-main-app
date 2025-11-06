import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { createWallet } from "thirdweb/wallets";
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from './ui/card';
import { client } from "@/providers/ThirdwebProvider";

export function WalletConnect({ role }: { role?: 'creator' | 'brand' | 'player' }) {
  const tonWallet = useTonWallet();
  const evmAccount = useActiveAccount();
  const evmAddress = evmAccount?.address;
  const { login, showOnboarding } = useAuth();

  useEffect(() => {
    if (evmAddress) {
      login(evmAddress, 'EVM', role);
    }
  }, [evmAddress, login, role]);

  useEffect(() => {
    if (tonWallet) {
      login(tonWallet.account.address, 'TON', role);
    }
  }, [tonWallet, login, role]);

  if (showOnboarding) {
    // The OnboardingForm will be shown by the page, not the component itself.
    return null;
  }
  return (
    <Card className="p-6 bg-gray-900/50 border-neon-green/30 space-y-6">
      <div>
        <div className="text-center space-y-2 mb-4">
          <h3 className="text-xl font-bold text-white">Connect TON Wallet</h3>
          <p className="text-sm text-gray-400">
            {typeof window !== 'undefined' && window.innerWidth <= 768 
              ? 'Connect your TON wallet to access the game grid'
              : 'Scan QR code with mobile wallet or install Tonkeeper extension'}
          </p>
        </div>
        <div className="flex justify-center">
          <TonConnectButton />
        </div>
      </div>

      <div className='flex items-center justify-center'>
        <div className='w-full h-px bg-gray-600'></div>
        <div className='px-2 text-gray-400 text-sm'>OR</div>
        <div className='w-full h-px bg-gray-600'></div>
      </div>

      <div>
        <div className="text-center space-y-2 mb-4">
          <h3 className="text-xl font-bold text-white">Connect EVM Wallet</h3>
          <p className="text-sm text-gray-400">
            Connect with MetaMask, Coinbase Wallet, etc.
          </p>
        </div>
        <div className="flex justify-center">
          <ConnectButton 
            client={client} 
            theme="dark" 
            wallets={[
              createWallet("io.metamask"),
              createWallet("com.coinbase.wallet"),
              createWallet("walletConnect"),
            ]}
          />
        </div>
      </div>
    </Card>
  );
}