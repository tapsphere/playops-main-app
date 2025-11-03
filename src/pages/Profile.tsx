import { useActiveAccount, useActiveWalletConnectionStatus } from 'thirdweb/react';
import { useTonAddress } from '@tonconnect/ui-react';
import { User, Award, TrendingUp, Shield, Home, Hexagon, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import PlayerHeader from '@/components/ui/PlayerHeader';

import { supabase } from '@/integrations/supabase/client';


type GameResult = {
  id: string;
  proficiency_level: string;
  scoring_metrics: any;
  gameplay_data: any;
  created_at: string;
  passed: boolean;
};

const mockCompetencies = [
  { 
    name: 'Analytical Thinking / Critical Reasoning', 
    department: 'Operations', 
    level: 'mastery', 
    progress: 100,
    subCompetencies: 6,
    validator: 'Advanced Ops Puzzle'
  },
  { 
    name: 'AI & Big Data Skills', 
    department: 'All Departments', 
    level: 'proficient', 
    progress: 75,
    subCompetencies: 5,
    validator: 'AI Data Symphony'
  },
  { 
    name: 'Technological Literacy', 
    department: 'Operations', 
    level: 'mastery', 
    progress: 100,
    subCompetencies: 4,
    validator: 'Tech Stack Challenge'
  },
  { 
    name: 'Creative Thinking', 
    department: 'Marketing', 
    level: 'proficient', 
    progress: 80,
    subCompetencies: 5,
    validator: 'Innovation Sprint'
  },
  { 
    name: 'Networks & Cybersecurity', 
    department: 'IT/Security', 
    level: 'needs-work', 
    progress: 45,
    subCompetencies: 6,
    validator: 'Security Defense Sim'
  },
  { 
    name: 'Resilience & Adaptability', 
    department: 'All Departments', 
    level: 'proficient', 
    progress: 70,
    subCompetencies: 4,
    validator: 'Change Navigator'
  },
  { 
    name: 'Leadership & Social Influence', 
    department: 'Management', 
    level: 'mastery', 
    progress: 95,
    subCompetencies: 5,
    validator: 'Team Dynamics Challenge'
  },
  { 
    name: 'Service Orientation', 
    department: 'Customer Success', 
    level: 'proficient', 
    progress: 65,
    subCompetencies: 4,
    validator: 'Customer Impact Scenarios'
  },
];

const mockBadges = [
  { name: 'Excel Master', icon: '📊', date: '2025-03' },
  { name: 'Marketing Pro', icon: '📢', date: '2025-02' },
  { name: 'SQL Certified', icon: '🗄️', date: '2025-01' },
];

const getLevelColor = (level: string) => {
  switch (level) {
    case 'mastery':
      return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500' };
    case 'proficient':
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500' };
    default:
      return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500' };
  }
};

const getLevelLabel = (level: string) => {
  switch (level) {
    case 'mastery':
      return 'Mastery';
    case 'proficient':
      return 'Proficient';
    default:
      return 'Needs Work';
  }
};

const Profile = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(1);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [displayedXp, setDisplayedXp] = useState(0);
  const [displayedPlyo, setDisplayedPlyo] = useState(0);
  const [prevXp, setPrevXp] = useState(0);
  const [prevPlyo, setPrevPlyo] = useState(0);
  const xpPerLevel = 200;

  const evmAccount = useActiveAccount();
  const evmAddress = evmAccount?.address;
  const tonAddress = useTonAddress();
  const evmStatus = useActiveWalletConnectionStatus();

  const address = evmAddress || tonAddress;
  const connectionStatus = evmAddress ? evmStatus : (tonAddress ? 'connected' : 'disconnected');

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadGameResults(), loadProfileData()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const loadGameResults = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('loadGameResults: No user found');
        return;
      }
      const { data, error } = await supabase
        .from('game_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setGameResults(data || []);
    } catch (error) {
      console.error('Failed to load game results:', error);
    }
  };

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('loadProfileData: No user found');
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, location, bio, wallet_address, total_xp, total_plyo, created_at, updated_at')
        .eq('user_id', user.id)
        .single();
      if (error) {
        // Handle specific error for missing role column gracefully
        if (error.code === '42703' && error.message.includes('role')) {
          console.warn('Profile query attempted to access non-existent role column, retrying without it');
          // Retry without role
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('id, user_id, full_name, location, bio, wallet_address, total_xp, total_plyo, created_at, updated_at')
            .eq('user_id', user.id)
            .single();
          if (retryError) throw retryError;
          setProfile(retryData);
          return;
        }
        throw error;
      }
      setProfile(data);
      
      // Animate XP/PLYO if they increased (and we came from Play page)
      const newXp = data?.total_xp || 0;
      const newPlyo = data?.total_plyo || 0;
      
      // Check if we came from Play page (via sessionStorage)
      const shouldAnimate = sessionStorage.getItem('animateXp') === 'true';
      const savedPrevXp = sessionStorage.getItem('prevXp');
      const savedPrevPlyo = sessionStorage.getItem('prevPlyo');
      sessionStorage.removeItem('animateXp');
      
      // Get previous values from sessionStorage or use current if first load
      const previousXp = savedPrevXp ? parseInt(savedPrevXp, 10) : (prevXp || newXp);
      const previousPlyo = savedPrevPlyo ? parseInt(savedPrevPlyo, 10) : (prevPlyo || newPlyo);
      
      if (shouldAnimate && (newXp > previousXp || newPlyo > previousPlyo)) {
        animateValues(previousXp, newXp, previousPlyo, newPlyo);
      } else {
        setDisplayedXp(newXp);
        setDisplayedPlyo(newPlyo);
      }
      
      setPrevXp(newXp);
      setPrevPlyo(newPlyo);
      
      // Save current values for next visit
      sessionStorage.setItem('prevXp', newXp.toString());
      sessionStorage.setItem('prevPlyo', newPlyo.toString());
    } catch (error) {
      console.error('Failed to load profile data:', error);
      // Set empty profile to prevent UI crashes
      setProfile(null);
    }
  };

  const animateValues = (startXp: number, endXp: number, startPlyo: number, endPlyo: number) => {
    const duration = 7000; // 7 seconds
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      setDisplayedXp(Math.floor(startXp + (endXp - startXp) * easeOutCubic));
      setDisplayedPlyo(Math.floor(startPlyo + (endPlyo - startPlyo) * easeOutCubic));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayedXp(endXp);
        setDisplayedPlyo(endPlyo);
      }
    };
    
    requestAnimationFrame(animate);
  };

  const totalXp = displayedXp || profile?.total_xp || 0;
  const totalPlyo = displayedPlyo || profile?.total_plyo || 0;
  const level = Math.floor(totalXp / xpPerLevel);
  const currentLevelXp = totalXp % xpPerLevel;
  
  const masteryCount = gameResults.filter(r => (r.proficiency_level || '').toLowerCase() === 'mastery').length;
  const proficientCount = gameResults.filter(r => (r.proficiency_level || '').toLowerCase() === 'proficient').length;
  const badgesCount = masteryCount + proficientCount;

  const menuItems = [
    { icon: Home, label: 'Hub', path: '/lobby' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Hexagon, label: 'Inventory', path: '/inventory' },
    { icon: TrendingUp, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
  ];

  const handleNavigation = (path: string, index: number) => {
    setActiveIndex(index);
    navigate(path);
  };

  return (
    <div className="relative w-full min-h-screen bg-black pb-24">
      <PlayerHeader totalXp={totalXp} totalPlyo={totalPlyo} />

           <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Player Card */}
        <Card className="bg-black/50 border-2 p-6" style={{ borderColor: 'hsl(var(--neon-green))' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-black border-2 relative overflow-hidden group" style={{ borderColor: 'hsl(var(--neon-green))' }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-neon-green" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-glow-green mb-1" style={{ color: 'hsl(var(--neon-green))' }}>
                {profile?.full_name || 'Player'}
              </h2>
              <p className="text-sm font-mono" style={{ color: 'hsl(var(--neon-green) / 0.7)' }}>
                Level {level} • Total XP: {totalXp}
              </p>
                 <Progress value={(currentLevelXp / xpPerLevel) * 100} className="h-2 my-2" />
              <div className="text-right text-xs font-mono" style={{ color: 'hsl(var(--neon-green) / 0.7)' }}>
                {currentLevelXp} / {xpPerLevel} XP to next level
              </div>
              
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{masteryCount}</div>
              <div className="text-xs font-mono text-green-400/70">Mastery</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{proficientCount}</div>
              <div className="text-xs font-mono text-yellow-400/70">Proficient</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: 'hsl(var(--neon-green))' }}>{badgesCount}</div>
              <div className="text-xs font-mono" style={{ color: 'hsl(var(--neon-green) / 0.7)' }}>Badges</div>
            </div>
          </div>
        </Card>

        {/* Badges Section */}
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--neon-green))' }}>
            <Award className="w-6 h-6" style={{ color: 'hsl(var(--neon-green))' }} strokeWidth={2.5} />
            Latest Achievements
          </h3>
          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading achievements...</div>
          ) : gameResults.length === 0 ? (
            <Card className="bg-black/50 border-2 p-8 text-center" style={{ borderColor: 'hsl(var(--neon-green))' }}>
              <div className="text-4xl mb-4">🎮</div>
              <p className="text-gray-400 mb-4">No validators completed yet</p>
              <button 
                onClick={() => navigate('/lobby')}
                className="px-6 py-2 border-2 rounded-lg font-mono font-bold hover:bg-primary/20 transition-all"
                style={{ borderColor: 'hsl(var(--neon-green))', color: 'hsl(var(--neon-green))' }}
              >
                Start Playing
              </button>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gameResults.slice(0, 8).map((result, idx) => {
                const isMastery = result.proficiency_level === 'Mastery';
                const isProficient = result.proficiency_level === 'Proficient';
                const borderColor = isMastery ? 'hsl(var(--neon-green))' : 
                                   isProficient ? 'hsl(var(--neon-purple))' : 
                                   'hsl(var(--neon-magenta))';
                const glowClass = isMastery ? 'text-glow-green' : 
                                 isProficient ? 'text-glow-purple' : 
                                 'text-glow-magenta';
                const icon = isMastery ? '🏆' : isProficient ? '⭐' : '📊';
                
                return (
                  <Card 
                    key={result.id} 
                    className="bg-black/50 border-2 p-4 text-center hover:bg-black/70 transition-all cursor-pointer" 
                    style={{ borderColor }}
                  >
                    <div className="text-4xl mb-2">{icon}</div>
                    <div 
                      className={`font-bold text-sm mb-1 ${glowClass}`}
                      style={{ color: borderColor }}
                    >
                      {result.proficiency_level}
                    </div>
                    <div className="text-lg font-bold mb-1" style={{ color: borderColor }}>
                      {result.scoring_metrics?.final_score || 0}%
                    </div>
                    <div className="text-xs font-mono" style={{ color: 'hsl(var(--neon-green) / 0.5)' }}>
                      {new Date(result.created_at).toLocaleDateString()}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Game History */}
        {!loading && gameResults.length > 0 && (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--neon-green))' }}>
              <TrendingUp className="w-6 h-6" style={{ color: 'hsl(var(--neon-green))' }} strokeWidth={2.5} />
              Complete Play History ({gameResults.length} attempts)
            </h3>
            <div className="space-y-3">
              {gameResults.map((result, idx) => {
                const isMastery = result.proficiency_level === 'Mastery';
                const isProficient = result.proficiency_level === 'Proficient';
                const isPass = result.passed;
                const borderColor = isMastery ? 'hsl(var(--neon-green))' : 
                                   isProficient ? 'hsl(var(--neon-purple))' : 
                                   'hsl(var(--neon-magenta))';
                const date = new Date(result.created_at);
                const timeString = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                
                return (
                  <Card 
                    key={result.id} 
                    className="bg-black/50 border-2 p-4 hover:bg-black/70 transition-all" 
                    style={{ borderColor: 'hsl(var(--neon-green))' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl border-2"
                          style={{ 
                            borderColor: borderColor,
                            backgroundColor: `${borderColor}20`
                          }}
                        >
                          {isMastery ? '🏆' : isProficient ? '⭐' : '📊'}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-bold text-white">
                              Priority Trade-Off Navigator
                            </h4>
                            <Badge 
                              className="border-2 text-xs" 
                              style={{ 
                                borderColor: borderColor,
                                backgroundColor: `${borderColor}20`,
                                color: borderColor
                              }}
                            >
                              {result.proficiency_level}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs font-mono" style={{ color: 'hsl(var(--neon-green) / 0.6)' }}>
                            <span>{dateString} at {timeString}</span>
                            <span>•</span>
                            <span>Score: {result.scoring_metrics?.final_score || 0}%</span>
                            {result.scoring_metrics?.passes !== undefined && result.scoring_metrics?.totalSubs !== undefined && (
                              <>
                                <span>•</span>
                                <span>Passes: {result.scoring_metrics.passes}/{result.scoring_metrics.totalSubs}</span>
                              </>
                            )}
                          </div>
                          <details className="text-xs font-mono mt-2" style={{ color: 'hsl(var(--neon-green) / 0.6)' }}>
                            <summary className="cursor-pointer">Show Gameplay Data</summary>
                            <pre className="mt-2 p-2 bg-black/50 border border-neon-green/20 rounded-md text-xs overflow-auto">{JSON.stringify(result.gameplay_data, null, 2)}</pre>
                          </details>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div 
                          className="text-3xl font-bold"
                          style={{ color: borderColor }}
                        >
                          {result.scoring_metrics?.final_score || 0}%
                        </div>
                        <div className="text-xs font-mono" style={{ color: 'hsl(var(--neon-green) / 0.5)' }}>
                          {isPass ? '✓ PASS' : '✗ FAIL'}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Competencies Grid */}
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'hsl(var(--neon-green))' }}>
            <TrendingUp className="w-6 h-6" style={{ color: 'hsl(var(--neon-green))' }} strokeWidth={2.5} />
            Validated Competencies
          </h3>
          <div className="space-y-3">
            {mockCompetencies.map((competency, idx) => {
              const colors = getLevelColor(competency.level);
              return (
                <Card key={idx} className="bg-black/50 border-2 p-4" style={{ borderColor: 'hsl(var(--neon-green))' }}>
                  <div className="grid grid-cols-[7fr_3fr] items-center gap-x-4">
                    {/* Row 1 */}
                    <h4 className="font-bold text-sm col-span-2" style={{ color: 'hsl(var(--neon-green))' }}>
                        {competency.name}
                    </h4>

                    {/* Row 2 (previously Row 3) */}
                    <div className="flex items-center gap-4 text-xs font-mono flex-wrap" style={{ color: 'hsl(var(--neon-green) / 0.6)' }}>
                        <span>{competency.subCompetencies} Sub-Competencies</span>
                        <span>Assessment: {competency.validator} ...</span>
                    </div>
                    <div className="text-right">
                        <Badge variant="outline" className="text-xs whitespace-nowrap min-w-[120px] justify-center badge-symmetrical-chamfer" style={{ borderColor: 'hsl(var(--neon-green))', color: 'hsl(var(--neon-green))',borderRadius:'0.4rem' }}>
                            {competency.department}
                        </Badge>
                    </div>

                    {/* Row 3 (previously Row 2) */}
                    <Progress value={competency.progress} className="h-2 my-2" />
                    <div className="text-right">
                        <Badge style={{borderRadius:'0.4rem'}} className={`${colors.bg} ${colors.text} border-2 ${colors.border} min-w-[120px] justify-center badge-symmetrical-chamfer`}>
                            {getLevelLabel(competency.level)}
                        </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Portable Resume CTA */}
        <Card className="bg-black/50 border-2 p-6 text-center relative overflow-hidden group" style={{ borderColor: 'hsl(var(--neon-green))' }}>
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
            style={{ 
              background: 'radial-gradient(circle at center, hsl(var(--neon-green)), transparent 70%)'
            }}
          />
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-black border-2 flex items-center justify-center" style={{ borderColor: 'hsl(var(--neon-green))' }}>
              <Shield className="w-8 h-8" style={{ color: 'hsl(var(--neon-green))' }} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-bold mb-2 tracking-wide" style={{ color: 'hsl(var(--neon-green))' }}>
              Export Your Validated Competencies
            </h3>
            <p className="text-sm font-mono mb-4" style={{ color: 'hsl(var(--neon-green) / 0.7)' }}>
              Download immutable receipts & portable CBE resume
            </p>
            <button 
              className="px-6 py-2 border-2 rounded-lg font-mono font-bold hover:bg-primary/20 transition-all hover:scale-105"
              style={{ borderColor: 'hsl(var(--neon-green))', color: 'hsl(var(--neon-green))' }}
            >
              EXPORT RESUME
            </button>
          </div>
        </Card>
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

export default Profile;
