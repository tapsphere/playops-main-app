import { useTonWallet } from '@tonconnect/ui-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const TonAuthHandler = () => {
  const wallet = useTonWallet();
  const { login, loggedIn, pendingOnboardingInfo } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    if (wallet && !loggedIn && !pendingOnboardingInfo) {
      const roleFromPath = pathname.split('/')[2];
      const validRoles = ['creator', 'brand', 'player', 'admin'];
      const role = validRoles.includes(roleFromPath) ? roleFromPath as 'creator' | 'brand' | 'player' | 'admin' : 'player';
      login(wallet.account.address, 'TON', role);
    }
  }, [wallet, login, loggedIn, pathname, pendingOnboardingInfo]);

  return null;
};
