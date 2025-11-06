import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useActiveAccount } from 'thirdweb/react';
import { useTonWallet } from '@tonconnect/ui-react';
import { toast } from 'sonner';
import { uploadFile } from '@/utils/supabase';

type AuthContextType = {
  loggedIn: boolean;
  showOnboarding: boolean;
  userRole: string | null;
  userId: string | null;
  isLoading: boolean;
  pendingOnboardingInfo: { address: string, provider: 'TON' | 'EVM' } | null;
  login: (address: string, provider: 'TON' | 'EVM', role?: 'creator' | 'brand' | 'player' | 'admin') => Promise<void>;
  logout: () => void;
  completeOnboarding: () => void;
  completePlayerOnboarding: (formData: any, avatarFile: File | null, companyLogoFile: File | null) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loggedIn, setLoggedIn] = useState(sessionStorage.getItem('loggedIn') === 'true');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingOnboardingInfo, setPendingOnboardingInfo] = useState<{ address: string, provider: 'TON' | 'EVM' } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast: showToast } = useToast();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setLoggedIn(true);
        setUserId(session.user.id);
        fetchUserRole(session.user.id);
        sessionStorage.setItem('loggedIn', 'true');
      } else if (event === 'SIGNED_OUT') {
        setLoggedIn(false);
        setUserRole(null);
        setUserId(null);
        sessionStorage.removeItem('loggedIn');
      }
      setIsLoading(false);
    });

    // Initial check
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setLoggedIn(true);
        setUserId(session.user.id);
        fetchUserRole(session.user.id);
      } else {
        setLoggedIn(false);
      }
      setIsLoading(false);
    };

    checkInitialSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({ user_id: userId, role: 'player' });
          if (!insertError) {
            setUserRole('player');
          }
        } else {
          console.error('Error fetching user role:', profileError);
        }
      } else if (profile) {
        setUserRole(profile.role);
      }
    } catch (error: any) {
      console.error('Auth fetch error:', error);
    }
  };

  const login = useCallback(async (address: string, provider: 'TON' | 'EVM', role: 'creator' | 'brand' | 'player' | 'admin' = 'player') => {
    if (loggedIn && userRole && userRole !== role) {
      toast.error(`You are already logged in as a ${userRole}.`);
      return;
    }
    try {
      const sanitizedAddress = address.replace(/[^a-zA-Z0-9._-]/g, '');
      const email = `${sanitizedAddress}@${provider.toLowerCase()}.wallet`;
      const password = `secret-${address.slice(0, 60)}`;

      const { data: { user }, error: fetchError } = await supabase.auth.signInWithPassword({ email, password });

      if (fetchError) {
        if (fetchError.message.includes('Invalid login credentials')) {
          if (role === 'player') {
            setPendingOnboardingInfo({ address, provider });
            setShowOnboarding(true);
            return;
          }

          // For roles other than player, sign up immediately
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                wallet_address: address,
                full_name: role === 'creator' ? 'New Creator' : 'New Brand',
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
          if (profileError.code === 'PGRST116') {
            const { error: insertError } = await supabase.from('user_roles').insert({ user_id: user.id, role: 'player' });
            if (insertError) throw insertError;
            setUserRole('player');
          } else {
            throw profileError;
          }
        }
        else {
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
  }, [loggedIn, userRole]);


  const logout = useCallback(async () => {
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
  }, []);

  const completeOnboarding = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  const completePlayerOnboarding = useCallback(async (formData: any, avatarFile: File | null, companyLogoFile: File | null) => {
    if (!pendingOnboardingInfo) return;

    const { address, provider } = pendingOnboardingInfo;
    const sanitizedAddress = address.replace(/[^a-zA-Z0-9._-]/g, '');
    const email = `${sanitizedAddress}@${provider.toLowerCase()}.wallet`;
    const password = `secret-${address.slice(0, 60)}`;

    try {
      // 1. Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            wallet_address: address,
            full_name: formData.full_name,
          },
        },
      });

      if (signUpError) throw signUpError;

      const user = signUpData.user;
      if (!user) throw new Error('User creation failed');

      // The onAuthStateChange listener will handle setting the session
      // Now that the user is created and will be logged in, proceed with uploads

      // 2. Upload files
      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadFile(avatarFile, 'avatars');
      }

      let companyLogoUrl = null;
      if (companyLogoFile) {
        companyLogoUrl = await uploadFile(companyLogoFile, 'logos');
      }

      // 3. Update the profile with all data
      const profileData = {
        ...formData,
        avatar_url: avatarUrl,
        company_logo_url: companyLogoUrl,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // 4. Finish onboarding
      // The user role is already being created by the onAuthStateChange listener
      setUserRole('player');

      toast.success('Welcome! Your profile has been created.');
      setShowOnboarding(false);
      setPendingOnboardingInfo(null);

    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error('Onboarding Failed', { description: error.message });
    }
  }, [pendingOnboardingInfo]);

  const value = { loggedIn, showOnboarding, userRole, userId, isLoading, login, logout, completeOnboarding, completePlayerOnboarding, pendingOnboardingInfo };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};