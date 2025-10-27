-- Create role enum
CREATE TYPE public.app_role AS ENUM ('creator', 'brand', 'player');

-- User roles table with security-first design
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles on signup"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Game templates table (Creator-made templates)
CREATE TABLE public.game_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_prompt TEXT,
  game_config JSONB NOT NULL DEFAULT '{}',
  preview_image TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.game_templates ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view published templates
CREATE POLICY "Anyone can view published templates"
  ON public.game_templates
  FOR SELECT
  USING (is_published = true OR creator_id = auth.uid());

-- RLS: Only creators can create templates
CREATE POLICY "Creators can create templates"
  ON public.game_templates
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'creator'));

-- RLS: Creators can update their own templates
CREATE POLICY "Creators can update own templates"
  ON public.game_templates
  FOR UPDATE
  USING (creator_id = auth.uid() AND public.has_role(auth.uid(), 'creator'));

-- RLS: Creators can delete their own templates
CREATE POLICY "Creators can delete own templates"
  ON public.game_templates
  FOR DELETE
  USING (creator_id = auth.uid() AND public.has_role(auth.uid(), 'creator'));

-- Template competencies (CBE system built into templates)
CREATE TABLE public.template_competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.game_templates(id) ON DELETE CASCADE,
  competency_name TEXT NOT NULL,
  sub_competencies TEXT[] DEFAULT '{}',
  scoring_rules JSONB DEFAULT '{}',
  xp_values JSONB DEFAULT '{}',
  behavior_triggers JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.template_competencies ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view competencies for published templates
CREATE POLICY "Anyone can view template competencies"
  ON public.template_competencies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.game_templates
      WHERE id = template_id
        AND (is_published = true OR creator_id = auth.uid())
    )
  );

-- RLS: Creators can manage competencies for their templates
CREATE POLICY "Creators can manage template competencies"
  ON public.template_competencies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.game_templates
      WHERE id = template_id
        AND creator_id = auth.uid()
        AND public.has_role(auth.uid(), 'creator')
    )
  );

-- Brand customizations (AI-modified versions)
CREATE TABLE public.brand_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.game_templates(id) ON DELETE CASCADE,
  customization_prompt TEXT,
  custom_config JSONB DEFAULT '{}',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.brand_customizations ENABLE ROW LEVEL SECURITY;

-- RLS: Brands can view their own customizations
CREATE POLICY "Brands can view own customizations"
  ON public.brand_customizations
  FOR SELECT
  USING (brand_id = auth.uid() AND public.has_role(auth.uid(), 'brand'));

-- RLS: Brands can create customizations
CREATE POLICY "Brands can create customizations"
  ON public.brand_customizations
  FOR INSERT
  WITH CHECK (brand_id = auth.uid() AND public.has_role(auth.uid(), 'brand'));

-- RLS: Brands can update their own customizations
CREATE POLICY "Brands can update own customizations"
  ON public.brand_customizations
  FOR UPDATE
  USING (brand_id = auth.uid() AND public.has_role(auth.uid(), 'brand'));

-- RLS: Brands can delete their own customizations
CREATE POLICY "Brands can delete own customizations"
  ON public.brand_customizations
  FOR DELETE
  USING (brand_id = auth.uid() AND public.has_role(auth.uid(), 'brand'));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_templates_updated_at
  BEFORE UPDATE ON public.game_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_customizations_updated_at
  BEFORE UPDATE ON public.brand_customizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();