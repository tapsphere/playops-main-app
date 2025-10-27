-- Create game_results table to store player scores and competency assessments
CREATE TABLE public.game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id UUID REFERENCES public.game_templates(id) ON DELETE CASCADE,
  customization_id UUID REFERENCES public.brand_customizations(id) ON DELETE SET NULL,
  
  -- Sub-competency being tested
  competency_id UUID REFERENCES public.master_competencies(id) ON DELETE SET NULL,
  sub_competency_id UUID REFERENCES public.sub_competencies(id) ON DELETE SET NULL,
  
  -- Black-and-white scoring metrics (stored as JSONB for flexibility)
  -- Example structure for Analytical Thinking:
  -- {
  --   "constraints_met": 9,
  --   "total_constraints": 10,
  --   "solve_time_ms": 85000,
  --   "rank_correct": true,
  --   "adjustment_ms": 4500,
  --   "missing_flags_correct": 90,
  --   "solution_valid": true,
  --   "post_flip_accuracy": 88,
  --   "recovery_ms": 9500,
  --   "pattern_correct": true,
  --   "insight_time_ms": 55000,
  --   "kpi_match": true,
  --   "word_count": 45,
  --   "submit_time_ms": 42000
  -- }
  scoring_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Calculated pass/fail for this sub-competency
  passed BOOLEAN NOT NULL,
  
  -- Overall proficiency level (calculated from all sub-competencies)
  proficiency_level TEXT CHECK (proficiency_level IN ('needs_work', 'proficient', 'mastery')),
  
  -- Raw gameplay data for audit trail
  gameplay_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

-- Players can view their own results
CREATE POLICY "Users can view own results"
  ON public.game_results
  FOR SELECT
  USING (auth.uid() = user_id);

-- Players can insert their own results
CREATE POLICY "Users can insert own results"
  ON public.game_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Brands can view results for their customizations
CREATE POLICY "Brands can view customization results"
  ON public.game_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brand_customizations
      WHERE brand_customizations.id = game_results.customization_id
      AND brand_customizations.brand_id = auth.uid()
      AND has_role(auth.uid(), 'brand'::app_role)
    )
  );

-- Create indexes for performance
CREATE INDEX idx_game_results_user_id ON public.game_results(user_id);
CREATE INDEX idx_game_results_template_id ON public.game_results(template_id);
CREATE INDEX idx_game_results_customization_id ON public.game_results(customization_id);
CREATE INDEX idx_game_results_competency_id ON public.game_results(competency_id);
CREATE INDEX idx_game_results_sub_competency_id ON public.game_results(sub_competency_id);
CREATE INDEX idx_game_results_created_at ON public.game_results(created_at DESC);