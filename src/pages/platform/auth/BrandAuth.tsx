import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import { WalletConnect } from '@/components/WalletConnect';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveAccount, useDisconnect } from 'thirdweb/react';
import { useTonWallet, useTonConnectUI } from '@tonconnect/ui-react';
import { Address } from '@ton/core';

export default function BrandAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/platform/brand';
  const { loggedIn, showOnboarding, userRole, logout } = useAuth();

  const evmAccount = useActiveAccount();
  const { disconnect: evmDisconnect } = useDisconnect();
  const tonWallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  // After wallet login, auto-redirect when brand role and no onboarding
  useEffect(() => {
    if (loggedIn && !showOnboarding && (userRole === 'brand' || !userRole)) {
      navigate(redirect);
    }
  }, [loggedIn, showOnboarding, userRole, redirect, navigate]);
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              company_name: formData.companyName,
              full_name: formData.companyName,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Create profile
          await supabase.from('profiles').insert({
            user_id: data.user.id,
            company_name: formData.companyName,
            full_name: formData.companyName,
          });

          // Assign brand role
          await supabase.from('user_roles').insert({
            user_id: data.user.id,
            role: 'brand',
          });

          toast.success('Brand account created! Please check your email to verify.');
          navigate(redirect);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        // Ensure brand role exists
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: role } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'brand')
            .maybeSingle();
          if (!role) {
            await supabase.from('user_roles').insert({ user_id: user.id, role: 'brand' });
          }
        }

        toast.success('Welcome back!');
        navigate(redirect);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-gray-900 border-2 p-8" style={{ borderColor: 'hsl(var(--neon-green))' }}>
        <div className="text-center mb-8">
          <Building2 className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--neon-green))' }} />
          <h1 className="text-3xl font-bold mb-2 text-white">Brand Portal</h1>
          <p className="text-gray-400">{isSignUp ? 'Create your brand account' : 'Sign in to your brand account'}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Email Auth */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              style={{ backgroundColor: 'hsl(var(--neon-green))', color: 'black' }}
            >
              {loading ? 'Loading...' : isSignUp ? 'Create Brand Account' : 'Sign In'}
            </Button>

            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-gray-400 hover:text-white"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>

          {/* Wallet Auth (TON + EVM) */}
          <div>
            {loggedIn && walletAddress ? (
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
              <WalletConnect role="brand" />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

