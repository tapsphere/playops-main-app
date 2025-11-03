import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { BrandCustomizationDialog } from '@/components/platform/BrandCustomizationDialog';

interface Template {
  id: string;
  name: string;
  description: string | null;
  preview_image: string | null;
  base_prompt: string | null;
  creator_id: string;
  competency_id: string | null;
  is_published: boolean;
  profiles?: {
    full_name: string | null;
  } | null;
  master_competencies?: {
    name: string;
    cbe_category: string;
    departments: string[];
  } | null;
}

export const TemplateDetail = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [customizeDialogOpen, setCustomizeDialogOpen] = useState(false);
  const [isBrand, setIsBrand] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAndLoad = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      let isUserBrand = false;
      if (user) {
        setIsLoggedIn(true);
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'brand')
          .maybeSingle();
        
        if (roles) {
          isUserBrand = true;
          setIsBrand(true);
        }
      }

      if (!templateId) {
        setLoading(false);
        return;
      }

      // If the user is a brand, check for existing customization first
      if (isUserBrand && user) {
        const { data: customization, error: custError } = await supabase
          .from('brand_customizations')
          .select('id, generated_game_html')
          .eq('brand_id', user.id)
          .eq('template_id', templateId)
          .not('generated_game_html', 'is', null)
          .maybeSingle();

        if (custError) {
          console.error("Error checking for customization:", custError);
        }

        if (customization) {
          toast.info('You have already customized this template.', {
            description: 'Redirecting you to your brand dashboard.',
          });
          navigate('/platform/brand');
          return; // Stop execution to prevent loading the page
        }
      }

      try {
        const { data, error } = await supabase
          .from('game_templates')
          .select('*')
          .eq('id', templateId)
          .eq('is_published', true)
          .single();

        if (error) throw error;

        const [profileData, competencyData] = await Promise.all([
          supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', data.creator_id)
            .single(),
          data.competency_id
            ? supabase
                .from('master_competencies')
                .select('name, cbe_category, departments')
                .eq('id', data.competency_id)
                .single()
            : null,
        ]);

        setTemplate({
          ...data,
          profiles: profileData.data || null,
          master_competencies: competencyData?.data || null,
        });
      } catch (error: any) {
        toast.error('Failed to load template details');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    checkAndLoad();
  }, [templateId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="p-8 bg-gray-900 border-gray-800 text-center">
          <p className="text-gray-400 mb-4">Template not found</p>
          <Button onClick={() => navigate('/platform/marketplace')}>
            Back to Marketplace
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto">
      {/* Mobile-First Header */}
      <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Navigate back to creator portfolio if we came from there
              const creatorId = template.creator_id;
              navigate(`/platform/creator/${creatorId}`);
            }}
            className="gap-1 text-gray-400 hover:text-white -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      {/* Main Content - Mobile First */}
      <div className="relative">
        {/* Preview - Full Width on Mobile */}
        <div className="aspect-video bg-gradient-to-br from-gray-800 via-gray-900 to-black relative">
          {template.preview_image ? (
            <img
              src={template.preview_image}
              alt={template.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="text-6xl md:text-8xl">🎮</div>
              <div className="text-xs text-gray-500 font-mono">VALIDATOR</div>
            </div>
          )}
        </div>

        {/* Content Below Preview - Add bottom padding for fixed prompt panel */}
        <div className="px-4 py-4 space-y-4 pb-[45vh]">
          {/* Title & Creator */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{template.name}</h1>
            <p className="text-gray-400 text-sm">
              By {template.profiles?.full_name || 'Unknown Creator'}
            </p>
          </div>

          {/* Description */}
          {template.description && (
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              {template.description}
            </p>
          )}

          {/* Competencies */}
          {template.master_competencies && (
            <div className="flex flex-wrap gap-2">
              <span className="bg-neon-purple/20 text-neon-purple px-3 py-1.5 rounded-full text-xs border border-neon-purple/30">
                {template.master_competencies.cbe_category}
              </span>
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-full text-xs border border-blue-500/30">
                {template.master_competencies.name}
              </span>
            </div>
          )}

          {/* CTA Button */}
          {!isLoggedIn ? (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-300 text-sm mb-3 text-center">
                Sign in as a Brand to customize
              </p>
              <Button
                onClick={() => navigate('/auth')}
                className="w-full bg-neon-green text-black hover:bg-neon-green/90 font-semibold"
              >
                Sign In
              </Button>
            </div>
          ) : !isBrand ? (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-300 text-sm text-center">
                Only Brand accounts can customize templates
              </p>
            </div>
          ) : (
            <Button
              onClick={() => setCustomizeDialogOpen(true)}
              className="w-full gap-2 text-base md:text-lg py-6 font-bold shadow-lg shadow-neon-green/50"
              style={{
                backgroundColor: 'hsl(var(--neon-green))',
                color: 'black',
              }}
            >
              <Palette className="h-5 w-5" />
              Customize with Your Brand
            </Button>
          )}
        </div>

        {/* Fixed Bottom Prompt Panel - Flow TV Style */}
        {template.base_prompt && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900/98 backdrop-blur-lg border-t border-gray-800 z-20 max-h-[40vh] overflow-hidden">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm md:text-base font-semibold text-neon-green flex items-center gap-2">
                  📝 Template Prompt
                </h3>
              </div>
              <div className="bg-black/50 border border-gray-800 rounded-lg p-3 max-h-[30vh] overflow-y-auto">
                <pre className="text-gray-300 whitespace-pre-wrap font-mono text-xs md:text-sm leading-relaxed">
                  {template.base_prompt}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customization Dialog */}
      {template && (
        <BrandCustomizationDialog
          open={customizeDialogOpen}
          onOpenChange={setCustomizeDialogOpen}
          template={template}
          onSuccess={() => {
            navigate('/platform/brand');
          }}
        />
      )}
    </div>
  );
}
