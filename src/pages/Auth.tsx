import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { WalletConnect } from '@/components/WalletConnect';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingForm } from '@/components/OnboardingForm';
import { useActiveAccount, useDisconnect } from 'thirdweb/react';
import { useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import { Address } from '@ton/core';
import { Button } from '@/components/ui/button';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loggedIn, showOnboarding, logout } = useAuth();

  const evmAccount = useActiveAccount();
  const { disconnect: evmDisconnect } = useDisconnect();
  const tonWallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
    if (loggedIn && !showOnboarding) {
      const redirectUrl = searchParams.get('redirect');
      navigate(redirectUrl || '/lobby');
    }
  }, [loggedIn, showOnboarding, navigate, searchParams]);

  const handleDisconnect = async () => {
    if (tonWallet) {
      await tonConnectUI.disconnect();
    }
    if (evmAccount) {
      await evmDisconnect();
    }
    logout();
  };

  const formatAddress = (address: string) => {
    try {
      // Try parsing as TON address first
      const tonAddr = Address.parse(address).toString({ bounceable: false, urlSafe: true });
      return `${tonAddr.slice(0, 6)}...${tonAddr.slice(-4)}`;
    } catch (e) {
      // Fallback for EVM or other formats
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
  };

  const walletAddress = evmAccount?.address || tonWallet?.account.address;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {loggedIn && showOnboarding ? (
          <OnboardingForm />
        ) : loggedIn && walletAddress ? (
          <Card className="w-full p-8 bg-gray-900 border-neon-green text-center">
            <h1 className="text-2xl font-bold text-center mb-2" style={{ color: 'hsl(var(--neon-green))' }}>
              Connected
            </h1>
            <p className="text-sm text-gray-400 text-center mb-6">
              You are already connected.
            </p>
            <div className="mb-4 p-2 bg-black rounded-md font-mono text-neon-green break-all">
              {formatAddress(walletAddress)}
            </div>
            <Button onClick={handleDisconnect} variant="destructive" className="w-full">
              Disconnect
            </Button>
          </Card>
        ) : (
          <Card className="w-full p-8 bg-gray-900 border-neon-green">
            <h1 className="text-2xl font-bold text-center mb-2" style={{ color: 'hsl(var(--neon-green))' }}>
              Creator & Brand Platform
            </h1>
            <p className="text-sm text-gray-400 text-center mb-6">
              Connect your wallet to continue
            </p>
            <WalletConnect />
          </Card>
        )}
      </div>
    </div>
  );
}
