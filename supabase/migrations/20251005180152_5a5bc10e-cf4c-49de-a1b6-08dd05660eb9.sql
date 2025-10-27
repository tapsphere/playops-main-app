-- Add player action and scoring configuration to sub_competencies
ALTER TABLE public.sub_competencies
ADD COLUMN player_action text,
ADD COLUMN backend_data_captured jsonb DEFAULT '[]'::jsonb,
ADD COLUMN scoring_logic jsonb DEFAULT '{}'::jsonb;

-- Update with the provided data for Analytical Thinking sub-competencies
UPDATE public.sub_competencies
SET 
  player_action = 'Player selects or builds a plan satisfying numeric constraints (e.g., ≤ budget, ≥ output, ≤ time).',
  backend_data_captured = '["constraints_met", "total_constraints", "solve_time_ms"]'::jsonb,
  scoring_logic = '{
    "pass_criteria": "constraints_met/total_constraints ≥ 0.90 AND solve_time_ms ≤ 90000",
    "pass_threshold": 0.90,
    "time_limit_ms": 90000
  }'::jsonb
WHERE statement = 'Apply logical reasoning to multi-constraint business problems';

UPDATE public.sub_competencies
SET 
  player_action = 'Player ranks or weights three KPIs (cost/speed/quality).',
  backend_data_captured = '["rank_correct", "adjustment_ms"]'::jsonb,
  scoring_logic = '{
    "pass_criteria": "rank_correct = true AND adjustment_ms ≤ 5000",
    "time_limit_ms": 5000
  }'::jsonb
WHERE statement = 'Identify and evaluate trade-offs in operational scenarios';

UPDATE public.sub_competencies
SET 
  player_action = 'Player flags missing data and selects consistent plan.',
  backend_data_captured = '["missing_flags_correct_pct", "solution_valid"]'::jsonb,
  scoring_logic = '{
    "pass_criteria": "missing_flags_correct_pct ≥ 0.85 AND solution_valid = true",
    "threshold_pct": 0.85
  }'::jsonb
WHERE statement = 'Distinguish valid solutions under incomplete or contradictory inputs';

UPDATE public.sub_competencies
SET 
  player_action = 'Player continues solving after mid-round rule flip.',
  backend_data_captured = '["post_flip_accuracy_pct", "recovery_ms"]'::jsonb,
  scoring_logic = '{
    "pass_criteria": "post_flip_accuracy_pct ≥ 0.85 AND recovery_ms ≤ 10000",
    "accuracy_threshold": 0.85,
    "time_limit_ms": 10000
  }'::jsonb
WHERE statement = 'Adapt reasoning under time pressure and stakeholder conflicts';

UPDATE public.sub_competencies
SET 
  player_action = 'Player identifies correct trend or anomaly in dataset.',
  backend_data_captured = '["pattern_correct", "insight_time_ms"]'::jsonb,
  scoring_logic = '{
    "pass_criteria": "pattern_correct = true AND insight_time_ms ≤ 60000",
    "time_limit_ms": 60000
  }'::jsonb
WHERE statement = 'Interpret data patterns to support decision-making';

UPDATE public.sub_competencies
SET 
  player_action = 'Player selects KPI and submits short textual summary.',
  backend_data_captured = '["kpi_match", "word_count", "submit_time_ms"]'::jsonb,
  scoring_logic = '{
    "pass_criteria": "kpi_match = true AND word_count ≤ 50 AND submit_time_ms ≤ 45000",
    "max_word_count": 50,
    "time_limit_ms": 45000
  }'::jsonb
WHERE statement = 'Communicate conclusions aligned with defined KPIs';