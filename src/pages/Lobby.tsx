import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Search, Target, ChevronRight, Star, Zap, Rocket, Sparkles, Home, User, Hexagon, TrendingUp, Wallet } from 'lucide-react';
import PlayerHeader from '@/components/ui/PlayerHeader';
import { WalletConnect } from '@/components/WalletConnect';
import { useTonWallet } from '@tonconnect/ui-react';
import { useActiveAccount } from 'thirdweb/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OnboardingForm } from '@/components/OnboardingForm';

import { toast } from 'sonner';





const mockPrograms = [
  { title: 'Future Skills 2025', duration: '1 Month = 2 Years XP', skills: 24, icon: Zap },
  { title: 'Marketing Mastery', duration: '6 Weeks Program', skills: 18, icon: Rocket },
  { title: 'Data Analytics Fast Track', duration: '4 Weeks Intensive', skills: 15, icon: Sparkles },
];

type LiveGame = {
  id: string;
  unique_code: string;
  brand_id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  brand_name: string;
  game_templates: {
    name: string;
    preview_image: string | null;
  };
};

import { useAuth } from '@/contexts/AuthContext';

const Lobby = () => {
  const navigate = useNavigate();
  const tonWallet = useTonWallet();
  const evmAccount = useActiveAccount();
  const isConnected = !!tonWallet || !!evmAccount;
  const { loggedIn, showOnboarding } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalXp, setTotalXp] = useState(0);
  const [totalPlyo, setTotalPlyo] = useState(0);

  const { toast: showToast } = useToast();

  const menuItems = [
    { icon: Home, label: 'Hub', path: '/lobby' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Hexagon, label: 'Inventory', path: '/inventory' },
    { icon: TrendingUp, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
  ];

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('loadProfileData: No user found');
          return;
        }
        const { data, error } = await supabase
          .from('profiles')
          .select('total_xp, total_plyo')
          .eq('user_id', user.id)
          .single();
        
        // Handle errors gracefully, especially cached build issues
        if (error) {
          if (error.code === '42703' && error.message?.includes('role')) {
            console.warn('Profiles.role query detected (cached build issue). Retrying with explicit columns.');
            // Retry with explicit columns
            const { data: retryData, error: retryError } = await supabase
              .from('profiles')
              .select('total_xp, total_plyo')
              .eq('user_id', user.id)
              .single();
            if (retryError) {
              console.error('Failed to load profile data after retry:', retryError);
              return;
            }
            if (retryData) {
              setTotalXp(retryData.total_xp || 0);
              setTotalPlyo(retryData.total_plyo || 0);
            }
            return;
          }
          throw error;
        }
        
        if (data) {
          setTotalXp(data.total_xp || 0);
          setTotalPlyo(data.total_plyo || 0);
        }
      } catch (error: any) {
        // Don't crash the app if profile data fails to load
        console.error('Failed to load profile data:', error);
        // Set defaults to prevent UI issues
        setTotalXp(0);
        setTotalPlyo(0);
      }
    };

    if (loggedIn) {
      loadLiveGames();
      loadProfileData();
    }
  }, [loggedIn]);

  const loadLiveGames = async () => {
    try {
      const { data: games, error: gamesError } = await supabase
        .from('brand_customizations')
        .select(
          `
          id,
          unique_code,
          brand_id,
          logo_url,
          primary_color,
          secondary_color,
          game_templates (name, preview_image)
          `
        )
        .not('published_at', 'is', null)
        .order('created_at', { ascending: false });

      if (gamesError) throw gamesError;

      const brandIds = [...new Set(games.map(g => g.brand_id))];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, company_name')
        .in('user_id', brandIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profiles.map(p => [p.user_id, p.company_name]));

      const mappedGames: LiveGame[] = games.map((item: any) => ({
        id: item.id,
        unique_code: item.unique_code,
        brand_id: item.brand_id,
        logo_url: item.logo_url || null,
        primary_color: item.primary_color || '#00ff00',
        secondary_color: item.secondary_color || '#ff00ff',
        brand_name: profilesMap.get(item.brand_id) || 'Brand',
        game_templates: {
          name: item.game_templates?.name || 'Validator',
          preview_image: item.game_templates?.preview_image || null,
        },
      }));
      setLiveGames(mappedGames || []);
    } catch (error: any) {
      console.error('Failed to load live games:', error);
      showToast({ title: 'Error', description: `Failed to load live games: ${error.message}`, variant: 'destructive' });
    }
  };

  const handleNavigation = (path: string, index: number) => {
    setActiveIndex(index);
    navigate(path);
  };

  // Filter games based on search
  const filteredGames = liveGames.filter(game => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      game.game_templates?.name?.toLowerCase().includes(query) ||
      game.brand_name?.toLowerCase().includes(query)
    );
  });

  if (showOnboarding) {
    return <OnboardingForm />;
  }

  // Gate access if wallet not connected
  if (!isConnected || !loggedIn) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold" style={{ color: 'hsl(var(--neon-green))' }}>
              🔒 Wallet Required
            </h1>
            <p className="text-gray-400">Connect your wallet to access the game grid</p>
          </div>
          <WalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-black pb-24">
      <PlayerHeader totalXp={totalXp} totalPlyo={totalPlyo} />

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'hsl(var(--neon-green))' }} />
          <input
            type="text"
            placeholder="Search brands, skills, validators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border-2 rounded-lg pl-12 pr-4 py-3 text-sm font-mono focus:outline-none focus:ring-2"
            style={{
              borderColor: 'hsl(var(--neon-green))',
              color: 'hsl(var(--neon-green))'
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        <Tabs defaultValue="brands" className="w-full">
          <TabsList className="w-full bg-black/50 border-2 mb-6" style={{ borderColor: 'hsl(var(--neon-green))' }}>
            <TabsTrigger value="brands" className="flex-1 data-[state=active]:bg-primary/20">
              <Building2 className="w-4 h-4 mr-2" />
              Brand Stores
            </TabsTrigger>
            <TabsTrigger value="programs" className="flex-1 data-[state=active]:bg-primary/20">
              <Target className="w-4 h-4 mr-2" />
              Programs
            </TabsTrigger>
          </TabsList>

          {/* Brand Stores Tab */}
          <TabsContent value="brands" className="space-y-6">
            {/* Department Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['All', 'Marketing', 'Operations', 'Finance', 'Communications'].map((dept) => (
                <Button
                  key={dept}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap border-2 font-mono"
                  style={{ borderColor: 'hsl(var(--neon-green))', color: 'hsl(var(--neon-green))' }}
                >
                  {dept}
                </Button>
              ))}
            </div>

            {/* Brand Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Live Published Games */}
              {filteredGames.map((game, idx) => {
                const useMagenta = idx % 3 === 1;
                const usePurple = idx % 3 === 2;
                const borderColor = useMagenta ? 'hsl(var(--neon-magenta))' : usePurple ? 'hsl(var(--neon-purple))' : 'hsl(var(--neon-green))';
                const glowClass = useMagenta ? 'text-glow-magenta' : usePurple ? 'text-glow-purple' : 'text-glow-green';
                
                return (
                  <Card
                    key={game.id}
                    className="bg-black/50 border-2 p-6 hover:bg-black/70 transition-all cursor-pointer group relative overflow-hidden"
                    style={{ borderColor }}
                    onClick={() => {
                      if (game.unique_code) {
                        navigate(`/play/${game.unique_code}`);
                      } else {
                        toast.error('Game code not found');
                      }
                    }}
                  >
                    {/* Glow effect on hover */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
                      style={{ 
                        background: `radial-gradient(circle at center, ${borderColor}, transparent 70%)`
                      }}
                    />
                    
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex flex-col items-center gap-1">
                        <div 
                          className="w-16 h-16 rounded-lg bg-white/5 border-2 p-2 flex items-center justify-center hover:border-primary transition-colors cursor-pointer" 
                          style={{ borderColor: `${borderColor}33` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/brand/${game.brand_id}`);
                          }}
                        >
                          {game.logo_url ? (
                            <img src={game.logo_url} alt="Brand" className="w-full h-full object-contain" />
                          ) : (
                            <Building2 className="w-8 h-8" style={{ color: borderColor }} />
                          )}
                        </div>
                        {game.brand_name && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/brand/${game.brand_id}`);
                            }}
                            className="text-xs font-mono hover:underline cursor-pointer"
                            style={{ color: `${borderColor}dd` }}
                          >
                            {game.brand_name}
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className="border-2 font-mono text-[9px] bg-black/50" style={{ borderColor: 'hsl(var(--neon-purple))', color: 'hsl(var(--neon-purple))' }}>
                          LIVE
                        </Badge>
                        <Badge 
                          className="border-2 font-mono text-[9px] bg-black/50 cursor-pointer hover:bg-white/10"
                          style={{ borderColor, color: borderColor }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/brand/${game.brand_id}`);
                          }}
                        >
                          STORE
                        </Badge>
                      </div>
                    </div>
                    <h3 
                      className={`text-xl font-bold mb-2 tracking-wide relative z-10 ${glowClass}`}
                      style={{ color: borderColor }}
                    >
                      {game.game_templates?.name || 'Validator'}
                    </h3>
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-sm font-mono" style={{ color: 'hsl(var(--neon-green) / 0.7)' }}>
                        Play Now
                      </span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" style={{ color: borderColor }} />
                    </div>
                  </Card>
                );
              })}

              
            </div>
          </TabsContent>

          {/* Programs Tab */}
          <TabsContent value="programs" className="space-y-4">
            {mockPrograms.map((program, idx) => {
              const IconComponent = program.icon;
              const usePurple = idx === 1;
              const accentColor = usePurple ? 'hsl(var(--neon-purple))' : 'hsl(var(--neon-green))';
              const accentGlow = usePurple ? 'text-glow-purple' : 'text-glow-green';
              
              return (
                <Card
                  key={idx}
                  className="bg-black/50 border-2 p-6 hover:bg-black/70 transition-all cursor-pointer group relative overflow-hidden"
                  style={{ borderColor: accentColor }}
                >
                  {/* Glow effect on hover */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
                    style={{ 
                      background: `radial-gradient(circle at left, ${accentColor}, transparent 70%)`
                    }}
                  />
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-20 h-20 rounded-lg bg-black border-2 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ borderColor: accentColor }}>
                      <IconComponent className="w-10 h-10" style={{ color: accentColor }} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold mb-1 tracking-wide ${accentGlow}`} style={{ color: accentColor }}>
                        {program.title}
                      </h3>
                      <p className="text-sm font-mono mb-2" style={{ color: 'hsl(var(--neon-green) / 0.7)' }}>
                        {program.duration} • {program.skills} Competencies
                      </p>
                      <div className="flex gap-2">
                        <Badge className="border-2 font-mono text-[9px] bg-black/50" style={{ borderColor: 'hsl(var(--neon-purple))', color: 'hsl(var(--neon-purple))' }}>
                          CBE
                        </Badge>
                        <Badge variant="outline" className="text-xs font-mono" style={{ borderColor: accentColor, color: accentColor }}>
                          <Star className="w-3 h-3 mr-1" fill={accentColor} />
                          Featured
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" style={{ color: accentColor }} />
                  </div>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation Bar */}
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

export default Lobby;
