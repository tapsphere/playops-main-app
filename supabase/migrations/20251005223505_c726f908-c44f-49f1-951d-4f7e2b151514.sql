-- Add field to store generated game HTML
ALTER TABLE public.brand_customizations 
ADD COLUMN generated_game_html text;