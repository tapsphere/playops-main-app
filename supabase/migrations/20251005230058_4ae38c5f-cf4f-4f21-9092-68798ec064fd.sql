-- Add fields to support custom uploaded games
ALTER TABLE public.game_templates 
ADD COLUMN template_type text NOT NULL DEFAULT 'ai_generated' CHECK (template_type IN ('ai_generated', 'custom_upload')),
ADD COLUMN custom_game_url text;

-- Add comment for clarity
COMMENT ON COLUMN public.game_templates.template_type IS 'Type of template: ai_generated (uses base_prompt) or custom_upload (uses custom_game_url)';
COMMENT ON COLUMN public.game_templates.custom_game_url IS 'Storage URL for uploaded custom HTML5 game bundle';

-- Make base_prompt nullable since custom uploads won't need it
ALTER TABLE public.game_templates 
ALTER COLUMN base_prompt DROP NOT NULL;