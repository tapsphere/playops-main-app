import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useActiveAccount } from 'thirdweb/react';
import { useTonWallet } from '@tonconnect/ui-react';
import { toast } from 'sonner';

type AuthContextType = {
  loggedIn: boolean;
  showOnboarding: boolean;
  userRole: string | null;
  userId: string | null;
  isLoading: boolean;
  login: (address: string, provider: 'TON' | 'EVM', role?: 'creator' | 'brand' | 'player' | 'admin') => Promise<void>;
  logout: () => void;
  completeOnboarding: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loggedIn, setLoggedIn] = useState(sessionStorage.getItem('loggedIn') === 'true');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast: showToast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile, error: profileError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
          
          // Handle missing role gracefully
          if (profileError) {
            if (profileError.code === 'PGRST116') {
              // No role found, create default player role
              const { error: insertError } = await supabase
                .from('user_roles')
                .insert({ user_id: user.id, role: 'player' });
              if (!insertError) {
                setUserRole('player');
              }
            } else if (profileError.code === '42703') {
              // Column doesn't exist error - this shouldn't happen with user_roles
              // but handle gracefully
              console.warn('Role query error (column issue):', profileError.message);
            } else {
              console.error('Error fetching user role:', profileError);
            }
          } else if (profile) {
          setUserRole(profile.role);
          }
        }
      } catch (error: any) {
        // Handle any errors gracefully, including profiles.role queries from cached code
        if (error.code === '42703' && error.message?.includes('role')) {
          console.warn('Profiles.role query detected (likely cached build issue). Ignoring error.');
        } else {
          console.error('Auth fetch error:', error);
        }
      }
    };

    if (loggedIn) {
      fetchUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [loggedIn]);

  const login = async (address: string, provider: 'TON' | 'EVM', role: 'creator' | 'brand' | 'player' | 'admin' = 'player') => {
    if (loggedIn && userRole && userRole !== role) {
      toast.error(`You are already logged in as a ${userRole}.`);
      return;
    }
    try {
      const email = `${address}@${provider.toLowerCase()}.wallet`;
      const password = `secret-${address}`;

      const { data: { user }, error: fetchError } = await supabase.auth.signInWithPassword({ email, password });

      if (fetchError) {
        if (fetchError.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                wallet_address: address,
                full_name: `Player ${address.slice(0, 6)}`,
              },
            },
          });

          if (signUpError) throw signUpError;

          if (signUpData.user) {
            setUserId(signUpData.user.id);
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({ user_id: signUpData.user.id, role: role });
            if (roleError) throw roleError;
            setUserRole(role);
          }

          if (!loggedIn) {
            toast.success('Welcome! Please set up your profile.');
          }
          setShowOnboarding(true);
          setLoggedIn(true);
          sessionStorage.setItem('loggedIn', 'true');
          return;
        } else {
          throw fetchError;
        }
      }

      if (user) {
        setUserId(user.id);
        const { data: profile, error: profileError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          // If no role found, assign default 'player' role
          if (profileError.code === 'PGRST116') {
            const { error: insertError } = await supabase.from('user_roles').insert({ user_id: user.id, role: 'player' });
            if (insertError) throw insertError;
            setUserRole('player');
          } else {
            throw profileError;
          }
        } else {
          setUserRole(profile.role);
        }
      }
      
      if (!loggedIn) {
        toast.success(`Welcome Back! Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
      }
      setLoggedIn(true);
      sessionStorage.setItem('loggedIn', 'true');

    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error('Authentication Failed', { description: error.message });
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out from Supabase:', error);
      toast.error('Logout Failed', { description: (error as any).message });
    } finally {
      sessionStorage.removeItem('loggedIn');
      setLoggedIn(false);
      setUserRole(null);
      setUserId(null);
      toast.info('You have been logged out.');
    }
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  const value = { loggedIn, showOnboarding, userRole, userId, isLoading, login, logout, completeOnboarding };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};