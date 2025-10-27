-- Add visibility enum type
CREATE TYPE public.game_visibility AS ENUM ('public', 'unlisted', 'private');

-- Add visibility column to brand_customizations
ALTER TABLE public.brand_customizations 
ADD COLUMN visibility public.game_visibility NOT NULL DEFAULT 'public';

-- Add comment explaining the visibility options
COMMENT ON COLUMN public.brand_customizations.visibility IS 'public: visible in lobby, unlisted: accessible via direct link only, private: for future internal-only access';

-- Create index for better query performance
CREATE INDEX idx_brand_customizations_visibility ON public.brand_customizations(visibility) WHERE published_at IS NOT NULL;