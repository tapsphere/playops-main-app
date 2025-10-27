import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Play, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type BrandProfile = {
  company_name: string | null;
  company_description: string | null;
  company_logo_url: string | null;
};

type PublishedGame = {
  id: string;
  unique_code: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  game_templates: {
    name: string;
    preview_image: string | null;
  };
};

export default function BrandProfile() {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [games, setGames] = useState<PublishedGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (brandId) {
      loadBrandData();
    }
  }, [brandId]);

  const loadBrandData = async () => {
    try {
      // Load brand profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_name, company_description, company_logo_url')
        .eq('user_id', brandId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load published games
      const { data: gamesData, error: gamesError } = await supabase
        .from('brand_customizations')
        .select(`
          id,
          unique_code,
          logo_url,
          primary_color,
          secondary_color,
          game_templates (
            name,
            preview_image
          )
        `)
        .eq('brand_id', brandId)
        .not('published_at', 'is', null)
        .not('unique_code', 'is', null)
        .order('published_at', { ascending: false });

      if (gamesError) throw gamesError;
      setGames(gamesData || []);
    } catch (error) {
      console.error('Failed to load brand data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-mono" style={{ color: 'hsl(var(--neon-green))' }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--neon-green))' }}>
            Brand Not Found
          </h1>
          <Button onClick={() => navigate('/lobby')}>
            Back to Hub
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b-2 p-4" style={{ borderColor: 'hsl(var(--neon-green))' }}>
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/lobby')}
            className="mb-4"
            style={{ color: 'hsl(var(--neon-green))' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hub
          </Button>

          <div className="flex items-start gap-6">
            {/* Brand Logo */}
            <div
              className="w-32 h-32 rounded-lg border-2 flex items-center justify-center bg-black/50"
              style={{ borderColor: 'hsl(var(--neon-green))' }}
            >
              {profile.company_logo_url ? (
                <img
                  src={profile.company_logo_url}
                  alt={profile.company_name || 'Brand'}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <Building2 className="w-16 h-16" style={{ color: 'hsl(var(--neon-green))' }} />
              )}
            </div>

            {/* Brand Info */}
            <div className="flex-1">
              <h1
                className="text-4xl font-bold mb-2 text-glow-green"
                style={{ color: 'hsl(var(--neon-green))' }}
              >
                {profile.company_name || 'Brand Company'}
              </h1>
              <p className="text-gray-400 text-lg">
                {profile.company_description || 'No description available'}
              </p>
              <div className="mt-4">
                <Badge
                  className="border-2 font-mono"
                  style={{
                    borderColor: 'hsl(var(--neon-purple))',
                    color: 'hsl(var(--neon-purple))',
                  }}
                >
                  {games.length} Published Games
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="max-w-7xl mx-auto p-8">
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'hsl(var(--neon-green))' }}>
          Published Games
        </h2>

        {games.length === 0 ? (
          <Card className="bg-black/50 border-2 p-12 text-center" style={{ borderColor: 'hsl(var(--neon-green))' }}>
            <p className="text-gray-400">No published games yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game, idx) => {
              const useMagenta = idx % 3 === 1;
              const usePurple = idx % 3 === 2;
              const borderColor = useMagenta
                ? 'hsl(var(--neon-magenta))'
                : usePurple
                ? 'hsl(var(--neon-purple))'
                : 'hsl(var(--neon-green))';
              const glowClass = useMagenta
                ? 'text-glow-magenta'
                : usePurple
                ? 'text-glow-purple'
                : 'text-glow-green';

              return (
                <Card
                  key={game.id}
                  className="bg-black/50 border-2 overflow-hidden hover:bg-black/70 transition-all cursor-pointer group"
                  style={{ borderColor }}
                  onClick={() => navigate(`/play/${game.unique_code}`)}
                >
                  {/* Preview Image */}
                  <div className="aspect-video bg-gray-900 flex items-center justify-center overflow-hidden">
                    {game.game_templates?.preview_image ? (
                      <img
                        src={game.game_templates.preview_image}
                        alt={game.game_templates.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Play className="w-16 h-16 text-gray-600" />
                    )}
                  </div>

                  {/* Game Info */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-lg bg-white/5 border-2 p-2 flex items-center justify-center"
                        style={{ borderColor: `${borderColor}33` }}
                      >
                        {game.logo_url ? (
                          <img src={game.logo_url} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Building2 className="w-6 h-6" style={{ color: borderColor }} />
                        )}
                      </div>
                      <Badge
                        className="border-2 font-mono text-[9px] bg-black/50"
                        style={{ borderColor: 'hsl(var(--neon-purple))', color: 'hsl(var(--neon-purple))' }}
                      >
                        LIVE
                      </Badge>
                    </div>

                    <h3 className={`text-xl font-bold mb-2 ${glowClass}`} style={{ color: borderColor }}>
                      {game.game_templates?.name || 'Validator'}
                    </h3>

                    <Button
                      className="w-full mt-4 gap-2"
                      style={{ backgroundColor: borderColor, color: 'white' }}
                    >
                      <Play className="w-4 h-4" />
                      Play Now
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
