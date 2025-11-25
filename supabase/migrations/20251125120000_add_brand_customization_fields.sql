-- Add new branding and design columns to the brand_customizations table
ALTER TABLE public.brand_customizations
ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#00FF00',
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS highlight_color TEXT DEFAULT '#E6F2FF',
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#323130',
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Segoe UI, sans-serif',
ADD COLUMN IF NOT EXISTS cover_photo_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS particle_effect TEXT DEFAULT 'sparkles',
ADD COLUMN IF NOT EXISTS mascot_animation_type public.mascot_animation DEFAULT 'static';

-- Add RLS policy to allow public to see creator profiles for templates
-- This is necessary for the BrandCustomizationDialog to fetch creator defaults
CREATE POLICY "Public can view creator profiles for templates"
ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM game_templates 
    WHERE game_templates.creator_id = profiles.user_id
    AND game_templates.is_published = true
  )
);

-- Loosen RLS policy for brand-logos bucket to allow public reads
DROP POLICY IF EXISTS "Anyone can view brand logos" ON storage.objects;
CREATE POLICY "Public can view brand assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-logos');
