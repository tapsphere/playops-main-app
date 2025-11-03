import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Trophy, User, Award, TrendingUp } from 'lucide-react';

type GameResult = {
  id: string;
  created_at: string;
  scoring_metrics: any;
  passed: boolean;
  proficiency_level: string;
  profile?: {
    full_name: string;
    total_xp: number;
    total_plyo: number;
  };
  rank?: number;
};

type ProfileModalData = {
  userId: string;
  fullName: string;
  totalXp: number;
  totalPlyo: number;
  rank: number;
  gameResults: Array<{
    gameName: string;
    score: number;
    passed: boolean;
    date: string;
  }>;
};

export default function GameResults() {
  const { customizationId } = useParams();
  const [results, setResults] = useState<GameResult[]>([]);
  const [gameName, setGameName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileModalData, setProfileModalData] = useState<ProfileModalData | null>(null);

  useEffect(() => {
    if (!customizationId) return;

    const fetchResults = async () => {
      try {
        setLoading(true);

        const { data: gameData, error: gameError } = await supabase
          .from('brand_customizations')
          .select('game_templates(name)')
          .eq('id', customizationId)
          .single();

        if (gameError) throw gameError;
        if (gameData) {
          setGameName((gameData.game_templates as any)?.name || 'Game');
        }

        // Fetch game results
        const { data: resultsData, error: resultsError } = await supabase
          .from('game_results')
          .select('id, user_id, created_at, scoring_metrics, passed, proficiency_level')
          .eq('customization_id', customizationId)
          .order('created_at', { ascending: false });

        if (resultsError) throw resultsError;

        // Fetch all unique user IDs
        const userIds = [...new Set((resultsData || []).map(r => r.user_id))];
        
        // Fetch profiles for all users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, total_xp, total_plyo')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Create a map of user_id to profile
        const profileMap = new Map((profilesData || []).map(p => [p.user_id, p]));

        // Fetch all XP totals to calculate ranks
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('user_id, total_xp')
          .order('total_xp', { ascending: false });

        if (allProfilesError) throw allProfilesError;
        const rankMap = new Map();
        (allProfiles || []).forEach((p, index) => {
          rankMap.set(p.user_id, index + 1);
        });

        // Combine results with profiles and ranks
        const combinedResults: GameResult[] = (resultsData || []).map(result => ({
          ...result,
          profile: profileMap.get(result.user_id),
          rank: rankMap.get(result.user_id) || 999
        }));

        setResults(combinedResults);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [customizationId]);

  const handleViewProfile = async (userId: string, profileName: string) => {
    try {
      // Fetch user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name, total_xp, total_plyo')
        .eq('user_id', userId)
        .single();

      // Fetch user's game results
      const { data: userResults } = await supabase
        .from('game_results')
        .select(`
          created_at,
          scoring_metrics,
          passed,
          game_templates(name),
          brand_customizations(game_templates(name))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate rank
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('user_id, total_xp')
        .order('total_xp', { ascending: false });

      const rank = (allProfiles || []).findIndex(p => p.user_id === userId) + 1;

      const gameResults = (userResults || []).map(r => ({
        gameName: (r.game_templates as any)?.name || (r.brand_customizations as any)?.game_templates?.name || 'Unknown',
        score: r.scoring_metrics?.accuracy || r.scoring_metrics?.final_score || 0,
        passed: r.passed,
        date: r.created_at
      }));

      setProfileModalData({
        userId,
        fullName: profile?.full_name || profileName,
        totalXp: profile?.total_xp || 0,
        totalPlyo: profile?.total_plyo || 0,
        rank,
        gameResults
      });
      setProfileModalOpen(true);
    } catch (err) {
      console.error('Error fetching profile data:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading results...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-2 text-white">{gameName} Results</h2>
      <p className="text-gray-400 mb-8">Player attempts and scores for this game.</p>

      <div className="space-y-4">
        {results.length > 0 ? (
          results.map((result, index) => (
            <Card 
              key={result.id} 
              className="bg-gray-900 border-gray-800 hover:bg-gray-850 transition-all cursor-pointer"
              onClick={() => handleViewProfile(result.user_id, result.profile?.full_name || 'Anonymous')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-black border-2 flex items-center justify-center shrink-0" 
                      style={{ borderColor: index % 3 === 0 ? 'hsl(var(--neon-green))' : index % 3 === 1 ? 'hsl(var(--neon-magenta))' : 'hsl(var(--neon-purple))' }}>
                      <span className="text-lg font-bold" style={{ color: index % 3 === 0 ? 'hsl(var(--neon-green))' : index % 3 === 1 ? 'hsl(var(--neon-magenta))' : 'hsl(var(--neon-purple))' }}>
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-1 text-white truncate">
                        {result.profile?.full_name || 'Anonymous Player'}
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          <Trophy className="w-3 h-3 mr-1" />
                          Rank #{result.rank}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          {result.profile?.total_xp || 0} XP
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold mb-1" style={{ color: result.passed ? 'hsl(var(--neon-green))' : 'hsl(var(--neon-red))' }}>
                      {result.scoring_metrics?.accuracy || result.scoring_metrics?.final_score || 0}
                      {result.scoring_metrics?.accuracy ? '%' : ''}
                    </p>
                    <Badge variant={result.passed ? 'default' : 'destructive'} className="mb-2">
                      {result.passed ? 'Passed' : 'Failed'}
                    </Badge>
                    <p className="text-xs text-gray-400">
                      {format(new Date(result.created_at), 'PPp')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No results found for this game yet.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Profile Modal */}
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <User className="w-6 h-6" style={{ color: 'hsl(var(--neon-green))' }} />
              {profileModalData?.fullName}'s Profile
            </DialogTitle>
          </DialogHeader>
          
          {profileModalData && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-black/50 border-2 p-4 text-center" style={{ borderColor: 'hsl(var(--neon-green))' }}>
                  <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(var(--neon-green))' }} />
                  <p className="text-2xl font-bold" style={{ color: 'hsl(var(--neon-green))' }}>
                    #{profileModalData.rank}
                  </p>
                  <p className="text-xs text-gray-400">Global Rank</p>
                </Card>
                <Card className="bg-black/50 border-2 p-4 text-center" style={{ borderColor: 'hsl(var(--neon-green))' }}>
                  <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(var(--neon-green))' }} />
                  <p className="text-2xl font-bold" style={{ color: 'hsl(var(--neon-green))' }}>
                    {profileModalData.totalXp.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">Total XP</p>
                </Card>
                <Card className="bg-black/50 border-2 p-4 text-center" style={{ borderColor: 'hsl(var(--neon-magenta))' }}>
                  <Award className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(var(--neon-magenta))' }} />
                  <p className="text-2xl font-bold" style={{ color: 'hsl(var(--neon-magenta))' }}>
                    {profileModalData.totalPlyo.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">Total PLYO</p>
                </Card>
              </div>

              {/* Recent Game Results */}
              <div>
                <h3 className="text-xl font-bold mb-4">Recent Game Performance</h3>
                <div className="space-y-2">
                  {profileModalData.gameResults.map((game, idx) => (
                    <Card key={idx} className="bg-black/50 border border-gray-700 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{game.gameName}</p>
                          <p className="text-xs text-gray-400">{format(new Date(game.date), 'PPp')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold" style={{ color: game.passed ? 'hsl(var(--neon-green))' : 'hsl(var(--neon-red))' }}>
                            {game.score}
                            {typeof game.score === 'number' && game.score <= 100 ? '%' : ''}
                          </p>
                          <Badge variant={game.passed ? 'default' : 'destructive'} className="text-xs">
                            {game.passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
