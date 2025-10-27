import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { WalletConnect } from '@/components/WalletConnect';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingForm } from '@/components/OnboardingForm';
import { useActiveAccount, useDisconnect } from 'thirdweb/react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loggedIn, showOnboarding, logout } = useAuth();

  // Hooks for force disconnect
  const evmAccount = useActiveAccount();
  const { disconnect: evmDisconnect } = useDisconnect();
  const tonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  // Force disconnect on page load
  useEffect(() => {
    const forceDisconnect = async () => {
      if (evmAccount) {
        await evmDisconnect();
      }
      if (tonAddress) {
        await tonConnectUI.disconnect();
      }
      if (loggedIn) {
        logout();
      }
    };

    forceDisconnect();
  }, []); // Run only once on mount

  // Redirect after login
  useEffect(() => {
    if (loggedIn && !showOnboarding) {
      const redirectUrl = searchParams.get('redirect');
      navigate(redirectUrl || '/lobby');
    }
  }, [loggedIn, showOnboarding, navigate, searchParams]);


  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {loggedIn && showOnboarding ? (
          <OnboardingForm />
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