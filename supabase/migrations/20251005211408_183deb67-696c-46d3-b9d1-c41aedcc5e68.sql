-- Add unique_code column to brand_customizations
ALTER TABLE public.brand_customizations 
ADD COLUMN unique_code text UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_brand_customizations_unique_code 
ON public.brand_customizations(unique_code);

-- Add policy to allow anyone to view published customizations by unique code
CREATE POLICY "Anyone can view published customizations by code"
ON public.brand_customizations
FOR SELECT
USING (published_at IS NOT NULL AND unique_code IS NOT NULL);