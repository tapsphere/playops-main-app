-- Create master competencies table
CREATE TABLE public.master_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cbe_category text NOT NULL,
  departments text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Create sub-competencies table
CREATE TABLE public.sub_competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id uuid REFERENCES public.master_competencies(id) ON DELETE CASCADE NOT NULL,
  statement text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create performance indicators table
CREATE TABLE public.performance_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id uuid REFERENCES public.master_competencies(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.master_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_indicators ENABLE ROW LEVEL SECURITY;

-- Public read access for all users
CREATE POLICY "Anyone can view competencies"
ON public.master_competencies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone can view sub-competencies"
ON public.sub_competencies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone can view performance indicators"
ON public.performance_indicators FOR SELECT
TO authenticated
USING (true);

-- Seed with example data
INSERT INTO public.master_competencies (id, name, cbe_category, departments)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Analytical Thinking / Critical Reasoning',
  'Critical Thinking & Problem Solving',
  ARRAY['Operations', 'Data/BI', 'Strategy', 'Product', 'Finance']
);

-- Insert sub-competencies
INSERT INTO public.sub_competencies (competency_id, statement) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Apply logical reasoning to multi-constraint business problems'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Identify and evaluate trade-offs in operational scenarios'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Distinguish valid solutions under incomplete or contradictory inputs'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Adapt reasoning under time pressure and stakeholder conflicts'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Interpret data patterns to support decision-making'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Communicate conclusions aligned with defined KPIs');

-- Insert performance indicators
INSERT INTO public.performance_indicators (competency_id, description) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Solve 50 complex puzzles across ≥7 scenario types'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Achieve ≥90% correctness across tasks'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Maintain median solve time ≤90s'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Successfully handle ≥6 edge cases'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Demonstrate consistent performance across ≥5 sessions over ≥3 weeks');

-- Add competency_id to game_templates
ALTER TABLE public.game_templates 
ADD COLUMN competency_id uuid REFERENCES public.master_competencies(id) ON DELETE SET NULL;

-- Add selected_sub_competencies to game_templates
ALTER TABLE public.game_templates 
ADD COLUMN selected_sub_competencies uuid[] DEFAULT '{}';