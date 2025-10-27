import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Copy, Eye, ThumbsUp, ThumbsDown, Flag } from 'lucide-react';
import { TemplateTypeSelector } from './TemplateTypeSelector';
import { CustomGameUpload } from './CustomGameUpload';

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: {
    id: string;
    name: string;
    description: string | null;
    base_prompt: string | null;
    template_type?: 'ai_generated' | 'custom_upload';
    competency_id?: string;
    selected_sub_competencies?: string[];
    preview_html?: string | null;
  } | null;
  onSuccess: () => void;
}

export const TemplateDialog = ({ open, onOpenChange, template, onSuccess }: TemplateDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [templateType, setTemplateType] = useState<'ai_generated' | 'custom_upload'>('ai_generated');
  const [customGameFile, setCustomGameFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scenario: '',
    playerActions: '',
    edgeCase: '',
    uiAesthetic: '',
  });
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [subCompetencies, setSubCompetencies] = useState<any[]>([]);
  const [selectedCompetency, setSelectedCompetency] = useState<string>('');
  const [selectedSubCompetencies, setSelectedSubCompetencies] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      if (template) {
        // EDIT MODE: Populate form with existing template data
        setFormData({
          name: template.name || '',
          description: template.description || '',
          scenario: '', 
          playerActions: '',
          edgeCase: '',
          uiAesthetic: '',
        });
        setGeneratedPrompt(template.base_prompt || '');
        setTemplateType(template.template_type || 'ai_generated');
        setSelectedCompetency(template.competency_id || '');
        setSelectedSubCompetencies(template.selected_sub_competencies || []);
        setCustomGameFile(null);
        
        // Load saved preview if it exists
        if (template.preview_html) {
          setPreviewHtml(template.preview_html);
          setIsPreviewReady(true);
        } else {
          setPreviewHtml(null);
          setIsPreviewReady(false);
        }
      } else {
        // CREATE MODE: Reset form to initial state
        setFormData({ name: '', description: '', scenario: '', playerActions: '', edgeCase: '', uiAesthetic: '' });
        setGeneratedPrompt('');
        setTemplateType('ai_generated');
        setSelectedCompetency('');
        setSelectedSubCompetencies([]);
        setCustomGameFile(null);
        setPreviewHtml(null);
        setIsPreviewReady(false);
      }
    }
  }, [template, open]);

  // This effect disables the 'View Test' button if the prompt changes
  useEffect(() => {
    // When the prompt changes, the current preview is no longer valid.
    setIsPreviewReady(false);
  }, [generatedPrompt]);

  useEffect(() => {
    const fetchCompetencies = async () => {
      const { data, error } = await supabase
        .from('master_competencies')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching competencies:', error);
        return;
      }
      
      setCompetencies(data || []);
    };
    
    fetchCompetencies();
  }, []);

  useEffect(() => {
    if (!selectedCompetency) {
      setSubCompetencies([]);
      setSelectedSubCompetencies([]);
      return;
    }

    const fetchSubCompetencies = async () => {
      const { data, error } = await supabase
        .from('sub_competencies')
        .select('*')
        .eq('competency_id', selectedCompetency)
        .order('statement');
      
      if (error) {
        console.error('Error fetching sub-competencies:', error);
        return;
      }
      
      setSubCompetencies(data || []);
    };
    
    fetchSubCompetencies();
  }, [selectedCompetency]);

  useEffect(() => {
    if (formData.scenario || formData.playerActions || formData.edgeCase) {
      const selectedComp = competencies.find(c => c.id === selectedCompetency);
      const selectedSubs = subCompetencies.filter(sc => selectedSubCompetencies.includes(sc.id));
      
      const competencySection = selectedComp ? `
🎯 Target Competency:
${selectedComp.name} (${selectedComp.cbe_category})

Sub-Competencies Being Tested:
${selectedSubs.map((sc, idx) => `${idx + 1}. ${sc.statement}
   Player Action: ${sc.player_action || 'Define the player action'}`).join('\n\n') || '[Select 1-2 sub-competencies]'}
` : '';

      const prompt = `Design a 3–6 minute validator mini-game that tests a specific sub-competency through interactive gameplay.

⚙️ Quick Reference:
• Validator: a short interactive mini-game that tests one sub-competency
• Sub-Competency: the specific behavior the validator surfaces through gameplay
• Edge Case: a single twist mid-game that forces adaptation — used to test mastery

All scoring, timing, and proof logic are pre-baked into the system. Focus only on player experience, flow, and the edge-case moment.
${competencySection}
📋 Design Requirements:

Scenario/Theme:
${formData.scenario || '[Describe the narrative wrapper and visual tone]'}

Player Actions:
${formData.playerActions || '[Define how the skill is expressed - e.g., drag-drop, select, type, prioritize]'}

Edge-Case Moment:
${formData.edgeCase || '[Describe how the disruption appears - e.g., timer cuts in half, data field vanishes, rule changes]'}

UI Aesthetic:
${formData.uiAesthetic || '[Define visual style - e.g., greyscale minimalist, neon cyberpunk, branded corporate]'}

📱 Telegram Mini App Requirements:
• Mobile-first responsive design (works on all phone screens)
• Fast loading and smooth performance
• Touch-friendly interactions (buttons, swipes, taps)
• Built with standard web technologies (React, TypeScript)
• Integrates with Telegram Web App SDK for seamless user experience
• Runs inside Telegram messenger interface
• No external app download required

🎯 System Handles Automatically:
• 3 proficiency levels: Needs Work / Proficient / Mastery
• Accuracy %, time tracking, edge-case recovery rate
• Result screen with color-coded feedback (red/yellow/green)
• Proof ledger integration and XP rewards`;
      
      setGeneratedPrompt(prompt);
    }
  }, [formData.scenario, formData.playerActions, formData.edgeCase, formData.uiAesthetic, selectedCompetency, selectedSubCompetencies, competencies, subCompetencies]);

  const handleLoadSample = () => {
    setFormData({
      name: 'Priority Trade-Off Navigator',
      description: 'Tests ability to make strategic decisions under competing constraints',
      scenario: 'You\'re a Product Manager during a critical launch week. The KPI dashboard is overloading — you must prioritize which metrics to stabilize first before the system crashes.',
      playerActions: 'Drag-and-drop to rank 6 competing KPIs (user retention, revenue, bug count, feature completion, team morale, tech debt). Each choice affects other metrics in real-time.',
      edgeCase: 'Halfway through, the CEO messages: \"Revenue must be #1 or we lose funding.\" Timer cuts to 90 seconds. Players must re-prioritize while maintaining system stability.',
      uiAesthetic: 'Neon cyberpunk dashboard with glitching effects. Dark background with bright green/pink accent colors. Deloitte branding in corner. Animated metric cards with real-time % changes.',
    });
    if (competencies.length > 0) {
      setSelectedCompetency(competencies[0].id);
      setTimeout(() => {
        if (subCompetencies.length >= 2) {
          setSelectedSubCompetencies([subCompetencies[0].id, subCompetencies[1].id]);
        }
      }, 500);
    }
    toast.success('Sample template loaded!');
  };

  const handleGeneratePreview = async () => {
    if (!generatedPrompt) {
      toast.error('Please fill in the template details first');
      return;
    }

    setGenerating(true);
    setIsPreviewReady(false);
    try {
      toast.info('Generating game preview... This may take 30-60 seconds');
      
      let subCompetenciesData = [];
      if (selectedSubCompetencies.length > 0) {
        const { data: subComps, error: subError } = await supabase
          .from('sub_competencies')
          .select('*')
          .in('id', selectedSubCompetencies);
        
        if (!subError && subComps) {
          subCompetenciesData = subComps;
        }
      }
      
      const { data, error } = await supabase.functions.invoke('generate-game', {
        body: {
          templatePrompt: generatedPrompt,
          primaryColor: '#00FF00',
          secondaryColor: '#9945FF',
          logoUrl: null,
          customizationId: null,
          previewMode: true,
          subCompetencies: subCompetenciesData,
        }
      });

      if (error) throw error;

      if (data?.html) {
        setPreviewHtml(data.html);
        setIsPreviewReady(true);
        toast.success('Preview generated! You can now view the test.');
      } else {
        throw new Error('No HTML returned from preview');
      }
    } catch (error: any) {
      console.error('Preview generation error:', error);
      toast.error('Failed to generate preview: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleViewTest = () => {
    if (previewHtml) {
      setPreviewOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let customGameUrl = null;

      if (templateType === 'custom_upload' && customGameFile) {
        const fileExt = customGameFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('custom-games')
          .upload(fileName, customGameFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('custom-games')
          .getPublicUrl(fileName);

        customGameUrl = publicUrl;
      }

      const templateData = {
        name: formData.name,
        description: formData.description,
        base_prompt: templateType === 'ai_generated' ? generatedPrompt : null,
        template_type: templateType,
        custom_game_url: customGameUrl,
        competency_id: selectedCompetency || null,
        selected_sub_competencies: selectedSubCompetencies,
        preview_html: previewHtml, // Save the latest preview HTML
      };

      if (template?.id) {
        const { error } = await supabase
          .from('game_templates')
          .update(templateData)
          .eq('id', template.id);

        if (error) throw error;
        toast.success('Template updated!');
      } else {
        const { error } = await supabase
          .from('game_templates')
          .insert({ ...templateData, creator_id: user.id });

        if (error) throw error;
        toast.success('Template created!');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-neon-green text-white pointer-events-auto">
        <DialogHeader>
          <DialogTitle style={{ color: 'hsl(var(--neon-green))' }}>
            {template ? `Editing: ${template.name}` : 'Create New Validator Template'}
          </DialogTitle>
        </DialogHeader>

        <TemplateTypeSelector
          selectedType={templateType}
          onTypeChange={setTemplateType}
        />

        {templateType === 'ai_generated' && (
          <div className="flex justify-end -mt-2 mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadSample}
              className="gap-2"
            >
              Load Sample Template
            </Button>
          </div>
        )}

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-2" style={{ color: 'hsl(var(--neon-green))' }}>
            ⚙️ Quick Reference (Read Before Designing)
          </h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p><strong>Validator:</strong> a short interactive mini-game (3–6 min) that tests one sub-competency.</p>
            <p><strong>Sub-Competency:</strong> the specific behavior the validator surfaces through gameplay.</p>
            <p><strong>Edge Case:</strong> a single twist mid-game that forces adaptation — used to test mastery.</p>
            <p className="text-xs text-gray-400 mt-2">
              All validators automatically handle scoring, timers, and ledger receipts. Designers focus only on player experience, actions, and flow.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-gray-800 border-gray-700"
                placeholder="e.g., Trade-Off Navigator"
              />
            </div>

            <div>
              <Label htmlFor="description">Template Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="bg-gray-800 border-gray-700"
                placeholder="Brief overview of what this validator tests..."
              />
            </div>
          </div>

          {templateType === 'custom_upload' && (
            <CustomGameUpload
              onFileSelect={setCustomGameFile}
              selectedFile={customGameFile}
            />
          )}

          {templateType === 'ai_generated' && (
            <>

          <div className="border-t border-gray-700 pt-4 space-y-4">
            <h3 className="font-semibold" style={{ color: 'hsl(var(--neon-green))' }}>
              CBE Competency Framework
            </h3>

            <div className="relative z-[100]">
              <Label htmlFor="competency">Select Competency *</Label>
              <Select value={selectedCompetency} onValueChange={setSelectedCompetency}>
                <SelectTrigger id="competency" className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Choose a competency..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white z-[9999]">
                  {competencies.map((comp) => (
                    <SelectItem 
                      key={comp.id} 
                      value={comp.id} 
                      className="cursor-pointer hover:bg-gray-700 focus:bg-gray-700 text-white"
                    >
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCompetency && subCompetencies.length > 0 && (
              <div>
                <Label>Select 1-2 Sub-Competencies *</Label>
                <div className="space-y-2 mt-2 max-h-60 overflow-y-auto bg-gray-800 border border-gray-700 rounded-md p-3">
                  {subCompetencies.map((sub) => (
                    <div key={sub.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={sub.id}
                        checked={selectedSubCompetencies.includes(sub.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            if (selectedSubCompetencies.length < 2) {
                              setSelectedSubCompetencies([...selectedSubCompetencies, sub.id]);
                            } else {
                              toast.error('Maximum 2 sub-competencies allowed');
                            }
                          } else {
                            setSelectedSubCompetencies(selectedSubCompetencies.filter(id => id !== sub.id));
                          }
                        }}
                      />
                      <label
                        htmlFor={sub.id}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {sub.statement}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Select 1-2 behaviors this validator will test
                </p>
              </div>
            )}

            {selectedSubCompetencies.length > 0 && (
              <div className="bg-gray-800 border border-neon-green/30 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-sm" style={{ color: 'hsl(var(--neon-green))' }}>
                  🎮 Player Actions to Surface
                </h4>
                <div className="space-y-3">
                  {subCompetencies
                    .filter(sub => selectedSubCompetencies.includes(sub.id))
                    .map((sub, idx) => (
                      <div key={sub.id} className="text-sm">
                        <p className="font-medium text-gray-300 mb-1">
                          {idx + 1}. {sub.statement}
                        </p>
                        <p className="text-gray-400 text-xs pl-4">
                          → {sub.player_action || 'No action defined'}
                        </p>
                      </div>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-3 italic">
                  These actions will be incorporated into your game design. Scoring logic is handled automatically in the backend.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-700 pt-4 space-y-4">
            <h3 className="font-semibold" style={{ color: 'hsl(var(--neon-green))' }}>
              Designer-Controlled Elements
            </h3>
            <p className="text-xs text-yellow-400 mb-2">
              ⚠️ Fill in these fields to generate the AI prompt and unlock the Test Preview button
            </p>

            <div>
              <Label htmlFor="scenario">Scenario / Theme *</Label>
              <Textarea
                id="scenario"
                value={formData.scenario}
                onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
                rows={3}
                className="bg-gray-800 border-gray-700"
                placeholder="Describe the narrative wrapper & visual tone. Example: 'Reboot the KPI system before it collapses.'"
              />
            </div>

            <div>
              <Label htmlFor="playerActions">Player Actions *</Label>
              <Textarea
                id="playerActions"
                value={formData.playerActions}
                onChange={(e) => setFormData({ ...formData, playerActions: e.target.value })}
                rows={3}
                className="bg-gray-800 border-gray-700"
                placeholder="How the skill is expressed. Example: 'Drag-and-drop to rank priorities' or 'Select trade-offs between competing KPIs'"
              />
            </div>

            <div>
              <Label htmlFor="edgeCase">Edge-Case Moment *</Label>
              <Textarea
                id="edgeCase"
                value={formData.edgeCase}
                onChange={(e) => setFormData({ ...formData, edgeCase: e.target.value })}
                rows={3}
                className="bg-gray-800 border-gray-700"
                placeholder="How the disruption appears. Example: 'Timer cuts in half' or 'Key data field vanishes mid-game'"
              />
            </div>

            <div>
              <Label htmlFor="uiAesthetic">UI Aesthetic</Label>
              <Textarea
                id="uiAesthetic"
                value={formData.uiAesthetic}
                onChange={(e) => setFormData({ ...formData, uiAesthetic: e.target.value })}
                rows={2}
                className="bg-gray-800 border-gray-700"
                placeholder="Visual style. Example: 'Greyscale minimalist' or 'Neon cyberpunk with Deloitte branding'"
              />
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            {!generatedPrompt ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                <p className="text-yellow-400 font-semibold mb-2">⚠️ Preview Not Available Yet</p>
                <p className="text-sm text-gray-300">
                  Fill in at least the <strong>Scenario</strong>, <strong>Player Actions</strong>, and <strong>Edge-Case Moment</strong> fields above to generate the prompt and unlock the preview buttons.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <Label>Generated AI Design Prompt</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/validator-demo', '_blank')}
                    >
                      View Demo
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleGeneratePreview}
                      disabled={generating}
                      className="gap-2 bg-neon-green text-white hover:bg-neon-green/90"
                    >
                      {generating ? 'Generating...' : 'Generate Preview'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleViewTest}
                      disabled={!isPreviewReady || generating}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Test
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={generatedPrompt}
                  onChange={(e) => setGeneratedPrompt(e.target.value)}
                  rows={10}
                  className="bg-gray-800 border-gray-700 text-xs font-mono"
                />
                <p className="text-xs text-gray-400 mt-2">
                  You can directly edit this prompt. Your changes will be saved with the template.
                </p>
              </>
            )}
          </div>
          </>
          )}

          <div className="flex gap-3 justify-end border-t border-gray-700 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (templateType === 'custom_upload' && !customGameFile)}
            >
              {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </DialogContent>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className="max-w-[430px] w-full bg-black border-neon-green p-0 flex flex-col overflow-y-auto hide-scrollbar"
          style={{ maxHeight: '90vh' }}
        >
          <style>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .hide-scrollbar {
              -ms-overflow-style: none;  /* IE and Edge */
              scrollbar-width: none;  /* Firefox */
            }
          `}</style>
          <DialogHeader className="px-4 py-3 border-b border-neon-green/30 flex-shrink-0">
            <DialogTitle className="text-neon-green text-glow-green text-sm">
              Mobile Preview - {formData.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1">
            {previewHtml && (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full"
                title="Game Preview"
                sandbox="allow-scripts allow-same-origin"
                style={{ minHeight: '932px' }}
              />
            )}
          </div>
          <div
            className="px-4 border-t border-neon-green/30 flex-shrink-0 flex items-center gap-2"
            style={{ height: '60px' /* 20px is too small for buttons */ }}
          >
            <Button
              variant="outline"
              onClick={() => setPreviewOpen(false)}
              className="w-full bg-gray-800 text-white hover:bg-gray-700"
            >
              Close Preview
            </Button>
            <Button variant="ghost" size="icon" onClick={() => toast('Liked!')}><ThumbsUp className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => toast('Disliked!')}><ThumbsDown className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => toast('Reported!')}><Flag className="h-4 w-4" /></Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
