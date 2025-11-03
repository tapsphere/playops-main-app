import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveAccount, useDisconnect } from 'thirdweb/react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { Wallet as WalletIcon, Home, User, Hexagon, TrendingUp, Copy, ExternalLink, Coins } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import PlayerHeader from '@/components/ui/PlayerHeader';
import { supabase } from '@/integrations/supabase/client';

const Wallet = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(4);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [totalXp, setTotalXp] = useState(0);
  const [totalPlyo, setTotalPlyo] = useState(0);
  const [transactions, setTransactions] = useState<Array<{
    type: string;
    amount: string;
    date: string;
    desc: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('loadWalletData: No user found');
          setLoading(false);
          return;
        }
        
        // Load profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('total_xp, total_plyo')
          .eq('user_id', user.id)
          .single();
        
        if (profileError) throw profileError;
        if (profileData) {
          setTotalXp(profileData.total_xp || 0);
          setTotalPlyo(profileData.total_plyo || 0);
        }

        // Load recent game results (transactions)
        const { data: gameResults, error: resultsError } = await supabase
          .from('game_results')
          .select(`
            created_at,
            passed,
            scoring_metrics,
            game_templates(name),
            brand_customizations(game_templates(name))
          `)
          .eq('user_id', user.id)
          .eq('passed', true) // Only show winning transactions
          .order('created_at', { ascending: false })
          .limit(10);

        if (resultsError) throw resultsError;

        // Format transactions (PLYO earned = 10 per passed game)
        const formattedTransactions = (gameResults || []).map(result => {
          const gameName = (result.game_templates as any)?.name || 
                          (result.brand_customizations as any)?.game_templates?.name || 
                          'Validator Game';
          return {
            type: 'Earned',
            amount: '+10',
            date: new Date(result.created_at).toISOString().split('T')[0],
            desc: gameName
          };
        });

        setTransactions(formattedTransactions);
      } catch (error) {
        console.error('Failed to load wallet data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWalletData();
  }, []);

  // App's auth state
  const { logout, isLoading: isAuthLoading, loggedIn } = useAuth();

  // Wallet states
  const evmAccount = useActiveAccount();
  const tonAddress = useTonAddress();
  const { disconnect } = useDisconnect();
  const [tonConnectUI] = useTonConnectUI();

  // Wallet provider loading states
  const isTonRestoring = tonConnectUI.connectionRestoring;
  const isEvmConnecting = evmAccount?.status === 'connecting';
  const isWalletRestoring = isTonRestoring || isEvmConnecting;

  // Derived connection state
  const isActuallyConnected = !!(evmAccount?.address || tonAddress);

  // Optimistic UI state
  const [optimisticIsConnected, setOptimisticIsConnected] = useState(isActuallyConnected);

  // Handle the disconnect button click
  const handleDisconnect = async () => {
    if (isDisconnecting) return;
    
    setIsDisconnecting(true);
    try {
      if (evmAccount) {
        await disconnect();
      }
      if (tonAddress) {
        await tonConnectUI.disconnect();
      }
    } catch (error) {
      console.error("Error during wallet disconnect:", error);
    } finally {
      // Always log out the user from the app session
      await logout();
      setOptimisticIsConnected(false);
      setIsDisconnecting(false);
    }
  };

  const handleConnectWallet = () => {
    navigate('/auth');
  };

  const copyAddress = () => {
    const address = evmAccount?.address || tonAddress;
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  const menuItems = [
    { icon: Home, label: 'Hub', path: '/lobby' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Hexagon, label: 'Inventory', path: '/inventory' },
    { icon: TrendingUp, label: 'Leaderboard', path: '/leaderboard' },
    { icon: WalletIcon, label: 'Wallet', path: '/wallet' },
  ];

  const handleNavigation = (path: string, index: number) => {
    setActiveIndex(index);
    navigate(path);
  };

  // Show a loading state while the app auth or wallets are restoring
  if (isAuthLoading || isWalletRestoring) {
    return (
      <div className="relative w-full min-h-screen bg-black pb-24 flex items-center justify-center">
        <div className="text-neon-green">Loading Wallet...</div>
      </div>
    );
  }

  const walletType = evmAccount?.address ? 'EVM' : 'TON';
  const address = evmAccount?.address || tonAddress;
  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  return (
    <div className="relative w-full min-h-screen bg-black pb-24">
      <PlayerHeader totalXp={totalXp} totalPlyo={totalPlyo} />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {!optimisticIsConnected ? (
          <Card className="bg-black/50 border-2 p-8 text-center relative overflow-hidden" style={{ borderColor: 'hsl(var(--neon-green))' }}>
            <div 
              className="absolute inset-0 opacity-10"
              style={{ 
                background: 'radial-gradient(circle at center, hsl(var(--neon-magenta)), hsl(var(--neon-purple)), hsl(var(--neon-green)))'
              }}
            />
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto mb-6 rounded-lg bg-black border-2 flex items-center justify-center" style={{ borderColor: 'hsl(var(--neon-green))' }}>
                <WalletIcon className="w-12 h-12" style={{ color: 'hsl(var(--neon-green))' }} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-glow-green tracking-wide" style={{ color: 'hsl(var(--neon-green))' }}>
                Connect Your TON Wallet
              </h2>
              <p className="text-sm font-mono mb-8" style={{ color: 'hsl(var(--neon-green) / 0.7)' }}>
                Connect to view and manage your PLYO tokens
              </p>
              <Button
                onClick={handleConnectWallet}
                className="border-2 bg-transparent hover:bg-primary/20 text-lg tracking-widest px-8 py-6 font-bold transition-all hover:scale-105"
                style={{ 
                  borderColor: 'hsl(var(--neon-green))',
                  color: 'hsl(var(--neon-green))'
                }}
              >
                CONNECT WALLET
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <Card className="bg-black/50 border-2 p-6" style={{ borderColor: 'hsl(var(--neon-green))' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-black border-2 flex items-center justify-center" style={{ borderColor: 'hsl(var(--neon-green))' }}>
                    <WalletIcon className="w-6 h-6" style={{ color: 'hsl(var(--neon-green))' }} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs font-mono mb-1" style={{ color: 'hsl(var(--neon-green) / 0.6)' }}>
                      {walletType} Wallet
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm text-glow-green" style={{ color: 'hsl(var(--neon-green))' }}>
                        {truncatedAddress}
                      </p>
                      <button onClick={copyAddress} className="hover:scale-110 transition-transform">
                        <Copy className="w-4 h-4" style={{ color: 'hsl(var(--neon-green))' }} />
                      </button>
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-2 border-green-500 font-mono">
                  Connected
                </Badge>
              </div>
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="w-full border-2 hover:bg-primary/10 font-mono"
                style={{ 
                  borderColor: 'hsl(var(--neon-green) / 0.5)',
                  color: 'hsl(var(--neon-green))'
                }}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </Card>

            <Card className="bg-black/50 border-2 p-8 text-center relative overflow-hidden" style={{ borderColor: 'hsl(var(--neon-magenta))' }}>
              <div 
                className="absolute inset-0 opacity-10"
                style={{ 
                  background: 'radial-gradient(circle at center, hsl(var(--neon-magenta)), transparent 70%)'
                }}
              />
              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-black border-2 flex items-center justify-center" style={{ borderColor: 'hsl(var(--neon-magenta))' }}>
                  <Coins className="w-10 h-10" style={{ color: 'hsl(var(--neon-magenta))' }} strokeWidth={2.5} />
                </div>
                <p className="text-sm font-mono mb-2" style={{ color: 'hsl(var(--neon-magenta) / 0.7)' }}>
                  PLYO Balance
                </p>
                <h2 className="text-5xl font-bold mb-6 text-glow-magenta tracking-wider" style={{ color: 'hsl(var(--neon-magenta))' }}>
                  {totalPlyo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <p className="text-xs font-mono" style={{ color: 'hsl(var(--neon-green) / 0.5)' }}>
                  1 PLYO = 1 USD equivalent
                </p>
              </div>
            </Card>

            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--neon-green))' }}>
                Recent Transactions
              </h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-gray-400">Loading transactions...</div>
                ) : transactions.length > 0 ? (
                  transactions.map((tx, idx) => (
                  <Card key={idx} className="bg-black/50 border-2 p-4 hover:bg-black/70 transition-all" style={{ borderColor: 'hsl(var(--neon-green))' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-mono" style={{ borderColor: 'hsl(var(--neon-green))', color: 'hsl(var(--neon-green))' }}>
                            {tx.type}
                          </Badge>
                          <p className="text-sm font-mono" style={{ color: 'hsl(var(--neon-green) / 0.7)' }}>
                            {tx.desc}
                          </p>
                        </div>
                        <p className="text-xs font-mono" style={{ color: 'hsl(var(--neon-green) / 0.5)' }}>
                          {tx.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-400">
                          {tx.amount}
                        </p>
                        <p className="text-xs font-mono" style={{ color: 'hsl(var(--neon-green) / 0.5)' }}>
                          PLYO
                        </p>
                      </div>
                    </div>
                  </Card>
                  ))
                ) : (
                  <Card className="bg-black/50 border-2 p-6 text-center" style={{ borderColor: 'hsl(var(--neon-green))' }}>
                    <p className="text-sm font-mono text-gray-400">No transactions yet. Complete games to earn PLYO!</p>
                  </Card>
                )}
              </div>
            </div>

            <Card className="bg-black/50 border-2 p-6 text-center" style={{ borderColor: 'hsl(var(--neon-purple))' }}>
              <p className="text-sm font-mono mb-4" style={{ color: 'hsl(var(--neon-green) / 0.7)' }}>
                Earn PLYO by completing validators and proving your competencies
              </p>
              <a 
                href="#" 
                className="inline-flex items-center gap-2 text-sm font-mono hover:scale-105 transition-transform"
                style={{ color: 'hsl(var(--neon-purple))' }}
              >
                Learn more about PLYO <ExternalLink className="w-4 h-4" />
              </a>
            </Card>
          </>
        )}
      </div>

      <div 
        className="fixed bottom-0 left-0 right-0 border-t-2 bg-black/95 backdrop-blur-lg z-50"
        style={{ borderColor: 'hsl(var(--neon-green))' }}
      >
        <nav className="flex items-center justify-around px-2 py-2 max-w-screen-xl mx-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeIndex === index;
            const usePurple = index === 2;
            const accentColor = usePurple ? 'hsl(var(--neon-purple))' : 'hsl(var(--neon-green))';
            const glowClass = usePurple ? 'text-glow-purple' : 'text-glow-green';
            
            return (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.path, index)}
                className="flex flex-col items-center gap-1 flex-1 max-w-[90px] group transition-all duration-300 relative"
              >
                {isActive && (
                  <div 
                    className="absolute inset-0 rounded-lg opacity-20 blur-md"
                    style={{ background: accentColor }}
                  />
                )}
                <div 
                  className={`
                    relative p-2.5 rounded-lg border-2 transition-all duration-300
                    ${isActive ? 'bg-primary/20 scale-110' : 'border-transparent hover:bg-primary/10 hover:border-primary/30'}
                  `}
                  style={isActive ? { borderColor: accentColor } : {}}
                >
                  <Icon 
                    className={`w-5 h-5 md:w-6 md:h-6 transition-all duration-300 ${isActive ? glowClass : ''}`}
                    style={{ color: accentColor }}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span 
                  className={`text-[10px] md:text-xs font-mono transition-all duration-300 truncate w-full text-center ${isActive ? glowClass + ' font-bold' : ''}`}
                  style={{ color: accentColor }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Wallet;