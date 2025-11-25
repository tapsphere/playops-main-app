import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle, PlayCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ValidatorTestWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    id: string;
    name: string;
    template_type: string;
    custom_game_url?: string;
  };
  subCompetency: {
    id: string;
    statement: string;
    action_cue: string;
  } | null;
  onComplete: () => void;
  demoMode?: boolean;
}

interface CheckResult {
  checkNumber: number;
  name: string;
  status: 'passed' | 'failed' | 'needs_review';
  notes: string;
  details: any;
}

export function ValidatorTestWizard({
  open,
  onOpenChange,
  template,
  subCompetency,
  onComplete,
  demoMode = false
}: ValidatorTestWizardProps) {
  const [testing, setTesting] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<'passed' | 'failed' | 'needs_review' | 'not_started'>('not_started');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setTestComplete(false);
      setResults([]);
      setOverallStatus('not_started');
      setTesting(false);
    }
  }, [open]);

  const handleRunAutomatedTests = async () => {
    if (!subCompetency) {
      toast.error('Sub-competency data required for testing');
      return;
    }

    try {
      setTesting(true);
      
      // Demo mode: return mock passing results
      if (demoMode) {
        toast.info('🎬 Demo Mode: Simulating test execution');
        
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock all 8 tests passing
        const mockResults: CheckResult[] = [
          {
            checkNumber: 1,
            name: 'PlayOps Compliance',
            status: 'passed',
            notes: 'Template follows PlayOps structure',
            details: { framework: 'v3.1', aligned: true }
          },
          {
            checkNumber: 2,
            name: 'Locked Elements',
            status: 'passed',
            notes: 'All C-BEN elements properly locked',
            details: { locked_count: 5 }
          },
          {
            checkNumber: 3,
            name: 'Scoring Logic',
            status: 'passed',
            notes: 'Proficiency levels correctly defined',
            details: { levels: 3, formulas_valid: true }
          },
          {
            checkNumber: 4,
            name: 'Edge Case Implementation',
            status: 'passed',
            notes: 'Mastery-level disruption present',
            details: { edge_case_found: true }
          },
          {
            checkNumber: 5,
            name: 'UI/UX Standards',
            status: 'passed',
            notes: 'Mobile-optimized and accessible',
            details: { responsive: true, wcag_compliant: true }
          },
          {
            checkNumber: 6,
            name: 'Data Capture',
            status: 'passed',
            notes: 'Backend tracking implemented',
            details: { capture_points: 8 }
          },
          {
            checkNumber: 7,
            name: 'Result Screens',
            status: 'passed',
            notes: 'All 3 proficiency endings present',
            details: { screens: 3 }
          },
          {
            checkNumber: 8,
            name: 'Telegram Integration',
            status: 'passed',
            notes: 'Mini-game optimized',
            details: { telegram_ready: true }
          }
        ];
        
        setResults(mockResults);
        setOverallStatus('passed');
        setTestComplete(true);
        toast.success('🎉 All 8 tests passed! (Demo)');
        setTesting(false);
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Step 1: Check if we need to generate the game first
      const { data: templateData } = await supabase
        .from('game_templates')
        .select('template_type, game_config, selected_sub_competencies, base_prompt, design_settings')
        .eq('id', template.id)
        .single();

      const isAiGenerated = templateData?.template_type === 'ai_generated';
      const gameConfig = templateData?.game_config as any;
      const hasGeneratedHtml = gameConfig?.generated_html;

      // If AI-generated and no HTML exists, generate it first
      if (isAiGenerated && !hasGeneratedHtml) {
        toast.info('🎮 Generating game first...', {
          description: 'This is required before testing'
        });

        // Get design settings (per-game or creator default)
        let designPalette: any = null;
        let particleEffect = 'sparkles';
        
        if (templateData.design_settings) {
          designPalette = templateData.design_settings;
          particleEffect = designPalette.particleEffect || 'sparkles';
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('design_palette, default_particle_effect')
            .eq('user_id', user.id)
            .maybeSingle();
          
          designPalette = profile?.design_palette || {
            primary: '#C8DBDB',
            secondary: '#6C8FA4',
            accent: '#2D5556',
            background: '#F5EDD3',
            highlight: '#F0C7A0',
            text: '#2D5556',
            font: 'Inter, sans-serif'
          };
          particleEffect = profile?.default_particle_effect || 'sparkles';
        }

        // Fetch sub-competency data
        const subCompIds = templateData.selected_sub_competencies || [];
        const { data: subComps } = await supabase
          .from('sub_competencies')
          .select('*')
          .in('id', subCompIds);

        // Generate the game
        const response = await supabase.functions.invoke('generate-game', {
          body: {
            templatePrompt: templateData.base_prompt,
            primaryColor: designPalette.primary,
            secondaryColor: designPalette.secondary,
            accentColor: designPalette.accent,
            backgroundColor: designPalette.background,
            highlightColor: designPalette.highlight,
            textColor: designPalette.text,
            fontFamily: designPalette.font,
            particleEffect: particleEffect,
            logoUrl: null,
            customizationId: null,
            previewMode: false,
            subCompetencies: subComps || []
          }
        });

        // Check for errors and extract error message properly
        if (response.error) {
          // Try multiple ways to extract the error message
          const errorMsg = 
            response.data?.error || 
            (typeof response.error === 'string' ? response.error : response.error?.message) ||
            'Unknown error';
          
          console.error('Game generation error:', { error: response.error, data: response.data, errorMsg });
          
          // Check for specific error types
          if (errorMsg.includes('credits depleted') || errorMsg.includes('AI credits') || errorMsg.includes('402')) {
            throw new Error('❌ AI credits depleted. Please add credits to continue.\n\nGo to Settings → Usage to add more credits.');
          } else if (errorMsg.includes('Payment Required') || errorMsg.includes('payment_required')) {
            throw new Error('❌ Payment required. Add AI credits in Settings → Usage → Cloud & AI balance.');
          } else if (errorMsg.includes('429') || errorMsg.includes('Rate limit')) {
            throw new Error('⏳ Rate limit exceeded. Please wait a moment and try again.');
          }
          
          throw new Error('Failed to generate game: ' + errorMsg);
        }
        
        if (!response.data?.generatedHtml && !response.data?.html) {
          throw new Error('No HTML received from game generator');
        }

        // Save the generated HTML to the template
        const generatedHtml = response.data.generatedHtml || response.data.html;
        const updatedGameConfig = {
          ...(typeof gameConfig === 'object' ? gameConfig : {}),
          generated_html: generatedHtml
        };
        
        const { error: updateError } = await supabase
          .from('game_templates')
          .update({
            game_config: updatedGameConfig as any
          })
          .eq('id', template.id);

        if (updateError) throw new Error('Failed to save generated game: ' + updateError.message);

        toast.success('✅ Game generated successfully!');
      }

      // Step 2: Now run the automated tests
      toast.info('🤖 Running automated v3.1 stress tests...', {
        description: 'Testing all 8 validation checks'
      });

      const { data, error } = await supabase.functions.invoke('stress-test-validator', {
        body: {
          templateId: template.id,
          subCompetencyId: subCompetency?.id || null,
          testerId: user.id
        }
      });

      if (error) throw error;

      // Update local state with results
      setResults(data.results);
      setOverallStatus(data.overallStatus);
      setTestComplete(true);

      // Show appropriate feedback
      if (data.overallStatus === 'passed') {
        toast.success('✅ All 8 automated checks passed!', {
          description: 'Validator approved for publishing'
        });
      } else if (data.overallStatus === 'failed') {
        toast.error('❌ One or more checks failed', {
          description: 'Review issues and fix before publishing'
        });
      } else {
        toast.warning('⚠️ Manual review required', {
          description: 'Some checks need attention'
        });
      }
      
      onComplete();
      
    } catch (error: any) {
      console.error('Automated test error:', error);
      toast.error('Failed to run automated tests: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'needs_review': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <div className="w-5 h-5 rounded-full border-2 border-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-500/10 border-green-500';
      case 'failed': return 'bg-red-500/10 border-red-500';
      case 'needs_review': return 'bg-yellow-500/10 border-yellow-500';
      default: return 'bg-gray-800 border-gray-700';
    }
  };

  const progress = testComplete ? 100 : testing ? 50 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-gray-900 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white flex items-center gap-2">
            {template.template_type === 'ai_generated' ? '🤖' : '📤'} {template.name}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Validator Testing v3.1 - 8 Automated Checks
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <Progress value={progress} className="h-2" />

        {/* Template Info */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Type:</span>
            <span className="text-white">
              {template.template_type === 'ai_generated' ? '🤖 AI Generated' : '📤 Custom Upload'}
            </span>
          </div>
          {subCompetency && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-400">Sub-Competency:</span>
                <span className="text-white text-right">{subCompetency.statement}</span>
              </div>
              {subCompetency.action_cue && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Action Cue:</span>
                  <span className="text-white text-right">{subCompetency.action_cue}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Test Status */}
        {!testComplete && !testing && (
          <div className="bg-gray-800 border-2 border-neon-green rounded-lg p-6 text-center space-y-4">
            <h3 className="text-xl font-bold text-white">Ready to Run Automated Tests</h3>
            {template.template_type === 'ai_generated' && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-2">
                <p className="text-blue-300 text-sm">
                  ℹ️ No upload needed! Your game will be auto-generated from your prompt before testing.
                </p>
              </div>
            )}
            <p className="text-gray-400">
              This will run 8 comprehensive checks including scene structure, UX/UI integrity, 
              Telegram compliance, configuration validation, and more.
            </p>
            <Button
              onClick={handleRunAutomatedTests}
              disabled={testing}
              className="gap-2 bg-neon-green text-black hover:bg-neon-green/80 text-lg py-6 px-8"
            >
              <PlayCircle className="w-6 h-6" />
              Run All 8 Automated Checks
            </Button>
          </div>
        )}

        {testing && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-neon-green border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-white font-semibold">Running automated tests...</p>
            <p className="text-gray-400 text-sm">This may take a few moments</p>
          </div>
        )}

        {/* Test Results */}
        {testComplete && (
          <div className="space-y-4">
            {/* Overall Status */}
            <div className={`border-2 rounded-lg p-4 ${getStatusColor(overallStatus)}`}>
              <div className="flex items-center gap-3">
                {getStatusIcon(overallStatus)}
                <div>
                  <h3 className="font-bold text-lg text-white">
                    Overall Status: {overallStatus.replace('_', ' ').toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {overallStatus === 'passed' 
                      ? '✅ All checks passed! Ready for publishing.' 
                      : overallStatus === 'failed'
                      ? '❌ Critical issues found. Review and fix before publishing.'
                      : '⚠️ Manual review required for some checks.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Individual Check Results */}
            <div className="space-y-3">
              <h4 className="font-semibold text-white">Individual Check Results:</h4>
              {results.map((check) => (
                <div
                  key={check.checkNumber}
                  className={`border rounded-lg p-4 ${getStatusColor(check.status)}`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(check.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          Check {check.checkNumber}/8
                        </Badge>
                        <h5 className="font-semibold text-white">{check.name}</h5>
                      </div>
                      <p className="text-sm text-gray-300">{check.notes}</p>
                      {check.details && Object.keys(check.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                            View details
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-950 p-2 rounded overflow-auto">
                            {JSON.stringify(check.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-600"
          >
            {testComplete ? 'Close' : 'Cancel'}
          </Button>
          {testComplete && overallStatus === 'passed' && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onComplete();
              }}
              className="gap-2 bg-neon-green text-black hover:bg-neon-green/80"
            >
              <CheckCircle className="w-5 h-5" />
              Continue to Publish Options
            </Button>
          )}
          {testComplete && overallStatus !== 'passed' && (
            <Button
              onClick={handleRunAutomatedTests}
              className="gap-2 bg-neon-green text-black hover:bg-neon-green/80"
            >
              <PlayCircle className="w-5 h-5" />
              Re-run Tests
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
