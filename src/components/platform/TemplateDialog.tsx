import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Eye, Sparkles, Upload, X, CheckCircle } from 'lucide-react';
import { DesignPaletteEditor } from './DesignPaletteEditor';
import { ValidatorTestWizard } from './ValidatorTestWizard';
import { PlayOpsStructureGuide } from './PlayOpsStructureGuide';

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: {
    id: string;
    name: string;
    description: string | null;
    base_prompt: string | null;
  } | null;
  onSuccess: () => void;
  onTemplateCreated?: (templateData: {
    id: string;
    name: string;
    template_type: string;
    selected_sub_competencies: string[];
    custom_game_url?: string;
    game_config?: any;
    description?: string;
    base_prompt?: string;
    design_settings?: any;
  }) => void;
  demoMode?: boolean;
}

// Global sample prompt with full scoring and proficiency details
const SAMPLE_PROMPT_WITH_SCORING = `🎮 HOW TO PLAY:
You are a crisis communication manager at TechFlow Inc. A data breach just happened affecting 50,000 accounts.

YOUR GOAL: Draft a public statement and response strategy within 2 hours.

HOW TO INTERACT:
• Read incoming messages from stakeholders (scroll through messages)
• Type your statement in the composer
• Click priority buttons to contact stakeholder groups
• Select communication channels (checkboxes)
• Set timeline using dropdown
• Click "Publish" when ready

SUCCESS: 
- Level 1: Complete task but miss key elements
- Level 2: Balanced, timely communication
- Level 3: Perfect execution + adapt to edge case twist

---

SCENARIO:
Your task: Draft an initial public statement and response strategy within the next 2 hours.

Available information:
- Breach discovered 45 minutes ago
- Engineering team is still investigating the scope
- Legal team is reviewing disclosure requirements
- CEO wants to be "transparent but not alarming"

Player actions:
1. Review incoming stakeholder messages (customers, investors, press)
2. Draft initial public statement
3. Prioritize which stakeholder groups to contact first
4. Decide on communication channels (email, social media, press release)
5. Set timeline for follow-up communications

Edge case twist: Just as you're about to publish, the engineering team reports the breach may be larger than initially thought, but they need 3 more hours to confirm. Do you:
- Publish your statement now with current information?
- Delay and risk news leaking from other sources?
- Publish a holding statement acknowledging the investigation?

Scoring formulas (from sub_competencies table):
- Level 1 (Needs Work): Published without acknowledging uncertainty OR delayed more than 4 hours OR failed to contact key stakeholders within 2 hours. Score = (timeliness * 0.3) + (stakeholder_coverage * 0.3) + (transparency * 0.4). XP: 50
- Level 2 (Proficient): Published holding statement within 1 hour, contacted all key stakeholders, acknowledged investigation ongoing. Score = (timeliness * 0.3) + (stakeholder_coverage * 0.3) + (transparency * 0.4). XP: 150
- Level 3 (Mastery): Published nuanced holding statement within 45 minutes, proactively set up stakeholder-specific communication channels, framed uncertainty as commitment to accuracy, established clear follow-up timeline. Score = (timeliness * 0.2) + (stakeholder_coverage * 0.3) + (transparency * 0.3) + (strategic_framing * 0.2). XP: 300

Backend data captured:
- timestamp_first_action
- statement_draft_versions (array)
- stakeholder_contact_order (array)
- communication_channels_selected (array)
- decision_on_edge_case (string: "publish_now" | "delay" | "holding_statement")
- time_to_first_publication (seconds)

End result screens:
- Level 1: "Crisis Escalated" - Shows news headlines about the company's silence, customer complaints on social media, and stock price impact. Feedback: "Speed matters, but so does acknowledging what you don't know."
- Level 2: "Crisis Contained" - Shows positive reception to transparency, stakeholders appreciate honesty, minimal negative press. Feedback: "Good crisis management. You balanced speed with accuracy."
- Level 3: "Crisis Transformed" - Shows media praising the company's transparent approach, customers expressing trust, and stakeholders viewing this as a model response. Feedback: "Masterful. You turned a crisis into a trust-building moment."

UI aesthetic: Modern dashboard with a ticking clock, incoming message notifications, and a statement composer with real-time sentiment analysis of your draft.`;

export const TemplateDialog = ({ open, onOpenChange, template, onSuccess, onTemplateCreated, demoMode = false }: TemplateDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [customGameFile, setCustomGameFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [creationMethod, setCreationMethod] = useState<'ai' | 'custom'>('ai');
  
  // Custom upload validation state
  const [validationStatus, setValidationStatus] = useState<'not_tested' | 'testing' | 'passed' | 'failed'>('not_tested');
  const [draftTemplateId, setDraftTemplateId] = useState<string | null>(null);
  const [showTestWizard, setShowTestWizard] = useState(false);
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    industry: '',
    roleScenario: '',
    keyElement: '',
    edgeCaseDetails: '',
    visualTheme: 'modern',
    interactionMethod: '',
    scenario: '',
    playerActions: '',
    scene1: '',
    scene2: '',
    scene3: '',
    scene4: '',
    edgeCaseTiming: 'mid' as 'early' | 'mid' | 'late',
    edgeCase: '',
    uiAesthetic: '',
  });
  const [activeScenes, setActiveScenes] = useState(1); // Track how many scene fields are shown
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Design settings - optional per-game overrides
  const [useCustomDesign, setUseCustomDesign] = useState(false);
  const [designSettings, setDesignSettings] = useState({
    primary: '#C8DBDB',
    secondary: '#6C8FA4',
    accent: '#2D5556',
    background: '#F5EDD3',
    highlight: '#F0C7A0',
    text: '#2D5556',
    font: 'Inter, sans-serif',
    avatar: '',
    particleEffect: 'sparkles'
  });
  
  // Competency data
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [subCompetencies, setSubCompetencies] = useState<any[]>([]);
  const [selectedCompetency, setSelectedCompetency] = useState<string>('');
  const [selectedSubCompetencies, setSelectedSubCompetencies] = useState<string[]>([]);
  
  // Scene-to-sub mapping for multi-sub templates
  const [sceneSubMapping, setSceneSubMapping] = useState<{[key: number]: string}>({
    1: '',
    2: '',
    3: '',
    4: ''
  });
  
  // Get selected sub-competency data
  const selectedSub = subCompetencies.find(sub => selectedSubCompetencies.includes(sub.id));
  
  // Get interaction method options based on game mechanic
  const getInteractionMethods = () => {
    if (!selectedSub?.game_mechanic) return [];
    
    const mechanic = selectedSub.game_mechanic;
    if (mechanic.includes('Resource Allocation')) {
      return ['Drag-and-drop resource tiles', 'Slider-based percentage allocation', 'Click +/- buttons to distribute', 'Type numerical values'];
    }
    if (mechanic.includes('Ranking') || mechanic.includes('Prioritization')) {
      return ['Drag items to reorder list', 'Click arrows to move up/down', 'Select ranking number per item', 'Drop into priority buckets'];
    }
    if (mechanic.includes('Data Analysis') || mechanic.includes('Pattern Recognition')) {
      return ['Click data points to tag patterns', 'Draw trend lines on charts', 'Select filters and view results', 'Highlight matching data'];
    }
    if (mechanic.includes('Error-Detection') || mechanic.includes('Diagnosis')) {
      return ['Click on errors to flag them', 'Select from error type dropdown', 'Drag items to correct/incorrect bins', 'Type error descriptions'];
    }
    if (mechanic.includes('Divergent') || mechanic.includes('Idea Builder')) {
      return ['Type ideas in text fields', 'Select from idea cards and remix', 'Click prompts to generate variants', 'Drag concepts to combine'];
    }
    if (mechanic.includes('Concept Remix')) {
      return ['Type "How might we..." reframe statements', 'Select reframing prompts and customize', 'Drag word tiles to create new phrasing', 'Click perspective cards to shift viewpoint'];
    }
    if (mechanic.includes('Bias Detector')) {
      return ['Drag statements into category bins (fact/inference/opinion)', 'Click category button for each statement', 'Swipe cards left/right to categorize', 'Select category from dropdown per statement'];
    }
    if (mechanic.includes('Pattern Transfer') && mechanic.includes('application scenario')) {
      return ['Click feedback points to adjust design', 'Toggle design options based on feedback', 'Type adjustments in response to feedback', 'Drag sliders to refine based on input'];
    }
    if (mechanic.includes('Constraint Challenge') || mechanic.includes('Convergent')) {
      return ['Select best option from list', 'Rate ideas with star ratings', 'Drag to feasibility matrix', 'Click checkboxes for criteria'];
    }
    if (mechanic.includes('Logic') || mechanic.includes('Argument')) {
      return ['Highlight text to mark assumptions', 'Click statements to tag logic', 'Drag claims to conclusion boxes', 'Select fallacy types from dropdown'];
    }
    if (mechanic.includes('Evidence') || mechanic.includes('Weighing')) {
      return ['Drag sources into ranking order', 'Rate reliability with sliders', 'Click to select best evidence', 'Type justification for ranking'];
    }
    if (mechanic.includes('Mapping') || mechanic.includes('Systems') || mechanic.includes('Causal')) {
      return ['Drag boxes to create flowchart', 'Click to add nodes and connections', 'Draw lines between causes/effects', 'Select relationships from dropdown'];
    }
    if (mechanic.includes('Prototype') || mechanic.includes('Refinement')) {
      return ['Upload/modify design iterations', 'Click feedback points to adjust', 'Type changes to implement', 'Select improvement options'];
    }
    if (mechanic.includes('Communication') || mechanic.includes('Report') || mechanic.includes('Pitch')) {
      return ['Type message in text editor', 'Select template and customize', 'Drag content blocks to structure', 'Click tone/style options'];
    }
    if (mechanic.includes('Decision-Tree') || mechanic.includes('Simulation')) {
      return ['Click choice buttons at each fork', 'Select from dropdown decisions', 'Type rationale for decisions', 'Drag actions to timeline'];
    }
    if (mechanic.includes('Retrospective') || mechanic.includes('Reflective')) {
      return ['Type observations in text fields', 'Select insights from categories', 'Rate performance aspects', 'Drag lessons to priority list'];
    }
    
    // Default for any other mechanic
    return ['Click to select options', 'Type responses in text fields', 'Drag elements to interact', 'Use buttons to make choices'];
  };

  // Fetch competencies on mount
  useEffect(() => {
    const fetchCompetencies = async () => {
      const { data, error } = await supabase
        .from('master_competencies')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('Error fetching competencies:', error);
        toast.error('Failed to fetch competencies', { description: error.message });
        return;
      }
      
      setCompetencies(data || []);
    };
    
    fetchCompetencies();
  }, []);

  // Fetch sub-competencies when competency is selected
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
        .order('display_order', { nullsFirst: false });
      
      if (error) {
        console.error('Error fetching sub-competencies:', error);
        toast.error('Failed to fetch sub-competencies', { description: error.message });
        return;
      }
      
      setSubCompetencies(data || []);
    };
    
    fetchSubCompetencies();
  }, [selectedCompetency]);

  // Auto-load sample when sub-competency changes
  useEffect(() => {
    if (selectedSubCompetencies.length > 0 && subCompetencies.length > 0) {
      const loadSampleAuto = async () => {
        const selectedSub = subCompetencies.find(sub => selectedSubCompetencies[0] === sub.id);
        if (!selectedSub) return;

        const { data: subCompData, error: subError } = await supabase
          .from('sub_competencies')
          .select('*')
          .eq('id', selectedSub.id)
          .single();

        if (subError || !subCompData) {
          console.error('Error loading sub-competency:', subError);
          return;
        }

        console.log('Loading sample for:', subCompData.statement);

        // Create concrete examples based on the PlayOps framework with proper fallbacks
        const actionCue = subCompData.action_cue || 'a critical challenge emerges';
        const playerAction = subCompData.player_action || 'make strategic decisions';
        const validatorType = subCompData.validator_type || 'behavioral tracking';
        const gameLoop = subCompData.game_loop || 'during a key decision point';
        const gameMechanic = subCompData.game_mechanic || 'interactive decision-making';
        const backendData = subCompData.backend_data_captured || [];
        const scoringLogic = subCompData.scoring_logic || {};
        
        // Format backend data captured
        const dataTracked = Array.isArray(backendData) && backendData.length > 0 
          ? backendData.join(', ')
          : 'decision quality, response time, accuracy rate';
        
        // Get scoring formulas
        const level1Formula = subCompData.scoring_formula_level_1 || 'Accuracy < 60% OR Time > 6min OR Failed edge case';
        const level2Formula = subCompData.scoring_formula_level_2 || 'Accuracy 60-84% AND Time 3-6min AND Partial edge case recovery';
        const level3Formula = subCompData.scoring_formula_level_3 || 'Accuracy ≥ 85% AND Time < 3min AND Full edge case recovery';
        
        // Create unique edge cases based on validator type and context
        const edgeCaseScenarios: { [key: string]: string } = {
          'Scenario-Based Simulation': 'Suddenly, a key constraint changes: the budget is cut by 40% or a critical resource becomes unavailable. You must quickly reassess your strategy and reallocate without compromising the core objective.',
          'Communication Product': 'Midway through, the target stakeholder changes - what was meant for executives now needs to be rewritten for frontline staff. The KPIs remain but your messaging must completely shift to match the new audience.',
          'Data Analysis': 'Halfway through the analysis, new contradictory data appears that challenges your initial pattern recognition. You must reconcile the conflicting information and update your insights under time pressure.',
          'Performance Assessment': 'The evaluation criteria suddenly shifts - a metric you thought was low priority is now the primary KPI. You must rapidly pivot your approach while maintaining quality in your initial work.',
        };
        
        const edgeCase = edgeCaseScenarios[validatorType] || 
          `During a critical decision point (${gameLoop}), an unexpected variable changes the rules of engagement - testing whether you can maintain performance quality while adapting your strategy in real-time.`;
        
        // Create scene progression based on validator type
        const sceneExamples: { [key: string]: { scene1: string, scene2: string, scene3: string, scene4?: string } } = {
          'Scenario-Based Simulation': {
            scene1: 'Review initial scenario data and make baseline decisions using normal constraints',
            scene2: 'New variable introduced - adjust strategy while maintaining core objectives',
            scene3: '⚡ EDGE CASE: Budget cut 40% - rapidly reallocate resources',
            scene4: 'Finalize and submit optimized plan under new constraints'
          },
          'Communication Product': {
            scene1: 'Draft initial message for target audience with given KPIs',
            scene2: 'Refine messaging based on feedback and additional context',
            scene3: '⚡ EDGE CASE: Audience changed - rewrite for different stakeholder group'
          },
          'Data Analysis': {
            scene1: 'Analyze baseline dataset and identify initial patterns',
            scene2: 'Apply filters and validate findings against criteria',
            scene3: '⚡ EDGE CASE: Contradictory data appears - reconcile and update insights',
            scene4: 'Present final analysis with updated recommendations'
          },
          'Performance Assessment': {
            scene1: 'Evaluate performance using primary metrics',
            scene2: 'Compare against benchmarks and identify gaps',
            scene3: '⚡ EDGE CASE: Priority KPI suddenly changes - pivot evaluation focus'
          }
        };
        
        const scenes = sceneExamples[validatorType] || {
          scene1: 'Complete baseline task using standard approach',
          scene2: 'Adapt to new information or constraint',
          scene3: '⚡ EDGE CASE: Critical rule change - adjust strategy in real-time'
        };
        
        // Generate context-specific defaults based on game mechanic
        const getKeyElementDefault = (mechanic: string) => {
          if (mechanic.includes('Resource Allocation')) return 'Budget, Staff, Time';
          if (mechanic.includes('Ranking') || mechanic.includes('Prioritization')) return 'Projects A, B, C, D';
          if (mechanic.includes('Data Analysis') || mechanic.includes('Pattern Recognition')) return 'Sales data, performance metrics';
          if (mechanic.includes('Error-Detection') || mechanic.includes('Diagnosis')) return 'System logs, diagnostic reports';
          if (mechanic.includes('Divergent') || mechanic.includes('Idea Builder')) return 'Brainstorming constraints, ideation prompts';
          if (mechanic.includes('Concept Remix')) return 'Problem statement to reframe';
          if (mechanic.includes('Prototype Refinement')) return 'Initial design concept, feedback rounds';
          if (mechanic.includes('Constraint Challenge') || mechanic.includes('Convergent')) return 'Generated ideas, feasibility criteria';
          if (mechanic.includes('Pattern Transfer') && mechanic.includes('application')) return 'Prototype v1, simulated feedback';
          if (mechanic.includes('Storyboard') || mechanic.includes('Pitch Builder')) return 'Creative concept, rationale points';
          if (mechanic.includes('Logic Scenario') || mechanic.includes('Argument evaluation')) return 'Argument text, hidden assumptions';
          if (mechanic.includes('Bias Detector')) return 'Mixed statements (facts, inferences, opinions)';
          if (mechanic.includes('Evidence Weighing')) return 'Source documents, reliability indicators';
          if (mechanic.includes('Causal Mapping')) return 'Multi-step argument, logical fallacies';
          if (mechanic.includes('Adaptive Logic Loop')) return 'Incomplete dataset, conclusion options';
          if (mechanic.includes('Debate Response')) return 'Argument facts, persuasive elements';
          if (mechanic.includes('Systems Mapping')) return 'Problem symptoms, root cause clues';
          if (mechanic.includes('Solution Generator')) return 'Problem parameters, solution constraints';
          if (mechanic.includes('Criteria Scoring')) return 'Problem types, solution tools/methods';
          if (mechanic.includes('Execution Simulation')) return 'Action steps, timeline, resources';
          if (mechanic.includes('Adaptive Fix-Flow')) return 'Implementation status, rule changes';
          if (mechanic.includes('Retrospective Builder')) return 'Performance data, outcome metrics';
          if (mechanic.includes('Report-Builder') || mechanic.includes('KPI Matching')) return 'Results summary, defined KPIs';
          if (mechanic.includes('Decision-Tree') || mechanic.includes('Simulation')) return 'Decision points, stakeholder conflicts';
          return 'Key decision factors and constraints';
        };
        
        const getEdgeCaseDefault = (mechanic: string) => {
          if (mechanic.includes('Resource Allocation')) return 'Budget suddenly cut by 40%';
          if (mechanic.includes('Ranking') || mechanic.includes('Prioritization')) return 'Priority criteria flips mid-task';
          if (mechanic.includes('Data Analysis') || mechanic.includes('Pattern Recognition')) return 'Contradictory data appears requiring reconciliation';
          if (mechanic.includes('Error-Detection') || mechanic.includes('Diagnosis')) return 'New error type emerges not in initial framework';
          if (mechanic.includes('Divergent') || mechanic.includes('Idea Builder')) return 'Client adds major constraint after ideation phase';
          if (mechanic.includes('Concept Remix')) return 'Stakeholder rejects initial reframe, demands new angle';
          if (mechanic.includes('Prototype Refinement')) return 'User feedback contradicts initial design assumptions';
          if (mechanic.includes('Constraint Challenge') || mechanic.includes('Convergent')) return 'Feasibility constraint becomes stricter mid-evaluation';
          if (mechanic.includes('Pattern Transfer') && mechanic.includes('application')) return 'Feedback round 2 contradicts round 1 guidance';
          if (mechanic.includes('Storyboard') || mechanic.includes('Pitch Builder')) return 'Audience changes requiring different communication style';
          if (mechanic.includes('Logic Scenario') || mechanic.includes('Argument evaluation')) return 'New evidence invalidates marked assumption';
          if (mechanic.includes('Bias Detector')) return 'Timer reduced by 50% mid-sorting task';
          if (mechanic.includes('Evidence Weighing')) return 'New source appears that contradicts top-ranked evidence';
          if (mechanic.includes('Causal Mapping')) return 'Additional argument step reveals earlier fallacy was valid';
          if (mechanic.includes('Adaptive Logic Loop')) return 'Critical data point appears changing best conclusion';
          if (mechanic.includes('Debate Response')) return 'Counter-argument introduced requiring pivot';
          if (mechanic.includes('Systems Mapping')) return 'Root cause leads to unexpected second-order problem';
          if (mechanic.includes('Solution Generator')) return 'One solution option becomes unavailable mid-selection';
          if (mechanic.includes('Criteria Scoring')) return 'Problem type shifts requiring different tool/method';
          if (mechanic.includes('Execution Simulation')) return 'Resource disappears requiring re-sequencing';
          if (mechanic.includes('Adaptive Fix-Flow')) return 'Implementation rule changes mid-execution';
          if (mechanic.includes('Retrospective Builder')) return 'New outcome data reveals missed insight';
          if (mechanic.includes('Report-Builder') || mechanic.includes('KPI Matching')) return 'KPI priorities reordered by leadership';
          if (mechanic.includes('Decision-Tree') || mechanic.includes('Simulation')) return 'Stakeholder conflict escalates requiring new path';
          return 'Unexpected variable changes the rules mid-task';
        };
        
        const getDefaultInteraction = (mechanic: string) => {
          if (mechanic.includes('Resource Allocation')) return 'Drag-and-drop resource tiles';
          if (mechanic.includes('Ranking') || mechanic.includes('Prioritization')) return 'Drag items to reorder list';
          if (mechanic.includes('Data Analysis') || mechanic.includes('Pattern Recognition')) return 'Click data points to tag patterns';
          if (mechanic.includes('Error-Detection') || mechanic.includes('Diagnosis')) return 'Click on errors to flag them';
          if (mechanic.includes('Divergent') || mechanic.includes('Idea Builder')) return 'Type ideas in text fields';
          if (mechanic.includes('Concept Remix')) return 'Type "How might we..." reframe statements';
          if (mechanic.includes('Bias Detector')) return 'Drag statements into category bins (fact/inference/opinion)';
          if (mechanic.includes('Pattern Transfer') && mechanic.includes('application scenario')) return 'Click feedback points to adjust design';
          if (mechanic.includes('Constraint Challenge') || mechanic.includes('Convergent')) return 'Rate ideas with star ratings';
          if (mechanic.includes('Logic') || mechanic.includes('Argument')) return 'Highlight text to mark assumptions';
          if (mechanic.includes('Evidence') || mechanic.includes('Weighing')) return 'Drag sources into ranking order';
          if (mechanic.includes('Mapping') || mechanic.includes('Systems') || mechanic.includes('Causal')) return 'Drag boxes to create flowchart';
          if (mechanic.includes('Prototype') || mechanic.includes('Refinement')) return 'Click feedback points to adjust';
          if (mechanic.includes('Communication') || mechanic.includes('Report') || mechanic.includes('Pitch')) return 'Type message in text editor';
          if (mechanic.includes('Decision-Tree') || mechanic.includes('Simulation')) return 'Click choice buttons at each fork';
          if (mechanic.includes('Retrospective') || mechanic.includes('Reflective')) return 'Type observations in text fields';
          return 'Click to select options';
        };
        
        const sample = {
          name: `${subCompData.statement.substring(0, 50)}...`,
          description: `Tests: ${subCompData.statement}`,
          industry: 'Technology',
          roleScenario: `You are a professional applying ${subCompData.statement.toLowerCase()} in a realistic scenario`,
          keyElement: getKeyElementDefault(gameMechanic),
          edgeCaseDetails: getEdgeCaseDefault(gameMechanic),
          visualTheme: 'modern',
          interactionMethod: getDefaultInteraction(gameMechanic),
          scenario: `Apply this competency in a realistic work scenario where ${actionCue}. 

You'll interact with a ${gameMechanic.toLowerCase()} interface that requires you to ${subCompData.statement.toLowerCase()}.`,
          playerActions: `ACTION CUE (C-BEN): ${actionCue}

HOW: ${getDefaultInteraction(gameMechanic)} to ${actionCue.toLowerCase()}

The system tracks your actions throughout the ${gameLoop}.`,
          scene1: scenes.scene1,
          scene2: scenes.scene2,
          scene3: scenes.scene3,
          scene4: scenes.scene4 || '',
          edgeCaseTiming: 'mid' as 'early' | 'mid' | 'late',
          edgeCase: `${edgeCase}`,
          uiAesthetic: `Interface style: ${gameMechanic} in a professional workspace. Clean, mobile-optimized design with clear visual feedback.`,
        };
        
        console.log('Setting sample:', sample);
        setFormData(prev => ({ ...prev, ...sample }));
        
        // Set active scenes based on how many scenes have data
        const sceneCount = [sample.scene1, sample.scene2, sample.scene3, sample.scene4].filter(s => s).length;
        setActiveScenes(Math.max(1, sceneCount));
      };
      
      loadSampleAuto();
    }
  }, [selectedSubCompetencies, subCompetencies]);

  // Auto-generate prompt whenever form data changes
  useEffect(() => {
    if (formData.scenario || formData.playerActions || formData.edgeCase) {
      const selectedComp = competencies.find(c => c.id === selectedCompetency);
      const selectedSubs = subCompetencies.filter(sc => selectedSubCompetencies.includes(sc.id));
      
      const competencySection = selectedComp ? `
🎯 Target Competency:
${selectedComp.name} (${selectedComp.cbe_category})

Sub-Competencies Being Tested:
${selectedSubs.map((sc, idx) => `${idx + 1}. ${sc.statement}

📊 PlayOps Framework:
   • Validator Type: ${sc.validator_type || 'Not specified'}
   • Action Cue: ${sc.action_cue || 'Not specified'}
   • Player Action: ${sc.player_action || 'Not specified'}
   • Game Mechanic: ${sc.game_mechanic || 'Not specified'}
   • Game Loop: ${sc.game_loop || 'Not specified'}
   • Backend Data: ${Array.isArray(sc.backend_data_captured) ? sc.backend_data_captured.join(', ') : 'Not specified'}
   
🎯 Scoring Formulas:
   • Level 1 (Needs Work): ${sc.scoring_formula_level_1 || 'Not specified'}
   • Level 2 (Proficient): ${sc.scoring_formula_level_2 || 'Not specified'}
   • Level 3 (Mastery): ${sc.scoring_formula_level_3 || 'Not specified'}
`).join('\n\n') || '[Select 1 sub-competency]'}
` : '';

      const prompt = `Design a 3–6 minute validator mini-game that tests a specific sub-competency through interactive gameplay.

⚙️ Quick Reference:
• Validator: a short interactive mini-game that tests one sub-competency
• Sub-Competency: the specific behavior the validator surfaces through gameplay
• Edge Case: a single twist mid-game that forces adaptation — used to test mastery

All scoring, timing, and proof logic are pre-baked into the system. Focus only on player experience, flow, and the edge-case moment.
${competencySection}
🎮 HOW TO PLAY (CRITICAL - Must be clear and concrete):
The game MUST include a "How to Play" section on the start screen that tells players:
1. WHO they are (role/scenario context)
2. WHAT they need to do (specific, concrete goal)
3. HOW to interact (drag items, click buttons, type text, etc.)
4. WHAT success looks like (what determines Level 1/2/3)
5. TIME limits or constraints

Example: "You are a project manager at TechCo. Your goal: Allocate your team and budget across 4 projects. HOW: Drag team members to projects. Click +/- buttons to adjust budget. Submit when all resources are allocated. You have 3 minutes. Optimal allocation = Mastery level."

Make instructions VISUAL and OBVIOUS - players should immediately understand what to do.

📋 Design Requirements:

Scenario/Theme:
${formData.scenario || '[Describe the narrative wrapper and visual tone]'}

Player Actions:
${formData.playerActions || '[Define how the skill is expressed - e.g., drag-drop, select, type, prioritize]'}

${formData.scene1 || formData.scene2 || formData.scene3 || formData.scene4 ? `Action Scenes / Rounds:
${formData.scene1 ? `Scene 1 (Baseline): ${formData.scene1}` : ''}
${formData.scene2 ? `Scene 2: ${formData.scene2}` : ''}
${formData.scene3 ? `Scene 3: ${formData.scene3}` : ''}
${formData.scene4 ? `Scene 4: ${formData.scene4}` : ''}

Edge-Case Timing: ${formData.edgeCaseTiming.toUpperCase()}
${(() => {
  const filledScenes = [formData.scene1, formData.scene2, formData.scene3, formData.scene4].filter(s => s).length;
  if (filledScenes === 2) return '(Edge-case occurs in Scene 2)';
  if (filledScenes === 3) return formData.edgeCaseTiming === 'early' ? '(Edge-case in Scene 2)' : '(Edge-case in Scene 3)';
  if (filledScenes === 4) {
    if (formData.edgeCaseTiming === 'early') return '(Edge-case in Scene 2)';
    if (formData.edgeCaseTiming === 'mid') return '(Edge-case in Scene 3)';
    return '(Edge-case in Scene 4)';
  }
  return '(System defaults to 3 scenes with Mid timing)';
})()}

Time Allocation: System auto-divides 3 minutes (±30s) across ${[formData.scene1, formData.scene2, formData.scene3, formData.scene4].filter(s => s).length || 3} scenes

` : ''}Edge-Case Moment:
${formData.edgeCase || '[Describe how the disruption appears - e.g., timer cuts in half, data field vanishes, rule changes]'}

Scoring & Result Screens (CRITICAL - include in every game):
${formData.edgeCase ? '✅ Scoring logic included in edge case section above' : '[MUST include: Level 1/2/3 formulas, XP values, result screen descriptions, backend data tracked]'}

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
• Proof ledger integration and XP rewards

📖 EXAMPLE COMPLETE PROMPT (use as reference):
${SAMPLE_PROMPT_WITH_SCORING}`;
      
      setGeneratedPrompt(prompt);
    }
  }, [formData.scenario, formData.playerActions, formData.edgeCase, formData.uiAesthetic, selectedCompetency, selectedSubCompetencies, competencies, subCompetencies]);

  const handleLoadSample = async () => {
    const selectedSub = subCompetencies.find(sub => selectedSubCompetencies[0] === sub.id);
    
    if (!selectedSub) {
      toast.error('Please select a sub-competency first');
      return;
    }

    // Fetch the actual PlayOps framework data for the selected sub-competency
    const { data: subCompData, error: subError } = await supabase
      .from('sub_competencies')
      .select('*')
      .eq('id', selectedSub.id)
      .single();

    if (subError || !subCompData) {
      toast.error('Failed to load framework data');
      return;
    }

    // Build sample using actual PlayOps framework data from the database
    const gameMechanic = subCompData.game_mechanic || 'Interactive Simulation';
    const validatorType = subCompData.validator_type || 'Scenario-Based Simulation';
    
    // Create scene progression based on validator type
    const sceneExamples: { [key: string]: { scene1: string, scene2: string, scene3: string, scene4?: string } } = {
      'Scenario-Based Simulation': {
        scene1: 'Review initial scenario data and make baseline decisions using normal constraints',
        scene2: 'New variable introduced - adjust strategy while maintaining core objectives',
        scene3: '⚡ EDGE CASE: Budget cut 40% - rapidly reallocate resources',
        scene4: 'Finalize and submit optimized plan under new constraints'
      },
      'Communication Product': {
        scene1: 'Draft initial message for target audience with given KPIs',
        scene2: 'Refine messaging based on feedback and additional context',
        scene3: '⚡ EDGE CASE: Audience changed - rewrite for different stakeholder group'
      },
      'Data Analysis': {
        scene1: 'Analyze baseline dataset and identify initial patterns',
        scene2: 'Apply filters and validate findings against criteria',
        scene3: '⚡ EDGE CASE: Contradictory data appears - reconcile and update insights',
        scene4: 'Present final analysis with updated recommendations'
      },
      'Performance Assessment': {
        scene1: 'Evaluate performance using primary metrics',
        scene2: 'Compare against benchmarks and identify gaps',
        scene3: '⚡ EDGE CASE: Priority KPI suddenly changes - pivot evaluation focus'
      }
    };
    
    const scenes = sceneExamples[validatorType] || {
      scene1: 'Complete baseline task using standard approach',
      scene2: 'Adapt to new information or constraint',
      scene3: '⚡ EDGE CASE: Critical rule change - adjust strategy in real-time'
    };
    
    const sample = {
      name: `${subCompData.statement.substring(0, 50)}...`,
      description: `Tests ability to demonstrate: ${subCompData.statement}`,
      industry: 'Technology',
      roleScenario: 'You are a professional working on a time-sensitive challenge',
      keyElement: 'Key resources or data relevant to this challenge',
      edgeCaseDetails: 'Sudden constraint or variable change mid-task',
      visualTheme: 'modern',
      interactionMethod: 'Click to select options',
      scenario: `Apply this competency in a realistic work scenario where ${subCompData.action_cue || 'a challenge arises requiring this skill'}`,
      playerActions: `ACTION CUE (C-BEN): ${subCompData.action_cue || 'Demonstrate this competency'}

HOW: Click to select options to ${(subCompData.action_cue || '').toLowerCase() || 'interact with the challenge'}

The system tracks your actions throughout the ${subCompData.game_loop || 'gameplay'}.`,
      scene1: scenes.scene1,
      scene2: scenes.scene2,
      scene3: scenes.scene3,
      scene4: scenes.scene4 || '',
      edgeCaseTiming: 'mid' as 'early' | 'mid' | 'late',
      edgeCase: `${subCompData.game_loop || 'During gameplay'}, introduce an unexpected challenge that tests adaptability using the ${subCompData.validator_type || 'validation system'}`,
      uiAesthetic: `Design matches the ${subCompData.game_mechanic || 'core mechanic'} with clear visual feedback. Use ${subCompData.validator_type || 'real-time validation'} to provide immediate player feedback.`,
    };
    
    setFormData(sample);
    
    // Set active scenes based on how many scenes have data
    const sceneCount = [sample.scene1, sample.scene2, sample.scene3, sample.scene4].filter(s => s).length;
    setActiveScenes(Math.max(1, sceneCount));
    
    toast.success(`Sample loaded using ${subCompData.statement} framework!`);
  };

  // Reset validation when file changes
  useEffect(() => {
    if (customGameFile) {
      setValidationStatus('not_tested');
      setDraftTemplateId(null);
    }
  }, [customGameFile]);
  
  // Reset validation when template type changes
  useEffect(() => {
    setValidationStatus('not_tested');
    setDraftTemplateId(null);
  }, []); // Reset validation when component mounts

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setValidationStatus('not_tested');
      setDraftTemplateId(null);
      setShowTestWizard(false);
    }
  }, [open]);


  const handleValidateCustomGame = async () => {
    // Check if this is a custom upload or AI-generated template
    const isCustomUpload = customGameFile !== null;
    
    if (isCustomUpload && !customGameFile) {
      toast.error('Please upload a game file first');
      return;
    }
    
    if (!selectedCompetency || selectedSubCompetencies.length === 0) {
      toast.error('Please select competency and sub-competency');
      return;
    }
    
    setValidationStatus('testing');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      let draftTemplateId = '';
      
      // Handle custom upload
      if (isCustomUpload && customGameFile) {
        // Upload file to storage
        const fileExt = customGameFile.name.split('.').pop();
        const fileName = `${user.id}/draft-${Date.now()}.${fileExt}`;
        
        const { error: uploadError} = await supabase.storage
          .from('custom-games')
          .upload(fileName, customGameFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('custom-games')
          .getPublicUrl(fileName);
        
        // Create draft template for testing
        const { data: draftTemplate, error: draftError } = await supabase
          .from('game_templates')
          .insert({
            creator_id: user.id,
            name: formData.name || 'Draft Template',
            description: formData.description,
            template_type: 'custom_upload',
            custom_game_url: publicUrl,
            competency_id: selectedCompetency,
            selected_sub_competencies: selectedSubCompetencies,
            is_published: false,
            game_config: { draft: true }
          })
          .select()
          .single();
        
        if (draftError) throw draftError;
        draftTemplateId = draftTemplate.id;
      } else {
        // Handle AI-generated template - save the prompt and settings
        const { data: draftTemplate, error: draftError } = await supabase
          .from('game_templates')
          .insert({
            creator_id: user.id,
            name: formData.name || 'Draft AI Template',
            description: formData.description,
            template_type: 'ai_generated',
            base_prompt: generatedPrompt,
            competency_id: selectedCompetency,
            selected_sub_competencies: selectedSubCompetencies,
            is_published: false,
            game_config: { draft: true }
          })
          .select()
          .single();
        
        if (draftError) throw draftError;
        draftTemplateId = draftTemplate.id;
      }
      
      setDraftTemplateId(draftTemplateId);
      setShowTestWizard(true);
      
    } catch (error: any) {
      console.error('Validation setup error:', error);
      toast.error('Failed to prepare validation: ' + error.message);
      setValidationStatus('failed');
    }
  };

  const handleTestPreview = async () => {
    if (!generatedPrompt) {
      toast.error('Please fill in the template details first');
      return;
    }

    setGenerating(true);
    try {
      // Demo mode: show mock preview without API call
      if (demoMode) {
        toast.info('🎬 Demo Mode: Showing sample preview');
        
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock HTML preview
        const mockHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Crisis Communication Manager - Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container { max-width: 900px; width: 100%; }
    .header { 
      text-align: center; 
      margin-bottom: 40px;
      padding: 30px;
      background: rgba(255,255,255,0.05);
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .header h1 { 
      font-size: 2.5em; 
      margin-bottom: 15px;
      background: linear-gradient(135deg, #00ff00, #9945ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .timer { 
      font-size: 3em; 
      color: #ff6b6b;
      font-weight: bold;
      margin: 20px 0;
    }
    .scenario { 
      background: rgba(255,255,255,0.08);
      padding: 25px;
      border-radius: 15px;
      margin-bottom: 30px;
      border-left: 4px solid #00ff00;
    }
    .scenario h2 { 
      color: #00ff00;
      margin-bottom: 15px;
    }
    .actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-top: 30px;
    }
    .action-btn {
      background: linear-gradient(135deg, #9945ff, #7b2ff7);
      border: none;
      color: white;
      padding: 20px;
      border-radius: 12px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s;
      text-align: left;
    }
    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(153, 69, 255, 0.4);
    }
    .action-btn strong { 
      display: block;
      margin-bottom: 5px;
      font-size: 18px;
    }
    .demo-badge {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff6b6b;
      padding: 10px 20px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="demo-badge">🎬 DEMO PREVIEW</div>
  <div class="container">
    <div class="header">
      <h1>Crisis Communication Manager</h1>
      <p style="font-size: 1.2em; opacity: 0.9;">Navigate ethical dilemmas in high-pressure crisis scenarios</p>
      <div class="timer">⏱️ 1:45:23</div>
      <p style="color: #ff6b6b;">Time until public expects a statement</p>
    </div>

    <div class="scenario">
      <h2>📢 URGENT: Data Breach Alert</h2>
      <p style="line-height: 1.6; margin-bottom: 15px;">
        A data breach just occurred at TechFlow Inc. affecting 50,000 user accounts. 
        Engineering is investigating the scope, legal is reviewing disclosure requirements, 
        and the CEO wants transparency without causing panic.
      </p>
      <p style="color: #00ff00; font-weight: bold;">
        Your task: Draft an initial public statement and response strategy within 2 hours.
      </p>
    </div>

    <div class="actions">
      <button class="action-btn">
        <strong>📝 Draft Statement</strong>
        <span style="opacity: 0.8;">Compose your public response</span>
      </button>
      <button class="action-btn">
        <strong>📞 Contact Stakeholders</strong>
        <span style="opacity: 0.8;">Prioritize key groups</span>
      </button>
      <button class="action-btn">
        <strong>📱 Choose Channels</strong>
        <span style="opacity: 0.8;">Select communication methods</span>
      </button>
      <button class="action-btn">
        <strong>⏰ Set Timeline</strong>
        <span style="opacity: 0.8;">Plan follow-up communications</span>
      </button>
    </div>
  </div>
</body>
</html>
        `;
        
        setPreviewHtml(mockHtml);
        setPreviewOpen(true);
        toast.success('Demo preview ready! 🎮');
        return;
      }
      
      // Production mode: actual API call
      toast.info('Generating game preview... This may take 30-60 seconds');
      
      // Fetch full sub-competency data including scoring logic
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
      
      const response = await supabase.functions.invoke('generate-game', {
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

      // Check for errors - when there's an HTTP error, the actual error message is in data.error
      if (response.error) {
        const errorMsg = response.data?.error || response.error.message;
        throw new Error(errorMsg);
      }

      if (response.data?.generatedHtml || response.data?.html) {
        setPreviewHtml(response.data.generatedHtml || response.data.html);
        setPreviewOpen(true);
        toast.success('Preview generated! 🎮');
      } else {
        throw new Error('No HTML returned from preview');
      }
    } catch (error: any) {
      console.error('Preview generation error:', error);
      
      // Check for specific error types
      if (error.message?.includes('credits depleted') || error.message?.includes('AI credits')) {
        toast.error('AI credits depleted. Go to Settings → Workspace → Usage to add credits.', {
          duration: 6000
        });
      } else if (error.message?.includes('402') || error.message?.includes('Payment Required')) {
        toast.error('Payment required. Please add credits in Settings → Workspace → Usage.', {
          duration: 6000
        });
      } else if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please wait a moment and try again.', {
          duration: 6000
        });
      } else {
        toast.error('Failed to generate preview: ' + error.message);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft: boolean = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In demo mode, skip database operations and just call callbacks
      if (demoMode) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
        
        if (!saveAsDraft && onTemplateCreated) {
          const mockTemplateId = `demo-template-${Date.now()}`;
          onTemplateCreated({
            id: mockTemplateId,
            name: formData.name,
            template_type: creationMethod === 'ai' ? 'ai_generated' : 'custom_upload',
            selected_sub_competencies: selectedSubCompetencies,
            custom_game_url: customGameFile ? `demo-${customGameFile.name}` : undefined,
            game_config: creationMethod === 'ai' ? { prompt: generatedPrompt } : undefined,
            description: formData.description,
            base_prompt: generatedPrompt,
            design_settings: useCustomDesign ? designSettings : null
          });
        }
        
        toast.success(saveAsDraft ? 'Template saved as draft!' : 'Template created! Ready to test.');
        onSuccess();
        onOpenChange(false);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate scene requirements if any scene is filled
      const filledScenes = [formData.scene1, formData.scene2, formData.scene3, formData.scene4].filter(s => s.trim()).length;
      if (filledScenes === 1 && formData.edgeCase) {
        toast.error('Edge-case requires at least 2 scenes. Please add Scene 2 or remove Scene 1.');
        setLoading(false);
        return;
      }

      // Use generated prompt
      const finalPrompt = generatedPrompt;
      
      let customGameUrl = null;

      // Handle optional custom game file upload
      if (customGameFile) {
        const fileExt = customGameFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError} = await supabase.storage
          .from('custom-games')
          .upload(fileName, customGameFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('custom-games')
          .getPublicUrl(fileName);

        customGameUrl = publicUrl;
      }

      // Handle cover image upload or generation
      let coverImageUrl: string | null = null;
      
      if (coverImageFile) {
        // Upload custom cover
        const fileExt = coverImageFile.name.split('.').pop();
        const fileName = `${user.id}/cover-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('validator-previews')
          .upload(fileName, coverImageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('validator-previews')
          .getPublicUrl(fileName);

        coverImageUrl = publicUrl;
      } else {
        // Generate default cover with creator info
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, company_logo_url, avatar_url')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          const { generateDefaultCover } = await import('@/utils/generateDefaultCover');
          const coverBlob = await generateDefaultCover(
            profile.full_name || 'Creator',
            profile.company_logo_url || undefined,
            profile.avatar_url || undefined
          );

          const fileName = `${user.id}/default-cover-${Date.now()}.png`;
          const { error: uploadError } = await supabase.storage
            .from('validator-previews')
            .upload(fileName, coverBlob);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('validator-previews')
              .getPublicUrl(fileName);
            coverImageUrl = publicUrl;
          }
        }
      }

      if (template?.id) {
        // Update existing template
        const { error } = await supabase
          .from('game_templates')
          .update({
            name: formData.name,
            description: formData.description,
            base_prompt: generatedPrompt,
            template_type: 'ai_generated',
            custom_game_url: customGameUrl,
            preview_image: coverImageUrl,
            competency_id: selectedCompetency || null,
            selected_sub_competencies: selectedSubCompetencies,
            design_settings: useCustomDesign ? designSettings : null,
          })
          .eq('id', template.id);

        if (error) throw error;
        toast.success('Template updated!');
      } else {
        // Create new template
        const { data: newTemplate, error } = await supabase
          .from('game_templates')
          .insert({
            creator_id: user.id,
            name: formData.name,
            description: formData.description,
            base_prompt: finalPrompt,
            template_type: 'ai_generated',
            custom_game_url: customGameUrl,
            preview_image: coverImageUrl,
            competency_id: selectedCompetency || null,
            selected_sub_competencies: selectedSubCompetencies,
            design_settings: useCustomDesign ? designSettings : null,
            is_published: false, // All templates start unpublished
            game_config: {}
          })
          .select()
          .single();

        if (error) throw error;
        
        if (saveAsDraft) {
          toast.success('Template saved as draft! Test it when ready.');
        } else {
          toast.success('Template created! Opening test wizard...');
          // Trigger test wizard if not saving as draft and callback exists
          if (onTemplateCreated && newTemplate) {
            onTemplateCreated({
              id: newTemplate.id,
              name: formData.name,
              template_type: creationMethod === 'ai' ? 'ai_generated' : 'custom_upload',
              selected_sub_competencies: selectedSubCompetencies,
              custom_game_url: customGameUrl,
              game_config: newTemplate.game_config,
              description: formData.description,
              base_prompt: generatedPrompt,
              design_settings: useCustomDesign ? designSettings : null
            });
          }
        }
      }

      onSuccess();
      onOpenChange(false);
      setFormData({ 
        name: '', 
        description: '', 
        industry: '',
        roleScenario: '',
        keyElement: '',
        edgeCaseDetails: '',
        visualTheme: 'modern',
        interactionMethod: '',
        scenario: '', 
        playerActions: '', 
        scene1: '', 
        scene2: '', 
        scene3: '', 
        scene4: '', 
        edgeCaseTiming: 'mid', 
        edgeCase: '', 
        uiAesthetic: '' 
      });
      setActiveScenes(1);
      setCustomGameFile(null);
      setCoverImageFile(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900 border-neon-green text-white pointer-events-auto flex flex-col">
        <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'hsl(var(--neon-green))' }}>
            {template ? 'Edit Template' : 'Create Validator Template'}
          </DialogTitle>
        </DialogHeader>

        {/* Load Sample Button */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {demoMode && customGameFile && (
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                🎬 Demo: Custom Upload Mode
              </Badge>
            )}
          </div>
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

        {/* Main Tabs: Generate vs Test Custom */}
        <Tabs value={creationMethod} onValueChange={(val) => setCreationMethod(val as 'ai' | 'custom')} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 h-auto p-2">
            <TabsTrigger value="ai" className="data-[state=active]:bg-neon-cyan/20 h-auto py-3 px-4">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate New Game
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">Start here - AI creates your validator from scratch</p>
              </div>
            </TabsTrigger>
            <TabsTrigger value="custom" className="data-[state=active]:bg-neon-purple/20 h-auto py-3 px-4">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Test Custom Game
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">Upload and validate your customized HTML file</p>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Quick Reference */}
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

        {creationMethod === 'ai' && (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
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

          {/* Competency Selection */}
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
                <Label>Select Sub-Competencies (1-4) *</Label>
                <p className="text-xs text-gray-400 mb-2">
                  Each sub-competency will be tested in one scene. Select up to 4 for multi-scene games.
                </p>
                <div className="space-y-2 mt-2 max-h-60 overflow-y-auto bg-gray-800 border border-gray-700 rounded-md p-3">
                  {subCompetencies.map((sub) => (
                    <div key={sub.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={sub.id}
                        checked={selectedSubCompetencies.includes(sub.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            if (selectedSubCompetencies.length < 4) {
                              const newSubs = [...selectedSubCompetencies, sub.id];
                              setSelectedSubCompetencies(newSubs);
                              // Auto-map to next available scene
                              const sceneNum = newSubs.length;
                              setSceneSubMapping(prev => ({
                                ...prev,
                                [sceneNum]: sub.id
                              }));
                              // Set active scenes to match sub count
                              setActiveScenes(newSubs.length);
                            } else {
                              toast.error('Maximum 4 sub-competencies allowed');
                            }
                          } else {
                            const newSubs = selectedSubCompetencies.filter(id => id !== sub.id);
                            setSelectedSubCompetencies(newSubs);
                            // Rebuild scene mapping
                            const newMapping: {[key: number]: string} = { 1: '', 2: '', 3: '', 4: '' };
                            newSubs.forEach((subId, idx) => {
                              newMapping[idx + 1] = subId;
                            });
                            setSceneSubMapping(newMapping);
                            // Update active scenes
                            setActiveScenes(Math.max(1, newSubs.length));
                          }
                        }}
                      />
                      <label
                        htmlFor={sub.id}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {sub.statement}
                        {selectedSubCompetencies.includes(sub.id) && (
                          <span className="ml-2 text-xs text-neon-green">
                            → Scene {selectedSubCompetencies.indexOf(sub.id) + 1}
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Selected: {selectedSubCompetencies.length}/4 • Each sub = 1 scene
                </p>
              </div>
            )}

            {/* Show PlayOps Framework for Selected Sub-Competencies */}
            {selectedSubCompetencies.length > 0 && (
              <div className="bg-gray-800 border border-neon-green/30 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-sm" style={{ color: 'hsl(var(--neon-green))' }}>
                  🎮 PlayOps Framework
                </h4>
                <div className="space-y-6">
                  {subCompetencies
                    .filter(sub => selectedSubCompetencies.includes(sub.id))
                    .map((sub, idx) => (
                      <div key={sub.id} className="border-b border-gray-700 pb-4 last:border-0 last:pb-0">
                        <p className="font-semibold text-white mb-3">
                          {idx + 1}. {sub.statement}
                        </p>
                        
                        <div className="space-y-3 pl-4">
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Validator Type</p>
                            <p className="text-sm text-gray-300">{sub.validator_type || 'Not defined'}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Action Cue (to surface)</p>
                            <p className="text-sm text-gray-300">{sub.action_cue || 'Not defined'}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Game Mechanic</p>
                            <p className="text-sm text-gray-300">{sub.game_mechanic || 'Not defined'}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Loop</p>
                            <p className="text-sm text-gray-300">{sub.game_loop || 'Not defined'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-3 italic">
                  🔒 These mechanics are LOCKED per C-BEN standards and will be used in the AI generation.
                </p>
              </div>
            )}

            {/* PlayOps Structure Guide - Show when subs selected */}
            {selectedSubCompetencies.length > 0 && (
              <PlayOpsStructureGuide 
                subCompetencies={subCompetencies}
                selectedSubIds={selectedSubCompetencies}
              />
            )}
            
            {/* Customize Your Scenario - Dynamic Fields */}
            {selectedSubCompetencies.length > 0 && (
              <div className="bg-gray-800 border border-purple-500/30 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-sm text-purple-400">
                  🎨 Customize Your Scenario
                </h4>
                <div className="space-y-4">
                  {/* Industry Context */}
                  <div>
                    <Label htmlFor="industry">Industry / Context *</Label>
                    <Select value={formData.industry} onValueChange={(value) => setFormData({ ...formData, industry: value })}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white z-50">
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Human Resources">Human Resources</SelectItem>
                        <SelectItem value="Communications">Communications</SelectItem>
                        <SelectItem value="Customer Service">Customer Service</SelectItem>
                        <SelectItem value="Technology">Technology / IT</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Legal">Legal</SelectItem>
                        <SelectItem value="Supply Chain">Supply Chain</SelectItem>
                        <SelectItem value="Nonprofit">Nonprofit</SelectItem>
                        <SelectItem value="Government">Government</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Role / Scenario */}
                  <div>
                    <Label htmlFor="roleScenario">Your Role / Scenario (max 150 chars) *</Label>
                    <Input
                      id="roleScenario"
                      value={formData.roleScenario}
                      onChange={(e) => setFormData({ ...formData, roleScenario: e.target.value.slice(0, 150) })}
                      className="bg-gray-700 border-gray-600"
                      placeholder="e.g., You are a project manager facing a budget crisis"
                      maxLength={150}
                    />
                    <p className="text-xs text-gray-400 mt-1">{formData.roleScenario.length}/150</p>
                  </div>

                  {/* Key Element - Universal Field */}
                  <div>
                    <Label htmlFor="keyElement">Key Element (max 100 chars) *</Label>
                    <Input
                      id="keyElement"
                      value={formData.keyElement}
                      onChange={(e) => setFormData({ ...formData, keyElement: e.target.value.slice(0, 100) })}
                      className="bg-gray-700 border-gray-600"
                      placeholder="e.g., Budget & Staff (for allocation), Projects A-D (for ranking), Sales Data (for analysis)"
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      What will the player work with? Examples: resources, items to rank, data to analyze, constraints, ideas
                    </p>
                  </div>

                  {/* Edge Case Details */}
                  <div>
                    <Label htmlFor="edgeCaseDetails">Edge Case Specific Details (max 80 chars) *</Label>
                    <Input
                      id="edgeCaseDetails"
                      value={formData.edgeCaseDetails}
                      onChange={(e) => setFormData({ ...formData, edgeCaseDetails: e.target.value.slice(0, 80) })}
                      className="bg-gray-700 border-gray-600"
                      placeholder="e.g., Budget cut from $100K to $60K"
                      maxLength={80}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      The locked edge case type is: {selectedSub?.game_loop || 'defined by validator'} • Customize the specific details
                    </p>
                  </div>

                  {/* Visual Theme */}
                  <div>
                    <Label htmlFor="visualTheme">Visual Theme *</Label>
                    <Select value={formData.visualTheme} onValueChange={(value) => setFormData({ ...formData, visualTheme: value })}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white z-50">
                        <SelectItem value="modern">Modern / Clean</SelectItem>
                        <SelectItem value="dashboard">Executive Dashboard</SelectItem>
                        <SelectItem value="casual">Casual / Friendly</SelectItem>
                        <SelectItem value="urgent">High-Stakes / Urgent</SelectItem>
                        <SelectItem value="minimal">Minimal / Focus Mode</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Interaction Method - Contextual Dropdown */}
                  {getInteractionMethods().length > 0 && (
                    <div>
                      <Label htmlFor="interactionMethod">How Players Interact (updates Player Actions) *</Label>
                      <Select 
                        value={formData.interactionMethod} 
                        onValueChange={(value) => {
                          setFormData({ ...formData, interactionMethod: value });
                          // Auto-update playerActions template
                          const actionCue = selectedSub?.action_cue || 'perform this action';
                          const updatedActions = `ACTION CUE (C-BEN): ${actionCue}

HOW: ${value} to ${actionCue.toLowerCase()}

The system tracks your actions throughout the ${selectedSub?.game_loop || 'gameplay'}.`;
                          setFormData(prev => ({ ...prev, interactionMethod: value, playerActions: updatedActions }));
                        }}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600">
                          <SelectValue placeholder="Select interaction method" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-white z-50">
                          {getInteractionMethods().map((method) => (
                            <SelectItem key={method} value={method} className="cursor-pointer hover:bg-gray-700 focus:bg-gray-700">
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-400 mt-1">
                        ⚡ This auto-fills the "Player Actions" field below with C-BEN-aligned implementation
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-3 italic">
                  🎨 These fields customize the theme and context only - the core mechanics remain locked per C-BEN.
                </p>
              </div>
            )}
          </div>

          {/* Designer-Controlled Elements */}
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
              <Label htmlFor="playerActions">Player Actions (auto-generated from interaction method) *</Label>
              <Textarea
                id="playerActions"
                value={formData.playerActions}
                onChange={(e) => setFormData({ ...formData, playerActions: e.target.value })}
                rows={5}
                className="bg-gray-800 border-gray-700 font-mono text-sm"
                placeholder="Select interaction method above to auto-fill this template..."
              />
              <p className="text-xs text-gray-400 mt-1">
                ⚠️ CRITICAL: This must implement the locked Action Cue from PlayOps Framework.<br />
                ✅ Auto-filled when you select interaction method - you can edit but must keep Action Cue aligned.<br />
                Template structure: ACTION CUE (locked) + HOW (interaction method) + Tracking note
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Action Scenes / Rounds</Label>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedSubCompetencies.length > 1 
                    ? `You have ${selectedSubCompetencies.length} sub-competencies selected. Each will be tested in its own scene (${selectedSubCompetencies.length} scenes total).`
                    : 'Use this section only if your validator has multiple short scenes (2–4). Each scene is one screen of play (~30–60s).'
                  }
                </p>
              </div>

              {[1, 2, 3, 4].slice(0, Math.max(activeScenes, selectedSubCompetencies.length)).map((sceneNum) => {
                const subForScene = subCompetencies.find(sub => sceneSubMapping[sceneNum] === sub.id);
                return (
                  <div key={sceneNum}>
                    <Label htmlFor={`scene${sceneNum}`} className="text-sm flex items-center gap-2">
                      Scene {sceneNum}
                      {subForScene && (
                        <span className="text-xs text-neon-green font-normal">
                          → Tests: {subForScene.statement.substring(0, 50)}...
                        </span>
                      )}
                    </Label>
                    <Input
                      id={`scene${sceneNum}`}
                      value={formData[`scene${sceneNum}` as keyof typeof formData] as string}
                      onChange={(e) => setFormData({ ...formData, [`scene${sceneNum}`]: e.target.value })}
                      className="bg-gray-800 border-gray-700"
                      placeholder={`e.g., ${subForScene?.action_cue || 'Describe what happens in this scene'}`}
                    />
                  </div>
                );
              })}

              <div className="flex gap-2">
                {selectedSubCompetencies.length <= 1 && activeScenes < 4 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveScenes(prev => Math.min(4, prev + 1))}
                    className="text-xs"
                  >
                    + Add Scene {activeScenes + 1}
                  </Button>
                )}
                {selectedSubCompetencies.length <= 1 && activeScenes > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveScenes(prev => prev - 1);
                      // Clear the last scene when removing
                      if (activeScenes === 4) setFormData({ ...formData, scene4: '' });
                      if (activeScenes === 3) setFormData({ ...formData, scene3: '' });
                      if (activeScenes === 2) setFormData({ ...formData, scene2: '' });
                    }}
                    className="text-xs"
                  >
                    Remove Scene {activeScenes}
                  </Button>
                )}
                {selectedSubCompetencies.length > 1 && (
                  <p className="text-xs text-gray-400">
                    Scenes locked to sub-competency count ({selectedSubCompetencies.length} scenes)
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="edgeCaseTiming">Edge-Case Timing *</Label>
              <Select
                value={formData.edgeCaseTiming}
                onValueChange={(value: 'early' | 'mid' | 'late') => 
                  setFormData({ ...formData, edgeCaseTiming: value })
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select timing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="early">Early (Scene 2 of 3-4)</SelectItem>
                  <SelectItem value="mid">Mid (Scene 2-3 of 3-4)</SelectItem>
                  <SelectItem value="late">Late (Scene 3-4 of 3-4)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1">
                When should the rule-flip or disruption occur during gameplay?
              </p>
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

            {/* Design Customization - Optional per-game overrides */}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  id="useCustomDesign"
                  checked={useCustomDesign}
                  onCheckedChange={(checked) => setUseCustomDesign(checked as boolean)}
                />
                <Label htmlFor="useCustomDesign" className="cursor-pointer">
                  Customize colors & font for this game (optional)
                </Label>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Leave unchecked to use your profile default design. Check to override colors, font, and avatar just for this game.
              </p>
              
              {useCustomDesign && (
                <DesignPaletteEditor
                  palette={designSettings}
                  onChange={setDesignSettings}
                  showAvatar={true}
                  avatarUrl={designSettings.avatar}
                  onAvatarChange={(url) => setDesignSettings({ ...designSettings, avatar: url })}
                  showParticles={true}
                  particleEffect={designSettings.particleEffect}
                  onParticleChange={(effect) => setDesignSettings({ ...designSettings, particleEffect: effect })}
                />
              )}
            </div>
          </div>

          {/* File Uploads Section - Cover Image & Game File */}
          <div className="border-t border-gray-700 pt-4 space-y-4">
            <h3 className="font-semibold text-neon-purple">
              Upload Files
            </h3>
            
            {/* Cover Image Upload */}
            <div>
              <Label htmlFor="cover-image">Cover Image (Optional)</Label>
              <div className="mt-2 space-y-2">
                <input
                  type="file"
                  id="cover-image"
                  accept="image/*"
                  onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="cover-image">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full cursor-pointer"
                    asChild
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {coverImageFile ? coverImageFile.name : 'Upload Cover Image'}
                    </span>
                  </Button>
                </label>
                {!coverImageFile && (
                  <p className="text-xs text-gray-400">
                    If not provided, a default cover will be generated with your profile info
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Generated Prompt Preview */}
          <div className="border-t border-gray-700 pt-4">
            {!generatedPrompt ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                <p className="text-yellow-400 font-semibold mb-2">⚠️ Test Preview Not Available Yet</p>
                <p className="text-sm text-gray-300">
                  Fill in at least the <strong>Scenario</strong>, <strong>Player Actions</strong>, and <strong>Edge-Case Moment</strong> fields above to generate the prompt and unlock the Test Preview button.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <Label>Generated AI Design Prompt</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/validator-demo', '_blank')}
                    >
                      View Sample Demo
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleTestPreview}
                      disabled={generating}
                      className="gap-2 bg-neon-green text-white hover:bg-neon-green/90 animate-pulse border-2 border-neon-green"
                    >
                      <Eye className="h-4 w-4" />
                      {generating ? 'Generating...' : 'Test Preview 🎮'}
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={generatedPrompt}
                  readOnly
                  rows={10}
                  className="bg-gray-800 border-gray-700 text-xs font-mono"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Copy this prompt and paste it into Lovable or another AI designer to build your validator.
                </p>
              </>
            )}
          </div>

          {/* File Uploads Section - Cover Image & Game File */}
          {selectedSubCompetencies.length > 0 && (
            <div className="border-t border-gray-700 pt-4">
              {validationStatus === 'not_tested' && (
                <div className="space-y-3">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-400 font-semibold mb-1">⚠️ Validation Required</p>
                    <p className="text-sm text-gray-300">
                      Before submitting for review, your custom game must pass all automated tests to ensure it meets PlayOps Framework standards.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleValidateCustomGame}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={!formData.name}
                  >
                    🔍 Run Validation Tests
                  </Button>
                </div>
              )}
              
              {validationStatus === 'testing' && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-400 font-semibold mb-1">⏳ Validation In Progress</p>
                  <p className="text-sm text-gray-300">
                    Running automated tests on your game...
                  </p>
                </div>
              )}
              
              {validationStatus === 'passed' && (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-green-400 font-semibold mb-1">✅ Validation Passed!</p>
                    <p className="text-sm text-gray-300">
                      Your game meets all requirements. Choose how to proceed:
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button
                      type="button"
                      className="bg-neon-green text-black hover:bg-neon-green/90 h-auto py-4 flex-col items-start"
                      onClick={() => {
                        if (demoMode) {
                          toast.success('🎬 Demo: Would publish to marketplace');
                          // In demo mode, also add to created templates list
                          if (onTemplateCreated) {
                            const mockTemplateId = `published-${Date.now()}`;
                            onTemplateCreated({
                              id: mockTemplateId,
                              name: formData.name,
                              template_type: creationMethod === 'ai' ? 'ai_generated' : 'custom_upload',
                              selected_sub_competencies: selectedSubCompetencies,
                              description: formData.description,
                              base_prompt: generatedPrompt,
                              design_settings: useCustomDesign ? designSettings : null
                            });
                          }
                          onOpenChange(false);
                        } else {
                          // Real publish logic would go here
                          toast.success('Publishing to marketplace...');
                        }
                      }}
                    >
                      <span className="font-bold text-lg mb-1">📤 Publish to Marketplace</span>
                      <span className="text-xs opacity-80 text-left">Submit for review & make available to brands</span>
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-black h-auto py-4 flex-col items-start"
                      onClick={() => {
                        // Create dummy HTML file for demo
                        const dummyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Crisis Communication Manager - Customizable</title>
  <style>
    /* CUSTOMIZE THESE STYLES */
    :root {
      --primary-color: #00ff00;
      --secondary-color: #9945ff;
      --background: #1a1a2e;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, sans-serif; 
      background: linear-gradient(135deg, var(--background), #16213e);
      color: #fff;
      min-height: 100vh;
      padding: 20px;
    }
    /* ADD YOUR CUSTOM STYLES HERE */
  </style>
</head>
<body>
  <div class="container">
    <h1>Crisis Communication Manager</h1>
    <p>You can customize this HTML/CSS/JS code!</p>
    <!-- CUSTOMIZE THE GAME CONTENT HERE -->
  </div>
  <script>
    // ADD YOUR CUSTOM JAVASCRIPT HERE
    console.log('Customizable game code');
  </script>
</body>
</html>`;
                        
                        // Create and download file
                        const blob = new Blob([dummyHtml], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'crisis-communication-game.html';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        toast.success('📥 Downloaded! Customize and upload below', {
                          description: 'Edit the HTML/CSS/JS, then upload your customized version'
                        });
                      }}
                    >
                      <span className="font-bold text-lg mb-1">💾 Download Code</span>
                      <span className="text-xs opacity-80 text-left">Get HTML/JS to customize further</span>
                    </Button>
                  </div>
                  
                  {/* Upload Customized Version Section */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400 mb-3 text-center">
                      After customizing the downloaded code:
                    </div>
                    <Button
                      type="button"
                      onClick={() => document.getElementById('custom-game-upload')?.click()}
                      variant="outline"
                      className="w-full border-neon-purple text-neon-purple hover:bg-neon-purple/10"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Customized Version
                    </Button>

                    <input
                      id="custom-game-upload"
                      type="file"
                      accept=".html,.htm"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCustomGameFile(file);
                          setValidationStatus('not_tested');
                          toast.success('✅ Custom file uploaded: ' + file.name);
                        }
                      }}
                      className="hidden"
                    />

                    {customGameFile && (
                      <div className="mt-3 p-3 bg-gray-800 border border-neon-purple rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-neon-purple" />
                          <span className="text-sm text-white">{customGameFile.name}</span>
                          <span className="text-xs text-gray-400">
                            ({(customGameFile.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCustomGameFile(null);
                            setValidationStatus('not_tested');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {validationStatus === 'failed' && (
                <div className="space-y-3">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-400 font-semibold mb-1">❌ Validation Failed</p>
                    <p className="text-sm text-gray-300">
                      Your game did not pass all required tests. Please review the test results and upload a corrected version.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleValidateCustomGame}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    🔍 Re-run Validation Tests
                  </Button>
                </div>
              )}
            </div>
          )}


          {/* Info note for AI-generated templates */}
          {!customGameFile && (
            <div className="flex items-center gap-2 text-sm text-blue-300 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/30 mb-4">
              <span>ℹ️</span>
              <span>No upload needed - game auto-generates before testing</span>
            </div>
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
            {template ? (
              <Button 
                type="submit" 
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Template'}
              </Button>
            ) : (
              <>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={loading}
                  className="border-gray-600 text-gray-300"
                >
                  {loading ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-neon-green text-black hover:bg-neon-green/80"
                >
                  {loading ? 'Creating...' : 'Create & Test'}
                </Button>
              </>
            )}
          </div>
        </form>
        )}

        {/* Custom Upload Section */}
        {creationMethod === 'custom' && (
          <div className="space-y-6">
            {/* Template Name (required for validation) */}
            <div>
              <Label htmlFor="custom-name">Template Name *</Label>
              <Input
                id="custom-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-gray-800 border-gray-700"
                placeholder="e.g., My Custom Trade-Off Game"
              />
              <p className="text-xs text-gray-400 mt-1">Required for validation testing</p>
            </div>

            {/* Upload Custom HTML */}
            <div className="border border-gray-700 rounded-lg p-6 bg-gray-800/50">
              <h3 className="font-semibold text-neon-purple mb-4">Upload Your Custom Game</h3>
              <p className="text-sm text-gray-400 mb-4">
                Upload your customized HTML file to run validation tests and ensure it meets PlayOps Framework standards.
              </p>
              
              <input
                id="custom-file-input"
                type="file"
                accept=".html,.htm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCustomGameFile(file);
                    setValidationStatus('not_tested');
                    toast.success('✅ Custom file uploaded: ' + file.name);
                  }
                }}
                className="hidden"
              />
              
              <Button
                type="button"
                onClick={() => document.getElementById('custom-file-input')?.click()}
                variant="outline"
                className="w-full border-neon-purple text-neon-purple hover:bg-neon-purple/10 h-auto py-6"
              >
                <Upload className="mr-2 h-5 w-5" />
                {customGameFile ? 'Change File' : 'Upload HTML File'}
              </Button>

              {customGameFile && (
                <div className="mt-4 p-4 bg-gray-900 border border-neon-purple rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-neon-purple" />
                    <div>
                      <p className="text-sm text-white font-medium">{customGameFile.name}</p>
                      <p className="text-xs text-gray-400">
                        {(customGameFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCustomGameFile(null);
                      setValidationStatus('not_tested');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Validation Section */}
            {customGameFile && (
              <div className="space-y-4">
                {validationStatus === 'not_tested' && (
                  <div className="space-y-3">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <p className="text-yellow-400 font-semibold mb-1">⚠️ Validation Required</p>
                      <p className="text-sm text-gray-300">
                        Your custom game must pass all automated tests to ensure it meets PlayOps Framework standards.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleValidateCustomGame}
                      className="w-full bg-purple-600 hover:bg-purple-700 h-auto py-4"
                      disabled={!formData.name}
                    >
                      <span className="font-bold text-lg">🔍 Run Validation Tests</span>
                    </Button>
                  </div>
                )}
                
                {validationStatus === 'testing' && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 animate-pulse">
                    <p className="text-blue-400 font-semibold mb-1">⏳ Validation In Progress</p>
                    <p className="text-sm text-gray-300">
                      Running automated tests on your game...
                    </p>
                  </div>
                )}
                
                {validationStatus === 'passed' && (
                  <div className="space-y-4">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <p className="text-green-400 font-semibold mb-1">✅ Validation Passed!</p>
                      <p className="text-sm text-gray-300">
                        Your game meets all requirements. You can now publish to the marketplace.
                      </p>
                    </div>
                    <Button
                      type="button"
                      className="w-full bg-neon-green text-black hover:bg-neon-green/90 h-auto py-4"
                      onClick={() => {
                        if (demoMode) {
                          toast.success('🎬 Demo: Would publish to marketplace');
                          onOpenChange(false);
                        } else {
                          toast.success('Publishing to marketplace...');
                        }
                      }}
                    >
                      <span className="font-bold text-lg">📤 Publish to Marketplace</span>
                    </Button>
                  </div>
                )}
                
                {validationStatus === 'failed' && (
                  <div className="space-y-3">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <p className="text-red-400 font-semibold mb-1">❌ Validation Failed</p>
                      <p className="text-sm text-gray-300">
                        Your game did not pass all required tests. Please review the test results, fix the issues, and upload a corrected version.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => document.getElementById('custom-file-input')?.click()}
                      variant="outline"
                      className="w-full border-red-500 text-red-400 hover:bg-red-500/10"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Corrected Version
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Cancel Button */}
            <div className="flex justify-end border-t border-gray-700 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        </div>
      </DialogContent>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[430px] w-full h-[90vh] bg-black border-neon-green p-0">
          <div className="flex flex-col h-full">
            <DialogHeader className="px-4 py-3 border-b border-neon-green/30">
              <DialogTitle className="text-neon-green text-glow-green text-sm">
                Mobile Preview - {formData.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {previewHtml && (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full"
                  title="Game Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                />
              )}
            </div>
            <div className="px-4 py-3 border-t border-neon-green/30">
              <Button
                variant="outline"
                onClick={() => setPreviewOpen(false)}
                className="w-full bg-gray-800 text-white hover:bg-gray-700"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Validation Test Wizard */}
      {draftTemplateId && selectedSubCompetencies[0] && (
        <ValidatorTestWizard
          open={showTestWizard}
          onOpenChange={setShowTestWizard}
          template={{
            id: draftTemplateId,
            name: formData.name || 'Custom Game',
            template_type: customGameFile ? 'custom_upload' : 'ai_generated',
            custom_game_url: '' // Will be fetched from database
          }}
          subCompetency={subCompetencies.find(sc => sc.id === selectedSubCompetencies[0]) || null}
          demoMode={demoMode}
          onComplete={() => {
            setShowTestWizard(false);
            
            // In demo mode, just set validation to passed immediately
            if (demoMode) {
              setValidationStatus('passed');
              toast.success('🎬 Demo: All tests passed! Ready for publish options.');
              return;
            }
            
            // Check test results and update validation status
            supabase
              .from('validator_test_results')
              .select('overall_status')
              .eq('template_id', draftTemplateId)
              .order('tested_at', { ascending: false })
              .limit(1)
              .single()
              .then(({ data }) => {
                if (data?.overall_status === 'passed') {
                  setValidationStatus('passed');
                  toast.success('All tests passed! Ready to submit.');
                } else {
                  setValidationStatus('failed');
                  toast.error('Some tests failed. Please review and fix issues.');
                }
              });
          }}
        />
      )}
    </Dialog>
  );
};
