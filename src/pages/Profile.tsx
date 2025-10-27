import { useActiveAccount, useActiveWalletConnectionStatus } from 'thirdweb/react';
import { useTonAddress } from '@tonconnect/ui-react';
import { User, Award, TrendingUp, Shield, Home, Hexagon, Wallet, Zap, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AriaButton } from '@/components/AriaButton';
import { supabase } from '@/integrations/supabase/client';


type GameResult = {
  id: string;
  proficiency_level: string;
  scoring_metrics: any;
  created_at: string;
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
  const [totalXp, setTotalXp] = useState(0);
  const [level, setLevel] = useState(0);
  const [currentLevelXp, setCurrentLevelXp] = useState(0);
  const xpPerLevel = 200;
  const [loading, setLoading] = useState(true);
  
  const evmAccount = useActiveAccount();
  const evmAddress = evmAccount?.address;
  const tonAddress = useTonAddress();
  const evmStatus = useActiveWalletConnectionStatus();

  const address = evmAddress || tonAddress;
  const connectionStatus = evmAddress ? evmStatus : (tonAddress ? 'connected' : 'disconnected');

  const truncatedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected';

  useEffect(() => {
    loadGameResults();
    loadProfileData();
    loadExperienceData();
  }, []);
  
  const loadGameResults = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('game_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setGameResults(data || []);
    } catch (error) {
      console.error('Failed to load game results:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    }
  };

  const loadExperienceData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_skills')
        .select('xp_earned')
        .eq('user_id', user.id);

      if (error) throw error;

      const total = data.reduce((acc, skill) => acc + skill.xp_earned, 0);
      setTotalXp(total);
      setLevel(Math.floor(total / xpPerLevel));
      setCurrentLevelXp(total % xpPerLevel);
    } catch (error) {
      console.error('Failed to load experience data:', error);
    }
  };
  
  const masteryCount = gameResults.filter(r => r.proficiency_level === 'Mastery').length;
  const proficientCount = gameResults.filter(r => r.proficiency_level === 'Proficient').length;
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
      {/* ARIA Access Button */}
      <AriaButton />
      
      {/* Header */}
      <div
        className="border-b-2 p-4"
        style={{ borderColor: 'hsl(var(--neon-green))' }}
      >
        <div className="max-w-7xl mx-auto">
          {/* XP Display */}
          <div className="flex justify-end gap-2">
            <div className="bg-black/50 border-2 rounded-lg px-3 py-1.5 flex items-center gap-2" style={{ borderColor: 'hsl(var(--neon-green))' }}>
              <Zap className="w-4 h-4" style={{ color: 'hsl(var(--neon-green))' }} fill="hsl(var(--neon-green))" />
              <div className="text-right">
                <div className="text-xs font-mono" style={{ color: 'hsl(var(--neon-green) / 0.7)' }}>XP</div>
                <div className="text-sm font-bold" style={{ color: 'hsl(var(--neon-green))' }}>{totalXp}</div>
              </div>
            </div>
            <div className="bg-black/50 border-2 rounded-lg px-3 py-1.5 flex items-center gap-2" style={{ borderColor: 'hsl(var(--neon-magenta))' }}>
              <Coins className="w-4 h-4" style={{ color: 'hsl(var(--neon-magenta))' }} />
              <div className="text-right">
                <div className="text-xs font-mono" style={{ color: 'hsl(var(--neon-magenta) / 0.7)' }}>PLYO</div>
                <div className="text-sm font-bold" style={{ color: 'hsl(var(--neon-magenta))' }}>1,250</div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                Level {level} • XP: {totalXp}
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
                      {result.scoring_metrics?.score || 0}%
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
                const isPass = result.scoring_metrics?.score >= 80;
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
                            <span>Score: {result.scoring_metrics?.score || 0}%</span>
                            <span>•</span>
                            <span>Passes: {result.scoring_metrics?.passes || 0}/{result.scoring_metrics?.totalSubs || 5}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div 
                          className="text-3xl font-bold"
                          style={{ color: borderColor }}
                        >
                          {result.scoring_metrics?.score || 0}%
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
