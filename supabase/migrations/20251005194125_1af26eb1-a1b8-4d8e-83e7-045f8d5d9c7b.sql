-- Add Marketing and Communication competencies
INSERT INTO master_competencies (name, cbe_category, departments) VALUES
  ('Persuasive Communication', 'Communication & Influence', ARRAY['Marketing', 'Sales', 'Strategy']),
  ('Digital Marketing Strategy', 'Marketing & Growth', ARRAY['Marketing', 'Product', 'Strategy']),
  ('Brand Storytelling', 'Communication & Influence', ARRAY['Marketing', 'Communications', 'Strategy']),
  ('Stakeholder Communication', 'Communication & Influence', ARRAY['Communications', 'Strategy', 'Operations']);

-- Get the IDs of the new competencies for sub-competencies
DO $$
DECLARE
  persuasive_comm_id uuid;
  digital_marketing_id uuid;
  brand_storytelling_id uuid;
  stakeholder_comm_id uuid;
BEGIN
  SELECT id INTO persuasive_comm_id FROM master_competencies WHERE name = 'Persuasive Communication';
  SELECT id INTO digital_marketing_id FROM master_competencies WHERE name = 'Digital Marketing Strategy';
  SELECT id INTO brand_storytelling_id FROM master_competencies WHERE name = 'Brand Storytelling';
  SELECT id INTO stakeholder_comm_id FROM master_competencies WHERE name = 'Stakeholder Communication';

  -- Add sub-competencies for Persuasive Communication
  INSERT INTO sub_competencies (competency_id, statement, player_action, backend_data_captured, scoring_logic) VALUES
    (persuasive_comm_id, 'Craft messages that resonate with target audience values', 'Player selects messaging angles and target audience segments to match', '{"selected_angles": "array", "audience_match_score": "number", "time_ms": "number"}', '{"pass_threshold": 85, "time_limit_ms": 45000}'),
    (persuasive_comm_id, 'Adapt communication style based on stakeholder feedback', 'Player adjusts tone and content based on simulated stakeholder reactions', '{"adaptations_made": "number", "final_approval_score": "number", "iterations": "number"}', '{"pass_threshold": 80, "max_iterations": 3}');

  -- Add sub-competencies for Digital Marketing Strategy
  INSERT INTO sub_competencies (competency_id, statement, player_action, backend_data_captured, scoring_logic) VALUES
    (digital_marketing_id, 'Allocate budget across marketing channels to maximize ROI', 'Player distributes budget sliders across 5 channels based on performance data', '{"allocation_efficiency": "number", "roi_prediction": "number", "solve_time_ms": "number"}', '{"pass_threshold": 90, "time_limit_ms": 60000}'),
    (digital_marketing_id, 'Identify optimal customer acquisition tactics under constraints', 'Player ranks acquisition tactics and sets campaign priorities', '{"ranking_accuracy": "number", "constraint_violations": "number"}', '{"pass_threshold": 85, "max_violations": 1}');

  -- Add sub-competencies for Brand Storytelling
  INSERT INTO sub_competencies (competency_id, statement, player_action, backend_data_captured, scoring_logic) VALUES
    (brand_storytelling_id, 'Construct narrative arc that aligns with brand values', 'Player sequences story beats and selects tone for each segment', '{"narrative_coherence": "number", "brand_alignment_score": "number", "time_ms": "number"}', '{"pass_threshold": 88, "time_limit_ms": 90000}'),
    (brand_storytelling_id, 'Adapt brand message for different platform contexts', 'Player reformats core message for 3 different platforms with character limits', '{"platform_optimization": "array", "consistency_score": "number"}', '{"pass_threshold": 85}');

  -- Add sub-competencies for Stakeholder Communication
  INSERT INTO sub_competencies (competency_id, statement, player_action, backend_data_captured, scoring_logic) VALUES
    (stakeholder_comm_id, 'Prioritize information based on stakeholder needs', 'Player organizes information hierarchy for different stakeholder groups', '{"prioritization_accuracy": "number", "stakeholder_satisfaction": "array"}', '{"pass_threshold": 82}'),
    (stakeholder_comm_id, 'Navigate conflicting stakeholder interests in communication', 'Player crafts message that addresses multiple conflicting perspectives', '{"conflict_resolution_score": "number", "balance_achieved": "boolean"}', '{"pass_threshold": 80, "balance_required": true}');
END $$;