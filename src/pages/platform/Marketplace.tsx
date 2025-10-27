import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

interface CreatorChannel {
  creator_id: string;
  creator_name: string | null;
  creator_bio: string | null;
  featured_game_image: string | null;
  featured_game_name: string | null;
  featured_game_id: string | null;
  total_games: number;
}

export default function Marketplace() {
  const navigate = useNavigate();
  const [creators, setCreators] = useState<CreatorChannel[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<CreatorChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCreators();
  }, []);

  useEffect(() => {
    applySearch();
  }, [creators, searchQuery]);

  const fetchCreators = async () => {
    try {
      // Fetch all published templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('game_templates')
        .select('id, creator_id, name, preview_image')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      // Group by creator and get unique creators
      const creatorMap = new Map<string, { games: any[], creator_id: string }>();
      
      templatesData?.forEach(template => {
        if (!creatorMap.has(template.creator_id)) {
          creatorMap.set(template.creator_id, {
            creator_id: template.creator_id,
            games: []
          });
        }
        creatorMap.get(template.creator_id)?.games.push({
          id: template.id,
          name: template.name,
          preview_image: template.preview_image
        });
      });

      // Fetch creator profiles
      const creatorsWithProfiles = await Promise.all(
        Array.from(creatorMap.values()).map(async ({ creator_id, games }) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, bio')
            .eq('user_id', creator_id)
            .single();

          // Use first game's image as featured
          const featuredGame = games[0];

          return {
            creator_id,
            creator_name: profile?.full_name || 'Unknown Creator',
            creator_bio: profile?.bio || null,
            featured_game_image: featuredGame?.preview_image || null,
            featured_game_name: featuredGame?.name || null,
            featured_game_id: featuredGame?.id || null,
            total_games: games.length
          };
        })
      );
      
      setCreators(creatorsWithProfiles);
      setFilteredCreators(creatorsWithProfiles);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const applySearch = () => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = creators.filter(
        creator => 
          creator.creator_name?.toLowerCase().includes(query) ||
          creator.creator_bio?.toLowerCase().includes(query)
      );
      setFilteredCreators(filtered);
    } else {
      setFilteredCreators(creators);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading creator channels...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-safe">
      {/* Mobile-First Header */}
      <div className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <h1 className="text-xl md:text-2xl font-bold text-neon-green text-glow-green mb-3">
            Creator Channels
          </h1>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-gray-800 border-gray-700"
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <p className="text-xs md:text-sm text-gray-400 mb-4">
          {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''}
        </p>

        {/* Mobile-Optimized Creator Channels Grid */}
        {filteredCreators.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No creators found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filteredCreators.map((creator) => {
              // If creator has only one game, go directly to template detail
              // Otherwise, go to their portfolio
              const handleClick = () => {
                if (creator.total_games === 1 && creator.featured_game_id) {
                  navigate(`/platform/template/${creator.featured_game_id}`);
                } else {
                  navigate(`/platform/creator/${creator.creator_id}`);
                }
              };

              return (
              <div
                key={creator.creator_id}
                onClick={handleClick}
                className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden active:bg-gray-800 transition-all cursor-pointer"
              >
                {/* Featured Game Cover Image */}
                <div className="relative aspect-video bg-gray-800">
                  {creator.featured_game_image ? (
                    <img 
                      src={creator.featured_game_image.startsWith('/') ? creator.featured_game_image.slice(1) : creator.featured_game_image}
                      alt={creator.creator_name || 'Creator'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <span className="text-4xl">{creator.creator_name?.charAt(0) || '?'}</span>
                    </div>
                  )}
                </div>

                {/* Creator Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-base md:text-lg text-white mb-1 truncate">
                    {creator.creator_name}
                  </h3>
                  
                  {creator.creator_bio && (
                    <p className="text-xs md:text-sm text-gray-300 line-clamp-2 mb-2">
                      {creator.creator_bio}
                    </p>
                  )}

                  {/* Game Count */}
                  <p className="text-xs text-gray-400 mb-2">
                    {creator.total_games} game{creator.total_games !== 1 ? 's' : ''}
                  </p>

                  {/* View Channel Button */}
                  <div className="pt-2 border-t border-gray-800">
                    <span className="text-xs md:text-sm text-neon-green">
                      View Channel →
                    </span>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}