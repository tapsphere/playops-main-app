import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ArrowLeft, Edit, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

const triggerConfetti = () => {
  const colors = ['#00ff00', '#ff00ff', '#9945ff', '#ffd700'];
  const confettiCount = 200;
  
  for (let i = 0; i < confettiCount; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.width = `${Math.random() * 10 + 5}px`;
      confetti.style.height = `${Math.random() * 10 + 5}px`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.top = '-10px';
      confetti.style.opacity = '1';
      confetti.style.pointerEvents = 'none';
      confetti.style.zIndex = '9999';
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      
      document.body.appendChild(confetti);
      
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 10 + 5;
      const xVelocity = Math.cos(angle) * velocity;
      const yVelocity = Math.sin(angle) * velocity + 5;
      
      let x = parseFloat(confetti.style.left) / 100 * window.innerWidth;
      let y = -10;
      
      const animate = () => {
        y += yVelocity;
        x += xVelocity + (Math.random() - 0.5) * 2;
        
        confetti.style.left = `${(x / window.innerWidth) * 100}%`;
        confetti.style.top = `${y}px`;
        confetti.style.opacity = `${Math.max(0, 1 - (y / window.innerHeight))}`;
        
        if (y < window.innerHeight && confetti.style.opacity !== '0') {
          requestAnimationFrame(animate);
        } else {
          confetti.remove();
        }
      };
      
      requestAnimationFrame(animate);
    }, i * 10);
  }
};

type ValidatorData = {
  id: string;
  customization_prompt: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  generated_game_html: string | null;
  brand_id: string;
  unique_code: string | null;
  template_id: string;
  game_templates: {
    name: string;
    description: string | null;
    preview_image: string | null;
    competency_id: string;
    selected_sub_competencies: string[];
  } | null;
};

import { supabase } from '@/integrations/supabase/client';

export default function Play() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [validator, setValidator] = useState<ValidatorData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const handleScoreSubmission = async (scoringMetrics: any, gameplayData: any) => {
    console.log("handleScoreSubmission called.");

    if (!validator) {
      console.error("handleScoreSubmission: validator is null.");
      return;
    }
    if (!validator.game_templates) {
      console.error("handleScoreSubmission: validator.game_templates is null or undefined.", { validator });
      return;
    }
    console.log("Validator and game templates found.", { validator });

    toast.info('Submitting your score...');

    try {
      console.log("Checking Supabase session...");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("No active session found.");
        throw new Error("You must be logged in to submit a score.");
      }
      console.log("Supabase session found.", { session });

      // Get current XP/PLYO BEFORE submission to use as animation start
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('total_xp, total_plyo')
          .eq('user_id', currentUser.id)
          .single();
        
        if (currentProfile) {
          sessionStorage.setItem('prevXp', (currentProfile.total_xp || 0).toString());
          sessionStorage.setItem('prevPlyo', (currentProfile.total_plyo || 0).toString());
        }
      }

      const functionArgs = {
        templateId: validator.template_id,
        customizationId: validator.id,
        competencyId: validator.game_templates.competency_id,
        subCompetencyId: validator.game_templates.selected_sub_competencies[0], // Assuming the first sub competency
        scoringMetrics,
        gameplayData,
      };

      console.log("Invoking 'submit-score' function with args:", functionArgs);
      const { error: functionError } = await supabase.functions.invoke('submit-score', {
        body: functionArgs,
      });

      if (functionError) {
        console.error("Supabase function invocation error:", functionError);
        throw functionError;
      }
      
      console.log("'submit-score' function invoked successfully.");
      toast.success('Score submitted successfully! Redirecting to profile...');
      
      // Confetti animation
      triggerConfetti();
      
      // Set flag to animate XP/PLYO on profile page
      sessionStorage.setItem('animateXp', 'true');
      
      setTimeout(() => navigate('/profile'), 3000);

    } catch (error: any) {
      console.error("Failed to submit score:", error);
      toast.error(error.message || "An error occurred while submitting your score.");
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'gameSubmit') {
        console.log('Received game submission from iframe:', event.data);
        const { scoringMetrics, gameplayData: rawGameplayData } = event.data.payload;
        const gameplayData = rawGameplayData || event.data.payload;
        handleScoreSubmission(scoringMetrics, gameplayData);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [validator]);

  useEffect(() => {
    if (code) {
      console.log("useEffect: code changed, calling loadValidator.", { code });
      loadValidator();
    }
  }, [code]);

  const loadValidator = async () => {
    console.log("loadValidator called.");
    try {
      if (!code) {
        console.warn("loadValidator: No code parameter available.");
        return;
      }
      console.log("loadValidator: Fetching validator for code:", code);

      const { data, error } = await supabase
        .from('brand_customizations')
        .select(`
          id,
          customization_prompt,
          primary_color,
          secondary_color,
          logo_url,
          generated_game_html,
          brand_id,
          unique_code,
          template_id,
          game_templates (
            name,
            description,
            preview_image,
            competency_id,
            selected_sub_competencies
          )
        `)
        .eq('unique_code', code)
        .single();

      if (error) {
        console.error('loadValidator: Error fetching validator:', error);
        throw error;
      }

      if (data) {
        console.log("loadValidator: Validator data fetched successfully.", data);
        console.log("loadValidator: game_templates from data:", data.game_templates);
        setValidator(data as ValidatorData);
      } else {
        console.warn("loadValidator: No validator data returned for code:", code);
        setError('Validator not found');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user && data && data.brand_id === user.id) {
        setIsOwner(true);
      }
    } catch (error: any) {
      console.error('loadValidator: Failed to load validator:', error);
      setError('Failed to load validator');
      toast.error(error.message);
    } finally {
      setLoading(false);
      console.log("loadValidator: Finished loading.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-neon-green mx-auto mb-4" />
          <p className="text-white">Loading validator...</p>
        </div>
      </div>
    );
  }

  if (error || !validator) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gray-900 border-red-500 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Validator Not Found</h2>
          <p className="text-gray-400 mb-6">
            {error || 'This validator link may be invalid or has been unpublished.'}
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  const handleCopyLink = () => {
    if (!validator?.unique_code) return;
    const link = `${window.location.origin}/play/${validator.unique_code}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  return (
    <ScrollArea className="h-screen">
      <div className="min-h-screen bg-black text-white">
        {/* Return Button Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b-2" style={{ borderColor: 'hsl(var(--neon-green))' }}>
          <div className="max-w-7xl mx-auto p-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/lobby')}
              style={{ color: 'hsl(var(--neon-green))' }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Hub
            </Button>
          </div>
        </div>

        {validator.generated_game_html ? (
          /* Render the generated game */
          <div className="pt-16">
            <div className="w-full" style={{ height: 'calc(100vh - 4rem)' }}>
              <iframe
                srcDoc={validator.generated_game_html}
                className="w-full h-full border-0"
                title="Game Validator"
                sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation"
              />
            </div>

{/* Owner Controls Section Removed */}
          </div>
        ) : (
        /* Show preview if game hasn't been generated yet */
        <div className="pt-16">
          {/* Hero Section */}
          <div 
            className="relative py-20 px-4"
            style={{
              background: `linear-gradient(135deg, ${validator.primary_color}22, ${validator.secondary_color}22)`
            }}
          >
            <div className="max-w-4xl mx-auto text-center">
              {validator.logo_url && (
                <img
                  src={validator.logo_url}
                  alt="Brand Logo"
                  className="h-16 mx-auto mb-6 object-contain"
                />
              )}
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {validator.game_templates.name}
              </h1>
              {validator.game_templates.description && (
                <p className="text-xl text-gray-300 mb-8">
                  {validator.game_templates.description}
                </p>
              )}
              <Card className="max-w-md mx-auto bg-yellow-900/20 border-yellow-500 p-6 mt-8">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
                <p className="text-yellow-300 text-sm">
                  This validator is being generated. Please check back soon!
                </p>
              </Card>
            </div>
          </div>

          {/* Preview Section */}
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4" style={{ color: validator.primary_color }}>
                  About This Validator
                </h2>
                <div className="space-y-4 text-gray-300">
                  <p>
                    This is a branded competency validator designed to assess your skills
                    through interactive gameplay scenarios.
                  </p>
                  <div className="flex gap-4 pt-4">
                    <div 
                      className="w-16 h-16 rounded-lg"
                      style={{ backgroundColor: validator.primary_color }}
                    />
                    <div 
                      className="w-16 h-16 rounded-lg"
                      style={{ backgroundColor: validator.secondary_color }}
                    />
                  </div>
                </div>
              </div>

              {validator.game_templates.preview_image && (
                <div className="rounded-lg overflow-hidden border-2" style={{ borderColor: validator.primary_color }}>
                  <img
                    src={validator.game_templates.preview_image}
                    alt="Validator Preview"
                    className="w-full h-auto"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-800 py-8 text-center text-gray-500">
            <p className="text-sm">Powered by TON Validator Platform</p>
          </div>
        </div>
        )}
      </div>
    </ScrollArea>
  );
}